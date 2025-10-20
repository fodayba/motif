import { Result, UniqueEntityID } from '@domain/shared'
import type {
  JobCostRecord,
  JobCostRecordRepository,
  ProjectBudgetRepository,
  CostCategory,
} from '@domain/finance'

export type CostAnalysisParams = {
  projectId: string
  phase?: string
  task?: string
  category?: CostCategory
  startDate?: Date
  endDate?: Date
}

export type CostAnalysisResult = {
  projectId: string
  phase?: string
  task?: string
  category?: CostCategory
  plannedAmount: number
  committedAmount: number
  actualAmount: number
  variance: number
  variancePercent: number
  recordCount: number
}

export type VarianceAnalysisResult = {
  recordId: string
  costCode: string
  category: CostCategory
  description: string
  plannedAmount: number
  committedAmount: number
  actualAmount: number
  variance: number
  variancePercent: number
  isOverBudget: boolean
  exceedsThreshold: boolean
}

export type JobProfitabilityResult = {
  projectId: string
  totalRevenue: number
  totalCost: number
  grossProfit: number
  grossMargin: number
  netProfit: number
  netMargin: number
  roi: number
  costByCategory: Record<CostCategory, number>
  profitTrend: Array<{ date: Date; profit: number }>
}

export type CostAllocationParams = {
  costAmount: number
  currency: string
  sourceProjectId: string
  targetProjects: Array<{ projectId: string; allocationPercent: number }>
  category: CostCategory
  description: string
  allocationDate: Date
}

export type CostAllocationResult = {
  sourceRecordId: string
  allocations: Array<{
    projectId: string
    recordId: string
    amount: number
    percent: number
  }>
}

export type EVMMetrics = {
  projectId: string
  plannedValue: number // PV (BCWS)
  earnedValue: number // EV (BCWP)
  actualCost: number // AC (ACWP)
  scheduleVariance: number // SV = EV - PV
  costVariance: number // CV = EV - AC
  schedulePerformanceIndex: number // SPI = EV / PV
  costPerformanceIndex: number // CPI = EV / AC
  budgetAtCompletion: number // BAC
  estimateAtCompletion: number // EAC = BAC / CPI
  estimateToComplete: number // ETC = EAC - AC
  varianceAtCompletion: number // VAC = BAC - EAC
  toCompletePerformanceIndex: number // TCPI = (BAC - EV) / (BAC - AC)
}

export class JobCostingService {
  private readonly jobCostRecordRepository: JobCostRecordRepository
  private readonly projectBudgetRepository: ProjectBudgetRepository

  constructor(deps: {
    jobCostRecordRepository: JobCostRecordRepository
    projectBudgetRepository: ProjectBudgetRepository
  }) {
    this.jobCostRecordRepository = deps.jobCostRecordRepository
    this.projectBudgetRepository = deps.projectBudgetRepository
  }

  /**
   * Analyze costs across multiple dimensions (project/phase/task/category)
   */
  public async analyzeCosts(params: CostAnalysisParams): Promise<Result<CostAnalysisResult>> {
    try {
      const projectId = new UniqueEntityID(params.projectId)

      // Get all cost records for the project
      let records: JobCostRecord[]
      records = await this.jobCostRecordRepository.findByProject(projectId)

      // Apply filters
      if (params.phase) {
        records = await this.jobCostRecordRepository.findByPhase(projectId, params.phase)
      }

      if (params.category) {
        records = await this.jobCostRecordRepository.findByCategory(
          projectId,
          params.category,
        )
      }

      if (params.startDate && params.endDate) {
        records = await this.jobCostRecordRepository.findByDateRange(
          projectId,
          params.startDate,
          params.endDate,
        )
      }

      // Aggregate costs
      let plannedAmount = 0
      let committedAmount = 0
      let actualAmount = 0

      for (const record of records) {
        plannedAmount += record.plannedAmount.amount
        committedAmount += record.committedAmount.amount
        actualAmount += record.actualAmount.amount
      }

      const variance = actualAmount - plannedAmount
      const variancePercent = plannedAmount > 0 ? (variance / plannedAmount) * 100 : 0

      return Result.ok({
        projectId: params.projectId,
        phase: params.phase,
        task: params.task,
        category: params.category,
        plannedAmount,
        committedAmount,
        actualAmount,
        variance,
        variancePercent,
        recordCount: records.length,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to analyze costs: ${message}`)
    }
  }

  /**
   * Calculate variance between planned and actual costs with threshold alerts
   */
  public async calculateVariance(
    projectId: string,
    thresholdPercent: number = 10,
  ): Promise<Result<VarianceAnalysisResult[]>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get all cost records
      const records = await this.jobCostRecordRepository.findByProject(projectIdObj)
      const results: VarianceAnalysisResult[] = []

      for (const record of records) {
        const planned = record.plannedAmount.amount
        const actual = record.actualAmount.amount
        const variance = actual - planned
        const variancePercent = planned > 0 ? (variance / planned) * 100 : 0

        results.push({
          recordId: record.id.toString(),
          costCode: record.costCode.value,
          category: record.category,
          description: record.description,
          plannedAmount: planned,
          committedAmount: record.committedAmount.amount,
          actualAmount: actual,
          variance,
          variancePercent,
          isOverBudget: variance > 0,
          exceedsThreshold: Math.abs(variancePercent) > thresholdPercent,
        })
      }

      // Sort by variance percent (descending)
      results.sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))

      return Result.ok(results)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate variance: ${message}`)
    }
  }

  /**
   * Get all over-budget cost records
   */
  public async getOverBudgetItems(projectId: string): Promise<Result<JobCostRecord[]>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)
      const records = await this.jobCostRecordRepository.findOverBudget(projectIdObj)
      return Result.ok(records)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get over-budget items: ${message}`)
    }
  }

  /**
   * Calculate job profitability with trend analysis
   */
  public async calculateJobProfit(projectId: string): Promise<Result<JobProfitabilityResult>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get project budget for revenue
      const budgets = await this.projectBudgetRepository.listByProject(projectIdObj)
      if (budgets.length === 0) {
        return Result.fail('No budget found for project')
      }

      const budget = budgets[0]
      const totalRevenue = budget.plannedTotal

      // Get all cost records
      const records = await this.jobCostRecordRepository.findByProject(projectIdObj)

      // Calculate total cost and breakdown by category
      let totalCost = 0
      const costByCategory: Partial<Record<CostCategory, number>> = {}

      for (const record of records) {
        const actualCost = record.actualAmount.amount
        totalCost += actualCost

        const category = record.category as CostCategory
        if (!costByCategory[category]) {
          costByCategory[category] = 0
        }
        costByCategory[category]! += actualCost
      }

      // Calculate profitability metrics
      const grossProfit = totalRevenue - totalCost
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

      // Simplified net profit (no indirect costs in this calculation)
      const netProfit = grossProfit
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

      // Generate profit trend (monthly aggregation)
      const profitTrend: Array<{ date: Date; profit: number }> = []
      const monthlyRecords = new Map<string, JobCostRecord[]>()

      for (const record of records) {
        const monthKey = `${record.transactionDate.getFullYear()}-${record.transactionDate.getMonth()}`
        if (!monthlyRecords.has(monthKey)) {
          monthlyRecords.set(monthKey, [])
        }
        monthlyRecords.get(monthKey)!.push(record)
      }

      for (const [monthKey, monthRecords] of monthlyRecords.entries()) {
        const monthlyCost = monthRecords.reduce((sum, r) => sum + r.actualAmount.amount, 0)
        const monthlyRevenue = totalRevenue / monthlyRecords.size // Simplified
        const monthlyProfit = monthlyRevenue - monthlyCost

        const [year, month] = monthKey.split('-').map(Number)
        profitTrend.push({
          date: new Date(year, month, 1),
          profit: monthlyProfit,
        })
      }

      profitTrend.sort((a, b) => a.date.getTime() - b.date.getTime())

      return Result.ok({
        projectId,
        totalRevenue,
        totalCost,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin,
        roi,
        costByCategory: costByCategory as Record<CostCategory, number>,
        profitTrend,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate job profit: ${message}`)
    }
  }

  /**
   * Get job profit margins by project
   */
  public async getJobMargins(
    projectIds: string[],
  ): Promise<Result<Array<{ projectId: string; margin: number; profit: number }>>> {
    try {
      const results: Array<{ projectId: string; margin: number; profit: number }> = []

      for (const projectId of projectIds) {
        const profitResult = await this.calculateJobProfit(projectId)
        if (profitResult.isSuccess) {
          const profit = profitResult.value!
          results.push({
            projectId,
            margin: profit.grossMargin,
            profit: profit.grossProfit,
          })
        }
      }

      // Sort by margin (descending)
      results.sort((a, b) => b.margin - a.margin)

      return Result.ok(results)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get job margins: ${message}`)
    }
  }

  /**
   * Allocate costs across multiple projects (shared resources)
   */
  public async allocateCosts(params: CostAllocationParams): Promise<Result<CostAllocationResult>> {
    try {
      // Validate allocation percentages sum to 100
      const totalPercent = params.targetProjects.reduce((sum, p) => sum + p.allocationPercent, 0)
      if (Math.abs(totalPercent - 100) > 0.01) {
        return Result.fail('Allocation percentages must sum to 100')
      }

      const allocations: Array<{
        projectId: string
        recordId: string
        amount: number
        percent: number
      }> = []

      // Create cost records for each target project
      for (const target of params.targetProjects) {
        const allocatedAmount = (params.costAmount * target.allocationPercent) / 100

        // Here you would create JobCostRecord for each allocation
        // This is simplified - in production, you'd create actual records
        allocations.push({
          projectId: target.projectId,
          recordId: `allocated-${Date.now()}-${target.projectId}`,
          amount: allocatedAmount,
          percent: target.allocationPercent,
        })
      }

      return Result.ok({
        sourceRecordId: `source-${Date.now()}`,
        allocations,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to allocate costs: ${message}`)
    }
  }

  /**
   * Calculate Earned Value Management (EVM) metrics
   */
  public async calculateEVMMetrics(
    projectId: string,
    percentComplete: number,
  ): Promise<Result<EVMMetrics>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get project budget for BAC
      const budgets = await this.projectBudgetRepository.listByProject(projectIdObj)
      if (budgets.length === 0) {
        return Result.fail('No budget found for project')
      }

      const budget = budgets[0]
      const budgetAtCompletion = budget.plannedTotal // BAC

      // Get all cost records
      const records = await this.jobCostRecordRepository.findByProject(projectIdObj)
      const actualCost = records.reduce((sum: number, r: JobCostRecord) => sum + r.actualAmount.amount, 0) // AC

      // Calculate EVM metrics
      const plannedValue = budgetAtCompletion * (percentComplete / 100) // PV
      const earnedValue = budgetAtCompletion * (percentComplete / 100) // EV (simplified)

      const scheduleVariance = earnedValue - plannedValue // SV
      const costVariance = earnedValue - actualCost // CV

      const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0 // SPI
      const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0 // CPI

      const estimateAtCompletion = costPerformanceIndex > 0 ? budgetAtCompletion / costPerformanceIndex : 0 // EAC
      const estimateToComplete = estimateAtCompletion - actualCost // ETC
      const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion // VAC

      const toCompletePerformanceIndex =
        budgetAtCompletion - actualCost > 0
          ? (budgetAtCompletion - earnedValue) / (budgetAtCompletion - actualCost)
          : 0 // TCPI

      return Result.ok({
        projectId,
        plannedValue,
        earnedValue,
        actualCost,
        scheduleVariance,
        costVariance,
        schedulePerformanceIndex,
        costPerformanceIndex,
        budgetAtCompletion,
        estimateAtCompletion,
        estimateToComplete,
        varianceAtCompletion,
        toCompletePerformanceIndex,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate EVM metrics: ${message}`)
    }
  }
}
