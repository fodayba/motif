import { Money, Result, Guard } from '../../shared'

/**
 * Work-in-Progress (WIP) Report Value Objects
 * For percentage-of-completion revenue recognition and job profitability tracking
 */

export type WIPReportProps = {
  projectId: string
  projectName: string
  reportDate: Date
  
  // Contract values
  originalContractAmount: Money
  approvedChangeOrders: Money
  revisedContractAmount: Money
  
  // Costs
  costsToDate: Money
  estimatedCostToComplete: Money
  estimatedTotalCost: Money
  
  // Revenue recognition
  percentComplete: number // 0-100
  earnedRevenue: Money
  billedToDate: Money
  costOfEarnedRevenue: Money
  
  // Profitability
  estimatedGrossProfit: Money
  estimatedGrossProfitPercent: number
  grossProfitRecognized: Money
  
  // Over/under billing
  overUnderBillings: Money // Positive = over-billed, Negative = under-billed
}

export class WIPReport {
  private readonly props: WIPReportProps
  
  private constructor(props: WIPReportProps) {
    this.props = props
  }

  static create(props: WIPReportProps): Result<WIPReport> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.projectName, argumentName: 'projectName' },
      { argument: props.reportDate, argumentName: 'reportDate' },
      { argument: props.originalContractAmount, argumentName: 'originalContractAmount' },
      { argument: props.approvedChangeOrders, argumentName: 'approvedChangeOrders' },
      { argument: props.revisedContractAmount, argumentName: 'revisedContractAmount' },
      { argument: props.costsToDate, argumentName: 'costsToDate' },
      { argument: props.estimatedCostToComplete, argumentName: 'estimatedCostToComplete' },
      { argument: props.estimatedTotalCost, argumentName: 'estimatedTotalCost' },
      { argument: props.percentComplete, argumentName: 'percentComplete' },
      { argument: props.earnedRevenue, argumentName: 'earnedRevenue' },
      { argument: props.billedToDate, argumentName: 'billedToDate' },
      { argument: props.costOfEarnedRevenue, argumentName: 'costOfEarnedRevenue' },
      { argument: props.estimatedGrossProfit, argumentName: 'estimatedGrossProfit' },
      { argument: props.estimatedGrossProfitPercent, argumentName: 'estimatedGrossProfitPercent' },
      { argument: props.grossProfitRecognized, argumentName: 'grossProfitRecognized' },
      { argument: props.overUnderBillings, argumentName: 'overUnderBillings' }
    ])

    if (!guardResult.success) {
      return Result.fail<WIPReport>((guardResult as any).message || 'Invalid WIP report properties')
    }

    // Validate percent complete range
    if (props.percentComplete < 0 || props.percentComplete > 100) {
      return Result.fail<WIPReport>('Percent complete must be between 0 and 100')
    }

    // Validate all money amounts are same currency
    const currency = props.originalContractAmount.currency
    const amounts = [
      props.approvedChangeOrders,
      props.revisedContractAmount,
      props.costsToDate,
      props.estimatedCostToComplete,
      props.estimatedTotalCost,
      props.earnedRevenue,
      props.billedToDate,
      props.costOfEarnedRevenue,
      props.estimatedGrossProfit,
      props.grossProfitRecognized,
      props.overUnderBillings
    ]

    if (!amounts.every(a => a.currency === currency)) {
      return Result.fail<WIPReport>('All money amounts must use the same currency')
    }

    return Result.ok<WIPReport>(new WIPReport(props))
  }

  get projectId(): string {
    return this.props.projectId
  }

  get projectName(): string {
    return this.props.projectName
  }

  get reportDate(): Date {
    return this.props.reportDate
  }

  get originalContractAmount(): Money {
    return this.props.originalContractAmount
  }

  get approvedChangeOrders(): Money {
    return this.props.approvedChangeOrders
  }

  get revisedContractAmount(): Money {
    return this.props.revisedContractAmount
  }

  get costsToDate(): Money {
    return this.props.costsToDate
  }

  get estimatedCostToComplete(): Money {
    return this.props.estimatedCostToComplete
  }

  get estimatedTotalCost(): Money {
    return this.props.estimatedTotalCost
  }

  get percentComplete(): number {
    return this.props.percentComplete
  }

  get earnedRevenue(): Money {
    return this.props.earnedRevenue
  }

  get billedToDate(): Money {
    return this.props.billedToDate
  }

  get costOfEarnedRevenue(): Money {
    return this.props.costOfEarnedRevenue
  }

  get estimatedGrossProfit(): Money {
    return this.props.estimatedGrossProfit
  }

  get estimatedGrossProfitPercent(): number {
    return this.props.estimatedGrossProfitPercent
  }

  get grossProfitRecognized(): Money {
    return this.props.grossProfitRecognized
  }

  get overUnderBillings(): Money {
    return this.props.overUnderBillings
  }

  // Computed properties
  get isOverBilled(): boolean {
    return this.props.overUnderBillings.amount > 0
  }

  get isUnderBilled(): boolean {
    return this.props.overUnderBillings.amount < 0
  }

  get isOnBudget(): boolean {
    return this.props.costsToDate.amount <= this.props.estimatedTotalCost.amount
  }

  get isOverBudget(): boolean {
    return this.props.costsToDate.amount > this.props.estimatedTotalCost.amount
  }

  get costVariance(): Money {
    const variance = this.props.estimatedTotalCost.amount - this.props.costsToDate.amount
    const result = Money.create(variance, this.props.costsToDate.currency)
    return result.isSuccess ? result.value! : this.props.costsToDate
  }

  get revenueRemaining(): Money {
    const remaining = this.props.revisedContractAmount.amount - this.props.earnedRevenue.amount
    const result = Money.create(remaining, this.props.earnedRevenue.currency)
    return result.isSuccess ? result.value! : this.props.earnedRevenue
  }

  // Helper to check if project is profitable
  get isProfitable(): boolean {
    return this.props.estimatedGrossProfit.amount > 0
  }

  // Helper to check if project is in loss
  get isInLoss(): boolean {
    return this.props.estimatedGrossProfit.amount < 0
  }
}

/**
 * WIP Summary for multiple projects (portfolio view)
 */
export type WIPSummaryProps = {
  reportDate: Date
  totalProjects: number
  
  // Aggregated contract values
  totalContractAmount: Money
  totalApprovedChangeOrders: Money
  totalRevisedContractAmount: Money
  
  // Aggregated costs
  totalCostsToDate: Money
  totalEstimatedCostToComplete: Money
  totalEstimatedTotalCost: Money
  
  // Aggregated revenue
  totalEarnedRevenue: Money
  totalBilledToDate: Money
  totalCostOfEarnedRevenue: Money
  
  // Aggregated profitability
  totalEstimatedGrossProfit: Money
  averageGrossProfitPercent: number
  totalGrossProfitRecognized: Money
  
  // Aggregated over/under billing
  totalOverUnderBillings: Money
  
  // Project breakdown stats
  projectsOverBilled: number
  projectsUnderBilled: number
  projectsOverBudget: number
  projectsOnBudget: number
  profitableProjects: number
  unprofitableProjects: number
}

export class WIPSummary {
  private readonly props: WIPSummaryProps
  
  private constructor(props: WIPSummaryProps) {
    this.props = props
  }

  static create(props: WIPSummaryProps): Result<WIPSummary> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.reportDate, argumentName: 'reportDate' },
      { argument: props.totalProjects, argumentName: 'totalProjects' },
      { argument: props.totalContractAmount, argumentName: 'totalContractAmount' },
      { argument: props.totalApprovedChangeOrders, argumentName: 'totalApprovedChangeOrders' },
      { argument: props.totalRevisedContractAmount, argumentName: 'totalRevisedContractAmount' },
      { argument: props.totalCostsToDate, argumentName: 'totalCostsToDate' },
      { argument: props.totalEstimatedCostToComplete, argumentName: 'totalEstimatedCostToComplete' },
      { argument: props.totalEstimatedTotalCost, argumentName: 'totalEstimatedTotalCost' },
      { argument: props.totalEarnedRevenue, argumentName: 'totalEarnedRevenue' },
      { argument: props.totalBilledToDate, argumentName: 'totalBilledToDate' },
      { argument: props.totalCostOfEarnedRevenue, argumentName: 'totalCostOfEarnedRevenue' },
      { argument: props.totalEstimatedGrossProfit, argumentName: 'totalEstimatedGrossProfit' },
      { argument: props.averageGrossProfitPercent, argumentName: 'averageGrossProfitPercent' },
      { argument: props.totalGrossProfitRecognized, argumentName: 'totalGrossProfitRecognized' },
      { argument: props.totalOverUnderBillings, argumentName: 'totalOverUnderBillings' }
    ])

    if (!guardResult.success) {
      return Result.fail<WIPSummary>((guardResult as any).message || 'Invalid WIP summary properties')
    }

    // Validate currency consistency
    const currency = props.totalContractAmount.currency
    const amounts = [
      props.totalApprovedChangeOrders,
      props.totalRevisedContractAmount,
      props.totalCostsToDate,
      props.totalEstimatedCostToComplete,
      props.totalEstimatedTotalCost,
      props.totalEarnedRevenue,
      props.totalBilledToDate,
      props.totalCostOfEarnedRevenue,
      props.totalEstimatedGrossProfit,
      props.totalGrossProfitRecognized,
      props.totalOverUnderBillings
    ]

    if (!amounts.every(a => a.currency === currency)) {
      return Result.fail<WIPSummary>('All money amounts must use the same currency')
    }

    return Result.ok<WIPSummary>(new WIPSummary(props))
  }

  get reportDate(): Date {
    return this.props.reportDate
  }

  get totalProjects(): number {
    return this.props.totalProjects
  }

  get totalContractAmount(): Money {
    return this.props.totalContractAmount
  }

  get totalApprovedChangeOrders(): Money {
    return this.props.totalApprovedChangeOrders
  }

  get totalRevisedContractAmount(): Money {
    return this.props.totalRevisedContractAmount
  }

  get totalCostsToDate(): Money {
    return this.props.totalCostsToDate
  }

  get totalEstimatedCostToComplete(): Money {
    return this.props.totalEstimatedCostToComplete
  }

  get totalEstimatedTotalCost(): Money {
    return this.props.totalEstimatedTotalCost
  }

  get totalEarnedRevenue(): Money {
    return this.props.totalEarnedRevenue
  }

  get totalBilledToDate(): Money {
    return this.props.totalBilledToDate
  }

  get totalCostOfEarnedRevenue(): Money {
    return this.props.totalCostOfEarnedRevenue
  }

  get totalEstimatedGrossProfit(): Money {
    return this.props.totalEstimatedGrossProfit
  }

  get averageGrossProfitPercent(): number {
    return this.props.averageGrossProfitPercent
  }

  get totalGrossProfitRecognized(): Money {
    return this.props.totalGrossProfitRecognized
  }

  get totalOverUnderBillings(): Money {
    return this.props.totalOverUnderBillings
  }

  get projectsOverBilled(): number {
    return this.props.projectsOverBilled
  }

  get projectsUnderBilled(): number {
    return this.props.projectsUnderBilled
  }

  get projectsOverBudget(): number {
    return this.props.projectsOverBudget
  }

  get projectsOnBudget(): number {
    return this.props.projectsOnBudget
  }

  get profitableProjects(): number {
    return this.props.profitableProjects
  }

  get unprofitableProjects(): number {
    return this.props.unprofitableProjects
  }

  // Computed portfolio metrics
  get overallPercentComplete(): number {
    if (this.props.totalRevisedContractAmount.amount === 0) return 0
    return (this.props.totalEarnedRevenue.amount / this.props.totalRevisedContractAmount.amount) * 100
  }

  get portfolioHealthScore(): number {
    // Simple health score: 0-100 based on profitability and budget adherence
    const profitabilityScore = (this.props.profitableProjects / this.props.totalProjects) * 50
    const budgetScore = (this.props.projectsOnBudget / this.props.totalProjects) * 50
    return Math.round(profitabilityScore + budgetScore)
  }
}
