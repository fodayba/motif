import { Guard, Result, ValueObject } from '../../shared'
import type { CurrencyCode } from '../../shared'
import type { ActualCost } from './actual-cost'
import type { EarnedValue } from './earned-value'

type CostVarianceProps = {
  amount: number
  currency: CurrencyCode
  asOfDate: Date
}

/**
 * Cost Variance (CV)
 * Measures cost performance: CV = EV - AC
 * CV > 0 = Under budget (good)
 * CV = 0 = On budget
 * CV < 0 = Over budget (bad)
 */
export class CostVariance extends ValueObject<CostVarianceProps> {
  private constructor(props: CostVarianceProps) {
    super(props)
  }

  get amount(): number {
    return this.props.amount
  }

  get currency(): CurrencyCode {
    return this.props.currency
  }

  get asOfDate(): Date {
    return this.props.asOfDate
  }

  get isUnderBudget(): boolean {
    return this.props.amount > 0
  }

  get isOnBudget(): boolean {
    return Math.abs(this.props.amount) < 100 // Within $100 tolerance
  }

  get isOverBudget(): boolean {
    return this.props.amount < 0
  }

  public static create(props: CostVarianceProps): Result<CostVariance> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.amount, argumentName: 'amount' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new CostVariance(props))
  }

  /**
   * Calculate CV from EV and AC
   * CV = EV - AC
   */
  public static calculateFromEVAndAC(
    earnedValue: EarnedValue,
    actualCost: ActualCost,
  ): Result<CostVariance> {
    if (earnedValue.currency !== actualCost.currency) {
      return Result.fail('EV and AC must have the same currency')
    }

    const cvAmount = earnedValue.amount - actualCost.amount

    return CostVariance.create({
      amount: cvAmount,
      currency: earnedValue.currency,
      asOfDate: earnedValue.asOfDate,
    })
  }
}
