import { Guard, Result, ValueObject } from '../core'
import type { CurrencyCode } from '../enums'

type MoneyProps = {
  amount: number
  currency: CurrencyCode
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props)
  }

  get amount(): number {
    return this.props.amount
  }

  get currency(): CurrencyCode {
    return this.props.currency
  }

  public static create(amount: number, currency: CurrencyCode): Result<Money> {
    const guardResult = Guard.againstNegative(amount, 'amount')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new Money({ amount, currency }))
  }
}
