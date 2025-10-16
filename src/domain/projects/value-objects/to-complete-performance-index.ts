import { Guard, Result, ValueObject } from '../../shared'
import type { CurrencyCode } from '../../shared'

type TCPIProps = {
  value: number
  currency: CurrencyCode
  method: 'bac' | 'eac'
  asOfDate: Date
}

/**
 * To-Complete Performance Index (TCPI)
 * The cost performance required to achieve a specific target
 * TCPI = (BAC - EV) / (BAC - AC) or (BAC - EV) / (EAC - AC)
 * 
 * TCPI > 1.0 = Must improve performance to meet target
 * TCPI = 1.0 = Current performance is sufficient
 * TCPI < 1.0 = Can relax performance and still meet target
 */
export class ToCompletePerformanceIndex extends ValueObject<TCPIProps> {
  private constructor(props: TCPIProps) {
    super(props)
  }

  get value(): number {
    return this.props.value
  }

  get currency(): CurrencyCode {
    return this.props.currency
  }

  get method(): TCPIProps['method'] {
    return this.props.method
  }

  get asOfDate(): Date {
    return this.props.asOfDate
  }

  get mustImprovePerformance(): boolean {
    return this.props.value > 1.0
  }

  get performanceIsSufficient(): boolean {
    return Math.abs(this.props.value - 1.0) < 0.02 // Within 2% tolerance
  }

  get canRelaxPerformance(): boolean {
    return this.props.value < 1.0
  }

  get isAchievable(): boolean {
    // TCPI > 1.20 is generally considered very difficult to achieve
    return this.props.value <= 1.20
  }

  get performanceDescription(): string {
    if (this.canRelaxPerformance) {
      return 'Performance can be relaxed'
    }
    if (this.performanceIsSufficient) {
      return 'Current performance is sufficient'
    }
    if (this.value > 1.20) {
      return 'Significant performance improvement required (may be unachievable)'
    }
    return 'Performance improvement required'
  }

  public static create(props: TCPIProps): Result<ToCompletePerformanceIndex> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.value, argumentName: 'value' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.method, argumentName: 'method' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.value < 0) {
      return Result.fail('TCPI cannot be negative')
    }

    return Result.ok(new ToCompletePerformanceIndex(props))
  }

  /**
   * Calculate TCPI based on BAC (original budget)
   * TCPI = (BAC - EV) / (BAC - AC)
   */
  public static calculateBasedOnBAC(
    budgetAtCompletion: number,
    earnedValue: number,
    actualCost: number,
    currency: CurrencyCode,
    asOfDate: Date,
  ): Result<ToCompletePerformanceIndex> {
    if (budgetAtCompletion < 0) {
      return Result.fail('budget at completion cannot be negative')
    }

    const remainingBudget = budgetAtCompletion - actualCost
    if (remainingBudget === 0) {
      return Result.fail('no remaining budget for TCPI calculation')
    }

    const remainingWork = budgetAtCompletion - earnedValue
    const tcpiValue = remainingWork / remainingBudget

    return ToCompletePerformanceIndex.create({
      value: tcpiValue,
      currency,
      method: 'bac',
      asOfDate,
    })
  }

  /**
   * Calculate TCPI based on EAC (revised estimate)
   * TCPI = (BAC - EV) / (EAC - AC)
   */
  public static calculateBasedOnEAC(
    budgetAtCompletion: number,
    earnedValue: number,
    actualCost: number,
    estimateAtCompletion: number,
    currency: CurrencyCode,
    asOfDate: Date,
  ): Result<ToCompletePerformanceIndex> {
    if (budgetAtCompletion < 0) {
      return Result.fail('budget at completion cannot be negative')
    }

    if (estimateAtCompletion < 0) {
      return Result.fail('estimate at completion cannot be negative')
    }

    const remainingBudget = estimateAtCompletion - actualCost
    if (remainingBudget === 0) {
      return Result.fail('no remaining budget for TCPI calculation')
    }

    const remainingWork = budgetAtCompletion - earnedValue
    const tcpiValue = remainingWork / remainingBudget

    return ToCompletePerformanceIndex.create({
      value: tcpiValue,
      currency,
      method: 'eac',
      asOfDate,
    })
  }
}
