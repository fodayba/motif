import { Result, UniqueEntityID } from '@domain/shared'
import type { ProjectRepository } from '@domain/projects'
import {
  PlannedValue,
  EarnedValue,
  ActualCost,
  ScheduleVariance,
  CostVariance,
  SchedulePerformanceIndex,
  CostPerformanceIndex,
  EstimateAtCompletion,
  ToCompletePerformanceIndex,
  CriticalPath,
  Duration,
  Float,
  ResourceConstraint,
  ResourceProfile,
  LevelingResult,
  Crashing,
  FastTracking,
  CompressionResult,
} from '@domain/projects'
import type {
  CPMTask,
  ResourceAllocationPoint,
  LevelingAlgorithm,
  DelayedTask,
  AppliedCrash,
  AppliedFastTrack,
} from '@domain/projects'
import type { ScheduleRepository } from './schedule-repository'
import type { ResourceRepository } from './resource-repository'
import type {
  EarnedValueMetrics,
  ProjectTaskRecord,
  ResourceCapacity,
  ResourceConflict,
  ResourceAssignment,
} from './types'
import type { CurrencyCode } from '@domain/shared'

export type EarnedValueInput = {
  projectId: string
  asOf?: Date
}

export type ConflictDetectionInput = {
  projectId: string
  windowStart?: Date
  windowEnd?: Date
}

export class SchedulingService {
  private readonly projectRepository: ProjectRepository
  private readonly scheduleRepository: ScheduleRepository
  private readonly resourceRepository: ResourceRepository

  constructor(params: {
    projectRepository: ProjectRepository
    scheduleRepository: ScheduleRepository
    resourceRepository: ResourceRepository
  }) {
    this.projectRepository = params.projectRepository
    this.scheduleRepository = params.scheduleRepository
    this.resourceRepository = params.resourceRepository
  }

  async calculateEarnedValue(
    input: EarnedValueInput,
  ): Promise<Result<EarnedValueMetrics>> {
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const project = await this.projectRepository.findById(projectIdResult.value)
    if (!project) {
      return Result.fail('project not found')
    }

    const tasks = await this.scheduleRepository.listTasks(project.id.toString())

    if (tasks.length === 0) {
      return Result.fail('no schedule tasks available for project')
    }

    const currency = this.ensureSingleCurrency(tasks)
    if (!currency.isSuccess || !currency.value) {
      return Result.fail(currency.error ?? 'mixed task currencies')
    }

    const asOf = input.asOf ?? new Date()

    // Calculate baseline total (Budget at Completion)
    const baselineTotal = tasks.reduce((sum, task) => sum + task.baselineCost.amount, 0)

    // Calculate project schedule boundaries
    const projectStart = new Date(Math.min(...tasks.map((task) => task.plannedStart.getTime())))
    const projectFinish = new Date(Math.max(...tasks.map((task) => task.plannedFinish.getTime())))

    // Create Planned Value using value object
    const pvResult = PlannedValue.calculateFromSchedule(
      baselineTotal,
      currency.value,
      projectStart,
      projectFinish,
      asOf,
    )
    if (!pvResult.isSuccess || !pvResult.value) {
      return Result.fail(pvResult.error ?? 'failed to calculate planned value')
    }

    // Calculate overall progress
    const totalProgress = tasks.reduce(
      (sum, task) => sum + task.baselineCost.amount * (task.percentComplete / 100),
      0,
    )
    const percentComplete = baselineTotal > 0 ? (totalProgress / baselineTotal) * 100 : 0

    // Create Earned Value using value object
    const evResult = EarnedValue.calculateFromProgress(
      baselineTotal,
      currency.value,
      percentComplete,
      asOf,
    )
    if (!evResult.isSuccess || !evResult.value) {
      return Result.fail(evResult.error ?? 'failed to calculate earned value')
    }

    // Calculate total actual cost
    let totalActualCost = 0
    for (const task of tasks) {
      try {
        totalActualCost += this.deriveActualCost(task)
      } catch (error) {
        return Result.fail(
          error instanceof Error ? error.message : 'failed to evaluate actual cost',
        )
      }
    }

    // Create Actual Cost using value object
    const acResult = ActualCost.create({
      amount: totalActualCost,
      currency: currency.value,
      asOfDate: asOf,
    })
    if (!acResult.isSuccess || !acResult.value) {
      return Result.fail(acResult.error ?? 'failed to create actual cost')
    }

    // Calculate variances using value objects
    const svResult = ScheduleVariance.calculateFromEVAndPV(evResult.value, pvResult.value)
    if (!svResult.isSuccess || !svResult.value) {
      return Result.fail(svResult.error ?? 'failed to calculate schedule variance')
    }

    const cvResult = CostVariance.calculateFromEVAndAC(evResult.value, acResult.value)
    if (!cvResult.isSuccess || !cvResult.value) {
      return Result.fail(cvResult.error ?? 'failed to calculate cost variance')
    }

    // Calculate performance indices using value objects
    const spiResult = SchedulePerformanceIndex.calculateFromEVAndPV(
      evResult.value,
      pvResult.value,
    )
    if (!spiResult.isSuccess || !spiResult.value) {
      return Result.fail(spiResult.error ?? 'failed to calculate SPI')
    }

    const cpiResult = CostPerformanceIndex.calculateFromEVAndAC(evResult.value, acResult.value)
    if (!cpiResult.isSuccess || !cpiResult.value) {
      return Result.fail(cpiResult.error ?? 'failed to calculate CPI')
    }

    // Calculate forecast using value objects
    const eacResult = EstimateAtCompletion.calculateUsingCPI(
      baselineTotal,
      currency.value,
      cpiResult.value,
    )
    if (!eacResult.isSuccess || !eacResult.value) {
      return Result.fail(eacResult.error ?? 'failed to calculate EAC')
    }

    const varianceAtCompletion = baselineTotal - eacResult.value.amount

    return Result.ok({
      projectId: project.id.toString(),
      asOf,
      currency: currency.value,
      plannedValue: pvResult.value.amount,
      earnedValue: evResult.value.amount,
      actualCost: acResult.value.amount,
      scheduleVariance: svResult.value.amount,
      costVariance: cvResult.value.amount,
      cpi: cpiResult.value.value,
      spi: spiResult.value.value,
      estimateAtCompletion: eacResult.value.amount,
      varianceAtCompletion,
    })
  }

  async detectResourceConflicts(
    input: ConflictDetectionInput,
  ): Promise<Result<ResourceConflict[]>> {
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const project = await this.projectRepository.findById(projectIdResult.value)
    if (!project) {
      return Result.fail('project not found')
    }

    const tasks = await this.scheduleRepository.listTasks(project.id.toString())
    if (tasks.length === 0) {
      return Result.ok([])
    }

    const windowStart = input.windowStart ?? new Date(-8640000000000000)
    const windowEnd = input.windowEnd ?? new Date(8640000000000000)

    const taskMap = new Map<string, ProjectTaskRecord>()
    const assignmentsByResource = new Map<string, ResourceAssignment[]>()

    for (const task of tasks) {
      taskMap.set(task.id, task)
      for (const assignment of task.resourceAssignments) {
        if (!this.overlapsWindow(assignment.start, assignment.finish, windowStart, windowEnd)) {
          continue
        }
        const list = assignmentsByResource.get(assignment.resourceId) ?? []
        list.push(assignment)
        assignmentsByResource.set(assignment.resourceId, list)
      }
    }

    const conflicts: ResourceConflict[] = []

    for (const [resourceId, assignments] of assignmentsByResource.entries()) {
      if (assignments.length <= 1) {
        continue
      }

      const capacity = await this.resolveCapacity(resourceId)
      const resourceConflicts = this.findConflictsForResource(
        resourceId,
        assignments,
        capacity,
        taskMap,
        windowStart,
        windowEnd,
      )

      conflicts.push(...resourceConflicts)
    }

    return Result.ok(conflicts)
  }

  /**
   * Calculate variance analysis for a project
   * Returns detailed variance metrics and performance status
   */
  async calculateVarianceAnalysis(input: EarnedValueInput): Promise<
    Result<{
      scheduleVariance: ScheduleVariance
      costVariance: CostVariance
      schedulePerformanceIndex: SchedulePerformanceIndex
      costPerformanceIndex: CostPerformanceIndex
      scheduleStatus: string
      budgetStatus: string
      performanceDescription: string
    }>
  > {
    // First get the EVM metrics
    const evmResult = await this.calculateEarnedValue(input)
    if (!evmResult.isSuccess || !evmResult.value) {
      return Result.fail(evmResult.error ?? 'failed to calculate EVM metrics')
    }

    const evm = evmResult.value

    // Recreate value objects from the metrics
    const pvResult = PlannedValue.create({
      amount: evm.plannedValue,
      currency: evm.currency,
      asOfDate: evm.asOf,
    })
    if (!pvResult.isSuccess || !pvResult.value) {
      return Result.fail('failed to create PV value object')
    }

    const evResult = EarnedValue.create({
      amount: evm.earnedValue,
      currency: evm.currency,
      asOfDate: evm.asOf,
    })
    if (!evResult.isSuccess || !evResult.value) {
      return Result.fail('failed to create EV value object')
    }

    const acResult = ActualCost.create({
      amount: evm.actualCost,
      currency: evm.currency,
      asOfDate: evm.asOf,
    })
    if (!acResult.isSuccess || !acResult.value) {
      return Result.fail('failed to create AC value object')
    }

    // Calculate variances
    const svResult = ScheduleVariance.calculateFromEVAndPV(evResult.value, pvResult.value)
    if (!svResult.isSuccess || !svResult.value) {
      return Result.fail('failed to calculate schedule variance')
    }

    const cvResult = CostVariance.calculateFromEVAndAC(evResult.value, acResult.value)
    if (!cvResult.isSuccess || !cvResult.value) {
      return Result.fail('failed to calculate cost variance')
    }

    // Calculate performance indices
    const spiResult = SchedulePerformanceIndex.calculateFromEVAndPV(
      evResult.value,
      pvResult.value,
    )
    if (!spiResult.isSuccess || !spiResult.value) {
      return Result.fail('failed to calculate SPI')
    }

    const cpiResult = CostPerformanceIndex.calculateFromEVAndAC(evResult.value, acResult.value)
    if (!cpiResult.isSuccess || !cpiResult.value) {
      return Result.fail('failed to calculate CPI')
    }

    // Generate comprehensive performance description
    const scheduleStatus = svResult.value.isAheadOfSchedule
      ? 'ahead'
      : svResult.value.isOnSchedule
        ? 'on track'
        : 'behind'
    const budgetStatus = cvResult.value.isUnderBudget
      ? 'under budget'
      : cvResult.value.isOnBudget
        ? 'on budget'
        : 'over budget'

    let performanceDescription = ''
    if (spiResult.value.value >= 1.0 && cpiResult.value.value >= 1.0) {
      performanceDescription = 'Project is on schedule and under budget - excellent performance'
    } else if (spiResult.value.value >= 1.0 && cpiResult.value.value < 1.0) {
      performanceDescription = 'Project is on schedule but over budget - cost management needed'
    } else if (spiResult.value.value < 1.0 && cpiResult.value.value >= 1.0) {
      performanceDescription = 'Project is behind schedule but under budget - schedule recovery needed'
    } else {
      performanceDescription =
        'Project is behind schedule and over budget - immediate corrective action required'
    }

    return Result.ok({
      scheduleVariance: svResult.value,
      costVariance: cvResult.value,
      schedulePerformanceIndex: spiResult.value,
      costPerformanceIndex: cpiResult.value,
      scheduleStatus,
      budgetStatus,
      performanceDescription,
    })
  }

  /**
   * Calculate To-Complete Performance Index (TCPI)
   * Indicates the efficiency that must be achieved on remaining work
   */
  async calculateTCPI(
    input: EarnedValueInput & {
      useEAC?: boolean // If true, calculate TCPI based on EAC instead of BAC
    },
  ): Promise<
    Result<{
      tcpi: ToCompletePerformanceIndex
      isAchievable: boolean
      recommendation: string
    }>
  > {
    const evmResult = await this.calculateEarnedValue(input)
    if (!evmResult.isSuccess || !evmResult.value) {
      return Result.fail(evmResult.error ?? 'failed to calculate EVM metrics')
    }

    const evm = evmResult.value

    // Get project to determine BAC
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail('invalid projectId')
    }

    const project = await this.projectRepository.findById(projectIdResult.value)
    if (!project) {
      return Result.fail('project not found')
    }

    const tasks = await this.scheduleRepository.listTasks(project.id.toString())
    const budgetAtCompletion = tasks.reduce((sum, task) => sum + task.baselineCost.amount, 0)

    // Create value objects
    const evResult = EarnedValue.create({
      amount: evm.earnedValue,
      currency: evm.currency,
      asOfDate: evm.asOf,
    })
    if (!evResult.isSuccess || !evResult.value) {
      return Result.fail('failed to create EV value object')
    }

    const acResult = ActualCost.create({
      amount: evm.actualCost,
      currency: evm.currency,
      asOfDate: evm.asOf,
    })
    if (!acResult.isSuccess || !acResult.value) {
      return Result.fail('failed to create AC value object')
    }

    // Calculate TCPI
    let tcpiResult: Result<ToCompletePerformanceIndex>
    if (input.useEAC && evm.estimateAtCompletion) {
      tcpiResult = ToCompletePerformanceIndex.calculateBasedOnEAC(
        budgetAtCompletion,
        evm.earnedValue,
        evm.actualCost,
        evm.estimateAtCompletion,
        evm.currency,
        evm.asOf,
      )
    } else {
      tcpiResult = ToCompletePerformanceIndex.calculateBasedOnBAC(
        budgetAtCompletion,
        evm.earnedValue,
        evm.actualCost,
        evm.currency,
        evm.asOf,
      )
    }

    if (!tcpiResult.isSuccess || !tcpiResult.value) {
      return Result.fail(tcpiResult.error ?? 'failed to calculate TCPI')
    }

    const tcpi = tcpiResult.value
    const isAchievable = tcpi.isAchievable

    let recommendation = ''
    if (tcpi.value > 1.2) {
      recommendation =
        'TCPI indicates very difficult target - consider revising budget or reducing scope'
    } else if (tcpi.value > 1.1) {
      recommendation =
        'TCPI indicates challenging target - implement strict cost controls and efficiency improvements'
    } else if (tcpi.value > 1.0) {
      recommendation = 'TCPI indicates need for improved efficiency - maintain cost discipline'
    } else if (tcpi.value >= 0.9) {
      recommendation = 'TCPI indicates achievable target - maintain current performance'
    } else {
      recommendation = 'TCPI indicates comfortable target - project has cost buffer available'
    }

    return Result.ok({
      tcpi,
      isAchievable,
      recommendation,
    })
  }

  private deriveActualCost(task: ProjectTaskRecord): number {
    if (task.actualCost) {
      if (task.actualCost.currency !== task.baselineCost.currency) {
        throw new Error('task actual cost currency mismatch baseline currency')
      }
      return task.actualCost.amount
    }

    if (
      task.actualLaborHours !== undefined &&
      task.actualLaborHours >= 0 &&
      task.baselineLaborHours > 0
    ) {
      const ratio = task.actualLaborHours / task.baselineLaborHours
      return task.baselineCost.amount * Math.min(ratio, 1)
    }

    return task.baselineCost.amount * (task.percentComplete / 100)
  }

  private overlapsWindow(
    start: Date,
    finish: Date,
    windowStart: Date,
    windowEnd: Date,
  ): boolean {
    return start <= windowEnd && finish >= windowStart
  }

  private async resolveCapacity(resourceId: string): Promise<ResourceCapacity> {
    const capacity = await this.resourceRepository.getCapacity(resourceId)
    return capacity ?? { resourceId, maxAllocationPercent: 100 }
  }

  private findConflictsForResource(
    resourceId: string,
    assignments: ResourceAssignment[],
    capacity: ResourceCapacity,
    taskMap: Map<string, ProjectTaskRecord>,
    windowStart: Date,
    windowEnd: Date,
  ): ResourceConflict[] {
    const sortedEvents = assignments
      .flatMap((assignment) => [
        { time: assignment.start.getTime(), type: 'start' as const, assignment },
        { time: assignment.finish.getTime(), type: 'end' as const, assignment },
      ])
      .sort((a, b) => {
        if (a.time === b.time) {
          return a.type === 'start' && b.type === 'end' ? -1 : 1
        }
        return a.time - b.time
      })

    const active = new Set<ResourceAssignment>()
    const conflicts: ResourceConflict[] = []

    for (let index = 0; index < sortedEvents.length; index += 1) {
      const current = sortedEvents[index]
      if (current.type === 'start') {
        active.add(current.assignment)
      } else {
        active.delete(current.assignment)
      }

      const nextTime = sortedEvents[index + 1]?.time
      if (!nextTime || nextTime === current.time) {
        continue
      }

      if (active.size === 0) {
        continue
      }

      const totalAllocation = Array.from(active).reduce(
        (sum, assignment) => sum + assignment.allocationPercent,
        0,
      )

      if (totalAllocation <= capacity.maxAllocationPercent) {
        continue
      }

      const conflictStart = new Date(Math.max(current.time, windowStart.getTime()))
      const conflictEnd = new Date(Math.min(nextTime, windowEnd.getTime()))

      if (conflictEnd <= conflictStart) {
        continue
      }

      const assignmentsDetails = Array.from(active).map((assignment) => {
        const task = taskMap.get(assignment.taskId)
        return {
          taskId: assignment.taskId,
          taskName: task?.name ?? 'Unknown Task',
          allocationPercent: assignment.allocationPercent,
          start: assignment.start,
          finish: assignment.finish,
        }
      })

      const lastConflict = conflicts.at(-1)
      const sameWindow =
        lastConflict &&
        lastConflict.resourceId === resourceId &&
        lastConflict.conflictEnd.getTime() === conflictStart.getTime() &&
        lastConflict.totalAllocationPercent === totalAllocation &&
        this.equalAssignments(lastConflict.assignments, assignmentsDetails)

      if (sameWindow) {
        lastConflict.conflictEnd = conflictEnd
        continue
      }

      conflicts.push({
        resourceId,
        conflictStart,
        conflictEnd,
        totalAllocationPercent: totalAllocation,
        capacityPercent: capacity.maxAllocationPercent,
        assignments: assignmentsDetails,
      })
    }

    return conflicts
  }

  private equalAssignments(
    a: ResourceConflict['assignments'],
    b: ResourceConflict['assignments'],
  ): boolean {
    if (a.length !== b.length) {
      return false
    }

    const sortKey = (item: ResourceConflict['assignments'][number]) =>
      `${item.taskId}:${item.allocationPercent}`

    const sortedA = [...a].sort((left, right) => (sortKey(left) > sortKey(right) ? 1 : -1))
    const sortedB = [...b].sort((left, right) => (sortKey(left) > sortKey(right) ? 1 : -1))

    return sortedA.every((value, index) => {
      const other = sortedB[index]
      return (
        value.taskId === other.taskId &&
        value.allocationPercent === other.allocationPercent
      )
    })
  }

  private ensureSingleCurrency(
    tasks: ProjectTaskRecord[],
  ): Result<CurrencyCode> {
    const currencies = new Set(tasks.map((task) => task.baselineCost.currency))
    if (currencies.size !== 1) {
      return Result.fail('tasks must share a common baseline currency')
    }

    return Result.ok(currencies.values().next().value as CurrencyCode)
  }

  private parseUniqueId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }

  /**
   * Calculate the critical path for a project using CPM
   */
  async calculateCriticalPath(input: {
    projectId: string
    includeFloat?: boolean
  }): Promise<Result<{
    criticalPath: CriticalPath
    tasks: Array<{
      taskId: string
      taskName: string
      duration: Duration
      float: Float
      isCritical: boolean
      earliestStart: Date
      earliestFinish: Date
      latestStart: Date
      latestFinish: Date
    }>
    projectDuration: Duration
    totalFloat: Record<string, number>
  }>> {
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const project = await this.projectRepository.findById(projectIdResult.value)
    if (!project) {
      return Result.fail('project not found')
    }

    const tasks = await this.scheduleRepository.listTasks(project.id.toString())
    if (tasks.length === 0) {
      return Result.fail('no tasks found for project')
    }

    // Convert project tasks to CPMTask format
    const cpmTasks: CPMTask[] = tasks.map((task) => ({
      id: task.id,
      duration: task.duration,
      predecessorIds: task.predecessorIds || [],
    }))

    // Calculate critical path
    const cpResult = CriticalPath.calculate(cpmTasks)
    if (!cpResult.isSuccess || !cpResult.value) {
      return Result.fail(cpResult.error ?? 'failed to calculate critical path')
    }

    const criticalPath = cpResult.value

    // Build detailed task information
    const taskDetails = cpmTasks.map((cpmTask) => {
      const originalTask = tasks.find((t) => t.id === cpmTask.id)!
      return {
        taskId: cpmTask.id,
        taskName: originalTask.name,
        duration: cpmTask.duration!,
        float: cpmTask.float!,
        isCritical: criticalPath.containsTask(cpmTask.id),
        earliestStart: cpmTask.earliestStart!,
        earliestFinish: cpmTask.earliestFinish!,
        latestStart: cpmTask.latestStart!,
        latestFinish: cpmTask.latestFinish!,
      }
    })

    const totalFloat: Record<string, number> = {}
    cpmTasks.forEach((task) => {
      if (task.float) {
        totalFloat[task.id] = task.float.totalFloat.toHours()
      }
    })

    return Result.ok({
      criticalPath,
      tasks: taskDetails,
      projectDuration: criticalPath.totalDuration,
      totalFloat,
    })
  }

  /**
   * Level resources to eliminate overallocations
   */
  async levelResources(input: {
    projectId: string
    algorithm?: LevelingAlgorithm
    maxScheduleExtensionDays?: number
  }): Promise<Result<{
    leveling: LevelingResult
    delayedTasks: DelayedTask[]
    resourceProfiles: Array<{
      resourceId: string
      resourceName: string
      originalPeakAllocation: number
      leveledPeakAllocation: number
      smoothness: number
      isLevel: boolean
    }>
    scheduleImpact: {
      extensionDays: number
      extensionPercent: number
    }
    recommendation: {
      accept: boolean
      reason: string
    }
  }>> {
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const project = await this.projectRepository.findById(projectIdResult.value)
    if (!project) {
      return Result.fail('project not found')
    }

    const tasks = await this.scheduleRepository.listTasks(project.id.toString())
    if (tasks.length === 0) {
      return Result.fail('no tasks found for project')
    }

    const resources = await this.resourceRepository.listResources(project.id.toString())
    if (resources.length === 0) {
      return Result.fail('no resources found for project')
    }

    // Create resource constraints
    const constraints: ResourceConstraint[] = []
    for (const resource of resources) {
      const constraintResult = ResourceConstraint.create({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type as any,
        maxUnitsAvailable: resource.maxUnits,
        costPerUnit: resource.costPerHour,
      })
      if (constraintResult.isSuccess && constraintResult.value) {
        constraints.push(constraintResult.value)
      }
    }

    // Build resource profiles (allocation over time)
    const profiles: ResourceProfile[] = []
    for (const constraint of constraints) {
      const allocations: ResourceAllocationPoint[] = []
      
      // Calculate daily allocations
      const projectStart = new Date(Math.min(...tasks.map((t) => t.plannedStart.getTime())))
      const projectEnd = new Date(Math.max(...tasks.map((t) => t.plannedFinish.getTime())))
      
      let currentDate = new Date(projectStart)
      while (currentDate <= projectEnd) {
        const dayTasks = tasks.filter(
          (t) => t.plannedStart <= currentDate && t.plannedFinish >= currentDate
        )
        
        let unitsAllocated = 0
        const taskIds: string[] = []
        
        for (const task of dayTasks) {
          const assignment = task.resourceAssignments.find(
            (a) => a.resourceId === constraint.resourceId
          )
          if (assignment) {
            unitsAllocated += assignment.units
            taskIds.push(task.id)
          }
        }
        
        if (unitsAllocated > 0) {
          allocations.push({
            date: new Date(currentDate),
            unitsAllocated,
            taskIds,
          })
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      const profileResult = ResourceProfile.create(constraint, allocations)
      if (profileResult.isSuccess && profileResult.value) {
        profiles.push(profileResult.value)
      }
    }

    // Calculate original project duration
    const originalDuration = Duration.fromDays(
      (new Date(Math.max(...tasks.map((t) => t.plannedFinish.getTime()))).getTime() -
        new Date(Math.min(...tasks.map((t) => t.plannedStart.getTime()))).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    if (!originalDuration.isSuccess || !originalDuration.value) {
      return Result.fail('failed to calculate original duration')
    }

    // Perform leveling
    const algorithm = input.algorithm || 'minimum-total-float'
    const delayedTasks: DelayedTask[] = []
    
    // Identify overallocated periods
    const overallocations = profiles.flatMap((p) => p.getOverallocationPeriods())
    
    if (overallocations.length > 0) {
      // Simulate delaying tasks to resolve overallocations
      for (const overallocation of overallocations.slice(0, 3)) {
        for (const taskId of overallocation.affectedTasks.slice(0, 2)) {
          const task = tasks.find((t) => t.id === taskId)
          if (task) {
            const delayHours = overallocation.peakOverallocation * 8
            delayedTasks.push({
              taskId: task.id,
              taskName: task.name,
              originalStart: task.plannedStart,
              newStart: new Date(task.plannedStart.getTime() + delayHours * 60 * 60 * 1000),
              delayHours,
              reason: `Resolve overallocation of ${overallocation.peakOverallocation.toFixed(1)} units`,
            })
          }
        }
      }
    }

    const leveledDuration = Duration.fromDays(
      originalDuration.value.toDays() + delayedTasks.reduce((sum, t) => sum + t.delayHours / 8, 0)
    )
    if (!leveledDuration.isSuccess || !leveledDuration.value) {
      return Result.fail('failed to calculate leveled duration')
    }

    // Create leveling result
    const levelingResult = LevelingResult.create({
      originalDuration: originalDuration.value,
      leveledDuration: leveledDuration.value,
      delayedTasks,
      resourceProfiles: profiles,
      algorithm,
    })
    
    if (!levelingResult.isSuccess || !levelingResult.value) {
      return Result.fail(levelingResult.error ?? 'failed to create leveling result')
    }

    const leveling = levelingResult.value

    // Build resource profile summaries
    const resourceProfileSummaries = profiles.map((profile) => ({
      resourceId: profile.constraint.resourceId,
      resourceName: profile.constraint.resourceName,
      originalPeakAllocation: profile.getPeakAllocation(),
      leveledPeakAllocation: profile.getPeakAllocation(),
      smoothness: profile.calculateSmoothness(),
      isLevel: profile.isLevel(),
    }))

    const scheduleImpact = {
      extensionDays: leveling.getScheduleImpactDays(),
      extensionPercent: leveling.metrics.scheduleImpactPercent,
    }

    const recommendation = leveling.getRecommendation()

    return Result.ok({
      leveling,
      delayedTasks,
      resourceProfiles: resourceProfileSummaries,
      scheduleImpact,
      recommendation: {
        accept: recommendation.status === 'accept',
        reason: recommendation.message,
      },
    })
  }

  /**
   * Compress schedule using crashing and/or fast tracking
   */
  async compressSchedule(input: {
    projectId: string
    targetReductionDays: number
    maxCostIncrease?: number
    maxRiskScore?: number
  }): Promise<Result<{
    compression: CompressionResult
    appliedCrashes: AppliedCrash[]
    appliedFastTracks: AppliedFastTrack[]
    timeSaved: { days: number; hours: number }
    costImpact: { totalIncrease: number; costPerDaySaved: number }
    riskAssessment: { overallScore: number; level: 'low' | 'moderate' | 'high' | 'extreme' }
    recommendation: { accept: boolean; reason: string; confidence: 'high' | 'medium' | 'low' }
    topOpportunities: Array<{
      type: 'crashing' | 'fast-tracking'
      taskName: string
      timeSavings: number
      cost: number
      efficiency: number
    }>
  }>> {
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const project = await this.projectRepository.findById(projectIdResult.value)
    if (!project) {
      return Result.fail('project not found')
    }

    const tasks = await this.scheduleRepository.listTasks(project.id.toString())
    if (tasks.length === 0) {
      return Result.fail('no tasks found for project')
    }

    // Calculate original project duration
    const originalDuration = Duration.fromDays(
      (new Date(Math.max(...tasks.map((t) => t.plannedFinish.getTime()))).getTime() -
        new Date(Math.min(...tasks.map((t) => t.plannedStart.getTime()))).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    if (!originalDuration.isSuccess || !originalDuration.value) {
      return Result.fail('failed to calculate original duration')
    }

    // Identify crashing opportunities
    const crashingOptions: Crashing[] = []
    for (const task of tasks.filter((t) => t.isCritical)) {
      if (task.crashData) {
        const crashResult = Crashing.create({
          taskId: task.id,
          taskName: task.name,
          normalDuration: task.duration,
          crashedDuration: task.crashData.crashedDuration,
          normalCost: task.baselineCost.amount,
          crashedCost: task.crashData.crashedCost,
        })
        if (crashResult.isSuccess && crashResult.value) {
          crashingOptions.push(crashResult.value)
        }
      }
    }

    // Identify fast tracking opportunities
    const fastTrackingOptions: FastTracking[] = []
    for (const task of tasks.filter((t) => t.isCritical)) {
      for (const successorId of task.successorIds || []) {
        const successor = tasks.find((t) => t.id === successorId)
        if (successor && task.fastTrackData) {
          const ftResult = FastTracking.create({
            taskId: task.id,
            taskName: task.name,
            successorId: successor.id,
            successorName: successor.name,
            originalLag: task.fastTrackData.originalLag,
            proposedLag: task.fastTrackData.proposedLag,
            riskLevel: task.fastTrackData.riskLevel as any,
            riskDescription: task.fastTrackData.riskDescription,
            reworkProbability: task.fastTrackData.reworkProbability,
          })
          if (ftResult.isSuccess && ftResult.value) {
            fastTrackingOptions.push(ftResult.value)
          }
        }
      }
    }

    // Apply compression strategy
    const appliedCrashes: AppliedCrash[] = []
    const appliedFastTracks: AppliedFastTrack[] = []
    let totalTimeSaved = 0
    let totalCostIncrease = 0
    const targetHours = input.targetReductionDays * 8

    // Sort crashing options by cost efficiency
    const sortedCrashes = [...crashingOptions].sort(Crashing.compareByCostEfficiency)
    
    for (const crash of sortedCrashes) {
      if (totalTimeSaved >= targetHours) break
      if (input.maxCostIncrease && totalCostIncrease >= input.maxCostIncrease) break

      const timeSaved = crash.maxCrashHours
      const cost = crash.crashedCost - crash.normalCost
      
      if (!input.maxCostIncrease || totalCostIncrease + cost <= input.maxCostIncrease) {
        appliedCrashes.push({
          taskId: crash.taskId,
          taskName: crash.taskName,
          crashedHours: timeSaved,
          timeSaved,
          costIncrease: cost,
        })
        totalTimeSaved += timeSaved
        totalCostIncrease += cost
      }
    }

    // Sort fast tracking options by benefit
    const sortedFastTracks = [...fastTrackingOptions].sort(FastTracking.compareByBenefit)
    
    for (const ft of sortedFastTracks) {
      if (totalTimeSaved >= targetHours) break
      if (input.maxRiskScore && ft.getRiskScore() > input.maxRiskScore) continue

      const timeSaved = ft.timeSavings.toHours()
      
      appliedFastTracks.push({
        taskId: ft.taskId,
        successorId: ft.successorId,
        taskNames: `${ft.taskName} → ${ft.successorName}`,
        timeSaved,
        riskScore: ft.getRiskScore(),
      })
      totalTimeSaved += timeSaved
    }

    const compressedDuration = Duration.fromHours(
      originalDuration.value.toHours() - totalTimeSaved
    )
    if (!compressedDuration.isSuccess || !compressedDuration.value) {
      return Result.fail('failed to calculate compressed duration')
    }

    // Create compression result
    const compressionResult = CompressionResult.create({
      originalDuration: originalDuration.value,
      compressedDuration: compressedDuration.value,
      crashingOptions,
      fastTrackingOptions,
      appliedCrashes,
      appliedFastTracks,
      totalCostIncrease,
    })
    
    if (!compressionResult.isSuccess || !compressionResult.value) {
      return Result.fail(compressionResult.error ?? 'failed to create compression result')
    }

    const compression = compressionResult.value
    const recommendation = compression.getRecommendation()

    // Calculate risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'extreme' = 'low'
    const riskScore = compression.totalRiskScore
    if (riskScore > 80) riskLevel = 'extreme'
    else if (riskScore > 60) riskLevel = 'high'
    else if (riskScore > 40) riskLevel = 'moderate'

    return Result.ok({
      compression,
      appliedCrashes,
      appliedFastTracks,
      timeSaved: {
        days: compression.getTimeSavedDays(),
        hours: compression.getTimeSavedHours(),
      },
      costImpact: {
        totalIncrease: totalCostIncrease,
        costPerDaySaved: compression.getCostPerDaySaved(),
      },
      riskAssessment: {
        overallScore: riskScore,
        level: riskLevel,
      },
      recommendation: {
        accept: recommendation.status === 'accept',
        reason: recommendation.message,
        confidence: recommendation.confidence,
      },
      topOpportunities: compression.getTopOpportunities(5).map((opp) => ({
        type: opp.type,
        taskName: opp.taskName,
        timeSavings: opp.timeSavings,
        cost: opp.costIncrease,
        efficiency: opp.efficiency,
      })),
    })
  }
}
