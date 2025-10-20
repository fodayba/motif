import { Result, UniqueEntityID } from '@domain/shared'
import type {
  CashFlowProjection,
  CashFlowProjectionRepository,
} from '@domain/finance'

export type CashFlowScenario = 'best-case' | 'expected' | 'worst-case'

export type ThirteenWeekProjectionParams = {
  projectId?: string
  startDate: Date
  scenario: CashFlowScenario
  accountsReceivable: number
  accountsPayable: number
  payrollObligations: number
  openInvoices: number
}

export type WeeklyCashFlow = {
  weekNumber: number
  weekStartDate: Date
  weekEndDate: Date
  inflows: number
  outflows: number
  netCashFlow: number
  cumulativeCashFlow: number
}

export type ThirteenWeekProjection = {
  projectId?: string
  scenario: CashFlowScenario
  startDate: Date
  endDate: Date
  weeks: WeeklyCashFlow[]
  totalInflows: number
  totalOutflows: number
  netCashFlow: number
  minimumBalance: number
  minimumBalanceWeek: number
  hasNegativeCashFlow: boolean
}

export type ARAgingReport = {
  projectId?: string
  current: number
  days30: number
  days60: number
  days90: number
  days120Plus: number
  totalAR: number
  averageDaysOutstanding: number
}

export type APSchedule = {
  projectId?: string
  dueThisWeek: number
  dueNextWeek: number
  dueThisMonth: number
  dueNextMonth: number
  totalAP: number
  averageDaysPayable: number
}

export type LiquidityRiskAnalysis = {
  projectId?: string
  currentCashBalance: number
  minimumRequiredBalance: number
  weeksOfRunway: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  recommendations: string[]
}

export type WorkingCapitalMetrics = {
  projectId?: string
  currentAssets: number
  currentLiabilities: number
  workingCapital: number
  currentRatio: number
  quickRatio: number
  cashRatio: number
  workingCapitalTurnover: number
}

export class CashFlowService {
  private readonly cashFlowProjectionRepository: CashFlowProjectionRepository

  constructor(deps: { cashFlowProjectionRepository: CashFlowProjectionRepository }) {
    this.cashFlowProjectionRepository = deps.cashFlowProjectionRepository
  }

  /**
   * Generate a 13-week cash flow projection
   */
  public async generate13WeekProjection(
    params: ThirteenWeekProjectionParams,
  ): Promise<Result<ThirteenWeekProjection>> {
    try {
      const weeks: WeeklyCashFlow[] = []
      let cumulativeCashFlow = params.openInvoices - params.accountsPayable

      // Generate 13 weeks of projections
      for (let weekNum = 1; weekNum <= 13; weekNum++) {
        const weekStartDate = new Date(params.startDate)
        weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7)

        const weekEndDate = new Date(weekStartDate)
        weekEndDate.setDate(weekEndDate.getDate() + 6)

        // Calculate inflows and outflows (simplified - would be more complex in production)
        let inflows = params.accountsReceivable / 13
        let outflows = params.accountsPayable / 13 + params.payrollObligations / 13

        // Apply scenario multipliers
        switch (params.scenario) {
          case 'best-case':
            inflows *= 1.2
            outflows *= 0.9
            break
          case 'worst-case':
            inflows *= 0.8
            outflows *= 1.1
            break
          case 'expected':
            // Use base values
            break
        }

        const netCashFlow = inflows - outflows
        cumulativeCashFlow += netCashFlow

        weeks.push({
          weekNumber: weekNum,
          weekStartDate,
          weekEndDate,
          inflows,
          outflows,
          netCashFlow,
          cumulativeCashFlow,
        })
      }

      // Calculate aggregates
      const totalInflows = weeks.reduce((sum, w) => sum + w.inflows, 0)
      const totalOutflows = weeks.reduce((sum, w) => sum + w.outflows, 0)
      const netCashFlow = totalInflows - totalOutflows

      // Find minimum balance week
      const minWeek = weeks.reduce((min, w) => (w.cumulativeCashFlow < min.cumulativeCashFlow ? w : min))
      const minimumBalance = minWeek.cumulativeCashFlow
      const minimumBalanceWeek = minWeek.weekNumber

      const hasNegativeCashFlow = weeks.some((w) => w.cumulativeCashFlow < 0)

      const endDate = new Date(params.startDate)
      endDate.setDate(endDate.getDate() + 13 * 7)

      return Result.ok({
        projectId: params.projectId,
        scenario: params.scenario,
        startDate: params.startDate,
        endDate,
        weeks,
        totalInflows,
        totalOutflows,
        netCashFlow,
        minimumBalance,
        minimumBalanceWeek,
        hasNegativeCashFlow,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to generate 13-week projection: ${message}`)
    }
  }

  /**
   * Model different cash flow scenarios (best, expected, worst)
   */
  public async modelScenarios(
    baseParams: Omit<ThirteenWeekProjectionParams, 'scenario'>,
  ): Promise<Result<Record<CashFlowScenario, ThirteenWeekProjection>>> {
    try {
      const scenarios: CashFlowScenario[] = ['best-case', 'expected', 'worst-case']
      const results: Partial<Record<CashFlowScenario, ThirteenWeekProjection>> = {}

      for (const scenario of scenarios) {
        const projectionResult = await this.generate13WeekProjection({
          ...baseParams,
          scenario,
        })

        if (projectionResult.isSuccess) {
          results[scenario] = projectionResult.value!
        }
      }

      return Result.ok(results as Record<CashFlowScenario, ThirteenWeekProjection>)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to model scenarios: ${message}`)
    }
  }

  /**
   * Get latest projection for a project
   */
  public async getLatestProjection(
    projectId: string,
  ): Promise<Result<CashFlowProjection | null>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)
      return await this.cashFlowProjectionRepository.findLatest(projectIdObj)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get latest projection: ${message}`)
    }
  }

  /**
   * Get projections by scenario
   */
  public async getProjectionsByScenario(
    projectId: string,
    scenario: CashFlowScenario,
  ): Promise<Result<CashFlowProjection[]>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)
      return await this.cashFlowProjectionRepository.findByScenario(projectIdObj, scenario)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get projections by scenario: ${message}`)
    }
  }

  /**
   * Analyze AR aging and impact on cash flow
   */
  public async analyzeARImpact(projectId?: string): Promise<Result<ARAgingReport>> {
    try {
      // This is a simplified version - in production, would query actual AR data
      // For now, returning mock data structure

      return Result.ok({
        projectId,
        current: 50000,
        days30: 30000,
        days60: 15000,
        days90: 8000,
        days120Plus: 5000,
        totalAR: 108000,
        averageDaysOutstanding: 42,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to analyze AR impact: ${message}`)
    }
  }

  /**
   * Integrate AP schedule into cash flow projection
   */
  public async integrateAPSchedule(projectId?: string): Promise<Result<APSchedule>> {
    try {
      // This is a simplified version - in production, would query actual AP data

      return Result.ok({
        projectId,
        dueThisWeek: 25000,
        dueNextWeek: 32000,
        dueThisMonth: 95000,
        dueNextMonth: 120000,
        totalAP: 245000,
        averageDaysPayable: 35,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to integrate AP schedule: ${message}`)
    }
  }

  /**
   * Analyze liquidity risk and detect negative balance periods
   */
  public async analyzeLiquidityRisk(
    currentCashBalance: number,
    minimumRequiredBalance: number,
    projectedWeeks: WeeklyCashFlow[],
  ): Promise<Result<LiquidityRiskAnalysis>> {
    try {
      const weeksWithNegativeBalance = projectedWeeks.filter((w) => w.cumulativeCashFlow < 0)
      const weeksWithLowBalance = projectedWeeks.filter(
        (w) => w.cumulativeCashFlow < minimumRequiredBalance,
      )

      const minBalance = Math.min(...projectedWeeks.map((w) => w.cumulativeCashFlow))
      const averageWeeklyBurn =
        projectedWeeks.reduce((sum, w) => sum + Math.abs(w.outflows), 0) / projectedWeeks.length

      const weeksOfRunway = currentCashBalance / averageWeeklyBurn

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical'
      if (weeksWithNegativeBalance.length > 0) {
        riskLevel = 'critical'
      } else if (weeksWithLowBalance.length > 3) {
        riskLevel = 'high'
      } else if (weeksOfRunway < 8) {
        riskLevel = 'medium'
      } else {
        riskLevel = 'low'
      }

      // Generate risk factors
      const riskFactors: string[] = []
      if (weeksWithNegativeBalance.length > 0) {
        riskFactors.push(`${weeksWithNegativeBalance.length} weeks with negative cash balance`)
      }
      if (weeksOfRunway < 4) {
        riskFactors.push(`Only ${weeksOfRunway.toFixed(1)} weeks of cash runway`)
      }
      if (minBalance < 0) {
        riskFactors.push(`Minimum projected balance: $${minBalance.toFixed(2)}`)
      }
      if (weeksWithLowBalance.length > 0) {
        riskFactors.push(`${weeksWithLowBalance.length} weeks below minimum required balance`)
      }

      // Generate recommendations
      const recommendations: string[] = []
      if (riskLevel === 'critical' || riskLevel === 'high') {
        recommendations.push('Accelerate AR collections')
        recommendations.push('Negotiate extended payment terms with vendors')
        recommendations.push('Consider a line of credit or bridge financing')
      }
      if (weeksOfRunway < 8) {
        recommendations.push('Reduce discretionary spending')
        recommendations.push('Delay non-critical expenditures')
      }
      if (riskLevel === 'medium' || riskLevel === 'low') {
        recommendations.push('Maintain current cash management practices')
        recommendations.push('Continue monitoring weekly cash position')
      }

      return Result.ok({
        currentCashBalance,
        minimumRequiredBalance,
        weeksOfRunway,
        riskLevel,
        riskFactors,
        recommendations,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to analyze liquidity risk: ${message}`)
    }
  }

  /**
   * Find all projections with negative cash flow periods
   */
  public async findProjectionsWithNegativeCashFlow(): Promise<Result<CashFlowProjection[]>> {
    try {
      return await this.cashFlowProjectionRepository.findWithNegativeCashFlow()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to find projections with negative cash flow: ${message}`)
    }
  }

  /**
   * Calculate working capital metrics
   */
  public async calculateWorkingCapital(
    currentAssets: number,
    currentLiabilities: number,
    inventory: number,
    prepaidExpenses: number,
    cash: number,
    annualRevenue: number,
  ): Promise<Result<WorkingCapitalMetrics>> {
    try {
      const workingCapital = currentAssets - currentLiabilities
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0

      // Quick ratio (acid-test ratio) = (Current Assets - Inventory - Prepaid) / Current Liabilities
      const liquidAssets = currentAssets - inventory - prepaidExpenses
      const quickRatio = currentLiabilities > 0 ? liquidAssets / currentLiabilities : 0

      // Cash ratio = Cash / Current Liabilities
      const cashRatio = currentLiabilities > 0 ? cash / currentLiabilities : 0

      // Working capital turnover = Annual Revenue / Average Working Capital
      const workingCapitalTurnover = workingCapital > 0 ? annualRevenue / workingCapital : 0

      return Result.ok({
        currentAssets,
        currentLiabilities,
        workingCapital,
        currentRatio,
        quickRatio,
        cashRatio,
        workingCapitalTurnover,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate working capital: ${message}`)
    }
  }
}
