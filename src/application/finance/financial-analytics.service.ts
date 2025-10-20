import { Result, UniqueEntityID } from '@domain/shared'
import type {
  JobCostRecord,
  JobCostRecordRepository,
  ProjectBudgetRepository,
  CostCategory,
} from '@domain/finance'

export type GrossProfitMargin = {
  projectId: string
  phase?: string
  revenue: number
  cost: number
  grossProfit: number
  grossMargin: number
  categoryBreakdown: Record<CostCategory, { cost: number; margin: number }>
}

export type OverheadAllocation = {
  projectId: string
  directCosts: number
  fixedOverhead: number
  variableOverhead: number
  totalOverhead: number
  overheadRate: number
  allocatedOverhead: number
}

export type BreakEvenAnalysis = {
  projectId?: string
  fixedCosts: number
  variableCostPerUnit: number
  pricePerUnit: number
  breakEvenUnits: number
  breakEvenRevenue: number
  contributionMargin: number
  contributionMarginRatio: number
  safetyMargin: number
}

export type ProfitabilityForecast = {
  projectId: string
  currentProfit: number
  projectedRevenue: number
  projectedCosts: number
  projectedProfit: number
  projectedMargin: number
  confidenceLevel: number
  trendDirection: 'improving' | 'stable' | 'declining'
  factors: Array<{
    factor: string
    impact: 'positive' | 'negative' | 'neutral'
    magnitude: number
  }>
}

export type CostTrend = {
  projectId: string
  category: CostCategory
  timeSeriesData: Array<{
    date: Date
    amount: number
    budgetAmount: number
    variance: number
  }>
  averageMonthlyCost: number
  trendDirection: 'increasing' | 'decreasing' | 'stable'
  budgetDrift: number
  projectedCost: number
}

export type FinancialKPI = {
  name: string
  value: number
  unit: 'currency' | 'percent' | 'ratio' | 'days'
  target?: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

export type PortfolioMetrics = {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  overallMargin: number
  numberOfProjects: number
  profitableProjects: number
  unprofitableProjects: number
  overBudgetProjects: number
  onBudgetProjects: number
  healthScore: number
}

export class FinancialAnalyticsService {
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
   * Calculate gross profit margins by job and phase
   */
  public async calculateGrossProfitMargin(
    projectId: string,
    phase?: string,
  ): Promise<Result<GrossProfitMargin>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get budget for revenue
      const budgets = await this.projectBudgetRepository.listByProject(projectIdObj)
      if (budgets.length === 0) {
        return Result.fail('No budget found for project')
      }

      const budget = budgets[0]
      const revenue = budget.plannedTotal

      // Get cost records
      let recordsResult: Result<JobCostRecord[]>
      if (phase) {
        recordsResult = await this.jobCostRecordRepository.findByPhase(projectIdObj, phase)
      } else {
        recordsResult = await this.jobCostRecordRepository.findByProject(projectIdObj)
      }

      if (!recordsResult.isSuccess) {
        return Result.fail(recordsResult.error || 'Failed to fetch cost records')
      }

      const records = recordsResult.value!
      let totalCost = 0
      const categoryBreakdown: Partial<Record<CostCategory, { cost: number; margin: number }>> = {}

      for (const record of records) {
        const cost = record.actualAmount.amount
        totalCost += cost

        if (!categoryBreakdown[record.category]) {
          categoryBreakdown[record.category] = { cost: 0, margin: 0 }
        }
        categoryBreakdown[record.category]!.cost += cost
      }

      // Calculate margins
      const grossProfit = revenue - totalCost
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

      // Calculate category margins
      for (const category in categoryBreakdown) {
        const catCost = categoryBreakdown[category as CostCategory]!.cost
        categoryBreakdown[category as CostCategory]!.margin =
          revenue > 0 ? ((revenue - catCost) / revenue) * 100 : 0
      }

      return Result.ok({
        projectId,
        phase,
        revenue,
        cost: totalCost,
        grossProfit,
        grossMargin,
        categoryBreakdown: categoryBreakdown as Record<CostCategory, { cost: number; margin: number }>,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate gross profit margin: ${message}`)
    }
  }

  /**
   * Calculate overhead allocation
   */
  public async calculateOverheadAllocation(
    projectId: string,
    fixedOverhead: number,
    variableOverheadRate: number,
  ): Promise<Result<OverheadAllocation>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get direct costs
      const recordsResult = await this.jobCostRecordRepository.findByProject(projectIdObj)
      if (!recordsResult.isSuccess) {
        return Result.fail(recordsResult.error || 'Failed to fetch cost records')
      }

      const records = recordsResult.value!
      const directCosts = records.reduce((sum, r) => sum + r.actualAmount.amount, 0)

      // Calculate variable overhead
      const variableOverhead = directCosts * (variableOverheadRate / 100)

      // Total overhead
      const totalOverhead = fixedOverhead + variableOverhead

      // Overhead rate
      const overheadRate = directCosts > 0 ? (totalOverhead / directCosts) * 100 : 0

      return Result.ok({
        projectId,
        directCosts,
        fixedOverhead,
        variableOverhead,
        totalOverhead,
        overheadRate,
        allocatedOverhead: totalOverhead,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate overhead allocation: ${message}`)
    }
  }

  /**
   * Perform break-even analysis
   */
  public calculateBreakEvenAnalysis(
    fixedCosts: number,
    variableCostPerUnit: number,
    pricePerUnit: number,
    actualUnits?: number,
  ): Result<BreakEvenAnalysis> {
    try {
      // Break-even units = Fixed Costs / (Price - Variable Cost)
      const contributionMargin = pricePerUnit - variableCostPerUnit
      if (contributionMargin <= 0) {
        return Result.fail('Price per unit must be greater than variable cost per unit')
      }

      const breakEvenUnits = fixedCosts / contributionMargin
      const breakEvenRevenue = breakEvenUnits * pricePerUnit
      const contributionMarginRatio = (contributionMargin / pricePerUnit) * 100

      // Safety margin (if actual units provided)
      const safetyMargin = actualUnits
        ? ((actualUnits - breakEvenUnits) / actualUnits) * 100
        : 0

      return Result.ok({
        fixedCosts,
        variableCostPerUnit,
        pricePerUnit,
        breakEvenUnits,
        breakEvenRevenue,
        contributionMargin,
        contributionMarginRatio,
        safetyMargin,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate break-even analysis: ${message}`)
    }
  }

  /**
   * Forecast profitability based on current trends
   */
  public async forecastProfitability(
    projectId: string,
    forecastMonths: number = 3,
  ): Promise<Result<ProfitabilityForecast>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get current budget and costs
      const budgets = await this.projectBudgetRepository.listByProject(projectIdObj)
      if (budgets.length === 0) {
        return Result.fail('No budget found for project')
      }

      const budget = budgets[0]
      const currentRevenue = budget.plannedTotal

      const recordsResult = await this.jobCostRecordRepository.findByProject(projectIdObj)
      if (!recordsResult.isSuccess) {
        return Result.fail(recordsResult.error || 'Failed to fetch cost records')
      }

      const records = recordsResult.value!
      const currentCost = records.reduce((sum, r) => sum + r.actualAmount.amount, 0)
      const currentProfit = currentRevenue - currentCost

      // Simple forecast (in production, use more sophisticated methods)
      const averageMonthlyCost = currentCost / Math.max(1, records.length / 30)
      const projectedCosts = currentCost + averageMonthlyCost * forecastMonths
      const projectedRevenue = currentRevenue // Assuming contract revenue is fixed
      const projectedProfit = projectedRevenue - projectedCosts
      const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0

      // Determine trend
      const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0
      let trendDirection: 'improving' | 'stable' | 'declining'
      if (projectedMargin > currentMargin + 2) {
        trendDirection = 'improving'
      } else if (projectedMargin < currentMargin - 2) {
        trendDirection = 'declining'
      } else {
        trendDirection = 'stable'
      }

      const factors = [
        {
          factor: 'Cost burn rate',
          impact: averageMonthlyCost > projectedRevenue / 12 ? ('negative' as const) : ('positive' as const),
          magnitude: Math.abs(averageMonthlyCost - projectedRevenue / 12),
        },
        {
          factor: 'Budget adherence',
          impact: currentCost < budget.plannedTotal ? ('positive' as const) : ('negative' as const),
          magnitude: Math.abs(currentCost - budget.plannedTotal),
        },
      ]

      return Result.ok({
        projectId,
        currentProfit,
        projectedRevenue,
        projectedCosts,
        projectedProfit,
        projectedMargin,
        confidenceLevel: 75, // Simplified - in production, calculate based on data quality
        trendDirection,
        factors,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to forecast profitability: ${message}`)
    }
  }

  /**
   * Analyze cost trending over time
   */
  public async analyzeCostTrend(
    projectId: string,
    category: CostCategory,
    months: number = 6,
  ): Promise<Result<CostTrend>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get cost records for category
      const recordsResult = await this.jobCostRecordRepository.findByCategory(projectIdObj, category)
      if (!recordsResult.isSuccess) {
        return Result.fail(recordsResult.error || 'Failed to fetch cost records')
      }

      const records = recordsResult.value!

      // Group by month
      const monthlyData = new Map<string, { actual: number; planned: number }>()
      for (const record of records) {
        const monthKey = `${record.transactionDate.getFullYear()}-${record.transactionDate.getMonth()}`
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { actual: 0, planned: 0 })
        }
        const data = monthlyData.get(monthKey)!
        data.actual += record.actualAmount.amount
        data.planned += record.plannedAmount.amount
      }

      // Generate time series
      const timeSeriesData = Array.from(monthlyData.entries()).map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-').map(Number)
        return {
          date: new Date(year, month, 1),
          amount: data.actual,
          budgetAmount: data.planned,
          variance: data.actual - data.planned,
        }
      })

      timeSeriesData.sort((a, b) => a.date.getTime() - b.date.getTime())

      const averageMonthlyCost =
        timeSeriesData.reduce((sum, d) => sum + d.amount, 0) / timeSeriesData.length

      // Determine trend
      const firstHalf = timeSeriesData.slice(0, Math.floor(timeSeriesData.length / 2))
      const secondHalf = timeSeriesData.slice(Math.floor(timeSeriesData.length / 2))
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.amount, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.amount, 0) / secondHalf.length

      let trendDirection: 'increasing' | 'decreasing' | 'stable'
      if (secondHalfAvg > firstHalfAvg * 1.1) {
        trendDirection = 'increasing'
      } else if (secondHalfAvg < firstHalfAvg * 0.9) {
        trendDirection = 'decreasing'
      } else {
        trendDirection = 'stable'
      }

      const budgetDrift = timeSeriesData.reduce((sum, d) => sum + d.variance, 0)
      const projectedCost = averageMonthlyCost * months

      return Result.ok({
        projectId,
        category,
        timeSeriesData,
        averageMonthlyCost,
        trendDirection,
        budgetDrift,
        projectedCost,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to analyze cost trend: ${message}`)
    }
  }

  /**
   * Calculate comprehensive financial KPIs
   */
  public async calculateFinancialKPIs(projectId: string): Promise<Result<FinancialKPI[]>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)

      // Get budget and costs
      const budgets = await this.projectBudgetRepository.listByProject(projectIdObj)
      if (budgets.length === 0) {
        return Result.fail('No budget found for project')
      }

      const budget = budgets[0]
      const recordsResult = await this.jobCostRecordRepository.findByProject(projectIdObj)
      if (!recordsResult.isSuccess) {
        return Result.fail(recordsResult.error || 'Failed to fetch cost records')
      }

      const records = recordsResult.value!
      const totalCost = records.reduce((sum, r) => sum + r.actualAmount.amount, 0)
      const totalRevenue = budget.plannedTotal

      const kpis: FinancialKPI[] = [
        {
          name: 'Gross Profit Margin',
          value: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
          unit: 'percent',
          target: 20,
          status: totalRevenue > 0 && (totalRevenue - totalCost) / totalRevenue >= 0.2 ? 'good' : 'warning',
          trend: 'stable',
        },
        {
          name: 'Cost to Budget Ratio',
          value: budget.plannedTotal > 0 ? (totalCost / budget.plannedTotal) * 100 : 0,
          unit: 'percent',
          target: 100,
          status:
            totalCost <= budget.plannedTotal ? 'good' : totalCost <= budget.plannedTotal * 1.1 ? 'warning' : 'critical',
          trend: totalCost > budget.plannedTotal ? 'up' : 'stable',
        },
        {
          name: 'Revenue per Cost Dollar',
          value: totalCost > 0 ? totalRevenue / totalCost : 0,
          unit: 'ratio',
          target: 1.2,
          status: totalCost > 0 && totalRevenue / totalCost >= 1.2 ? 'good' : 'warning',
          trend: 'stable',
        },
      ]

      return Result.ok(kpis)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate financial KPIs: ${message}`)
    }
  }

  /**
   * Calculate portfolio-wide metrics
   */
  public async calculatePortfolioMetrics(projectIds: string[]): Promise<Result<PortfolioMetrics>> {
    try {
      let totalRevenue = 0
      let totalCost = 0
      let profitableProjects = 0
      let unprofitableProjects = 0
      let overBudgetProjects = 0
      let onBudgetProjects = 0

      for (const projectId of projectIds) {
        const projectIdObj = new UniqueEntityID(projectId)

        // Get budget
        const budgets = await this.projectBudgetRepository.listByProject(projectIdObj)
        if (budgets.length === 0) continue

        const budget = budgets[0]
        const revenue = budget.plannedTotal
        totalRevenue += revenue

        // Get costs
        const recordsResult = await this.jobCostRecordRepository.findByProject(projectIdObj)
        if (!recordsResult.isSuccess) continue

        const records = recordsResult.value!
        const cost = records.reduce((sum, r) => sum + r.actualAmount.amount, 0)
        totalCost += cost

        // Track metrics
        if (revenue > cost) {
          profitableProjects++
        } else {
          unprofitableProjects++
        }

        if (cost <= budget.plannedTotal) {
          onBudgetProjects++
        } else {
          overBudgetProjects++
        }
      }

      const totalProfit = totalRevenue - totalCost
      const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

      // Health score (0-100): 50% profitability + 50% budget adherence
      const profitabilityScore = profitableProjects / Math.max(1, projectIds.length) * 50
      const budgetScore = onBudgetProjects / Math.max(1, projectIds.length) * 50
      const healthScore = profitabilityScore + budgetScore

      return Result.ok({
        totalRevenue,
        totalCost,
        totalProfit,
        overallMargin,
        numberOfProjects: projectIds.length,
        profitableProjects,
        unprofitableProjects,
        overBudgetProjects,
        onBudgetProjects,
        healthScore,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate portfolio metrics: ${message}`)
    }
  }
}
