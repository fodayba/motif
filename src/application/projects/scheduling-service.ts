import { Result, UniqueEntityID } from '@domain/shared'
import type { ProjectRepository } from '@domain/projects'
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

    let plannedValue = 0
    let earnedValue = 0
    let actualCost = 0
    let baselineTotal = 0

    for (const task of tasks) {
      const baselineAmount = task.baselineCost.amount
      baselineTotal += baselineAmount

      const plannedFraction = this.calculatePlannedFraction(task, asOf)
      plannedValue += baselineAmount * plannedFraction

      const earnedFraction = task.percentComplete / 100
      earnedValue += baselineAmount * earnedFraction

      try {
        actualCost += this.deriveActualCost(task)
      } catch (error) {
        return Result.fail(
          error instanceof Error ? error.message : 'failed to evaluate actual cost',
        )
      }
    }

    const scheduleVariance = earnedValue - plannedValue
    const costVariance = earnedValue - actualCost
    const cpi = actualCost > 0 ? earnedValue / actualCost : null
    const spi = plannedValue > 0 ? earnedValue / plannedValue : null
    const estimateAtCompletion = cpi && cpi !== 0 ? baselineTotal / cpi : null
    const varianceAtCompletion =
      estimateAtCompletion !== null ? baselineTotal - estimateAtCompletion : null

    return Result.ok({
      projectId: project.id.toString(),
      asOf,
      currency: currency.value,
      plannedValue,
      earnedValue,
      actualCost,
      scheduleVariance,
      costVariance,
      cpi,
      spi,
      estimateAtCompletion,
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

  private calculatePlannedFraction(task: ProjectTaskRecord, asOf: Date): number {
    const start = task.plannedStart.getTime()
    const finish = task.plannedFinish.getTime()
    const asOfTime = asOf.getTime()

    if (asOfTime <= start) {
      return 0
    }

    if (asOfTime >= finish) {
      return 1
    }

    const duration = finish - start
    if (duration <= 0) {
      return 1
    }

    return (asOfTime - start) / duration
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
}
