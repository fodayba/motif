import { Guard, Result, ValueObject } from '../../shared'
import type { ActualCost } from './actual-cost'
import type { EarnedValue } from './earned-value'

type CPIProps = {
  value: number
  asOfDate: Date
}

/**
 * Cost Performance Index (CPI)
 * Measures cost efficiency: CPI = EV / AC
 * CPI > 1.0 = Under budget (good)
 * CPI = 1.0 = On budget
 * CPI < 1.0 = Over budget (bad)
 */
export class CostPerformanceIndex extends ValueObject<CPIProps> {
  private constructor(props: CPIProps) {
    super(props)
  }

  get value(): number {
    return this.props.value
  }

  get asOfDate(): Date {
    return this.props.asOfDate
  }

  get isUnderBudget(): boolean {
    return this.props.value > 1.0
  }

  get isOnBudget(): boolean {
    return Math.abs(this.props.value - 1.0) < 0.02 // Within 2% tolerance
  }

  get isOverBudget(): boolean {
    return this.props.value < 1.0
  }

  get performanceDescription(): string {
    if (this.isUnderBudget) {
      return 'Under budget'
    }
    if (this.isOnBudget) {
      return 'On budget'
    }
    return 'Over budget'
  }

  public static create(props: CPIProps): Result<CostPerformanceIndex> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.value, argumentName: 'value' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.value < 0) {
      return Result.fail('CPI cannot be negative')
    }

    return Result.ok(new CostPerformanceIndex(props))
  }

  /**
   * Calculate CPI from EV and AC
   * CPI = EV / AC
   */
  public static calculateFromEVAndAC(
    earnedValue: EarnedValue,
    actualCost: ActualCost,
  ): Result<CostPerformanceIndex> {
    if (earnedValue.currency !== actualCost.currency) {
      return Result.fail('EV and AC must have the same currency')
    }

    if (actualCost.amount === 0) {
      return Result.fail('actual cost cannot be zero for CPI calculation')
    }

    const cpiValue = earnedValue.amount / actualCost.amount

    return CostPerformanceIndex.create({
      value: cpiValue,
      asOfDate: earnedValue.asOfDate,
    })
  }
}
