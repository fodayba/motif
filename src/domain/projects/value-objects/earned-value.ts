import { Guard, Result, ValueObject } from '../../shared'
import type { CurrencyCode } from '../../shared'

type EarnedValueProps = {
  amount: number
  currency: CurrencyCode
  asOfDate: Date
}

/**
 * Earned Value (EV) - Also known as Budgeted Cost of Work Performed (BCWP)
 * The value of work actually completed
 */
export class EarnedValue extends ValueObject<EarnedValueProps> {
  private constructor(props: EarnedValueProps) {
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

  public static create(props: EarnedValueProps): Result<EarnedValue> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.amount, argumentName: 'amount' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.amount < 0) {
      return Result.fail('earned value cannot be negative')
    }

    return Result.ok(new EarnedValue(props))
  }

  /**
   * Calculate EV based on budget at completion and actual progress
   * EV = BAC × % Complete
   */
  public static calculateFromProgress(
    budgetAtCompletion: number,
    currency: CurrencyCode,
    percentComplete: number,
    asOfDate: Date,
  ): Result<EarnedValue> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: budgetAtCompletion, argumentName: 'budgetAtCompletion' },
      { argument: currency, argumentName: 'currency' },
      { argument: percentComplete, argumentName: 'percentComplete' },
      { argument: asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (budgetAtCompletion < 0) {
      return Result.fail('budget at completion cannot be negative')
    }

    if (percentComplete < 0 || percentComplete > 100) {
      return Result.fail('percent complete must be between 0 and 100')
    }

    const evAmount = budgetAtCompletion * (percentComplete / 100)

    return EarnedValue.create({
      amount: evAmount,
      currency,
      asOfDate,
    })
  }
}
