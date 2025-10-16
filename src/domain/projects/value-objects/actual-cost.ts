import { Guard, Result, ValueObject } from '../../shared'
import type { CurrencyCode } from '../../shared'

type ActualCostProps = {
  amount: number
  currency: CurrencyCode
  asOfDate: Date
}

/**
 * Actual Cost (AC) - Also known as Actual Cost of Work Performed (ACWP)
 * The total costs actually incurred and recorded in accomplishing work performed
 */
export class ActualCost extends ValueObject<ActualCostProps> {
  private constructor(props: ActualCostProps) {
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

  public static create(props: ActualCostProps): Result<ActualCost> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.amount, argumentName: 'amount' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.amount < 0) {
      return Result.fail('actual cost cannot be negative')
    }

    return Result.ok(new ActualCost(props))
  }
}
