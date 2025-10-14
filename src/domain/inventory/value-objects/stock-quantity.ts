import { Guard, Result, ValueObject } from '../../shared'
import type { UnitOfMeasure } from '../../shared'

export type StockQuantityProps = {
  value: number
  unit: UnitOfMeasure
}

export class StockQuantity extends ValueObject<StockQuantityProps> {
  private constructor(props: StockQuantityProps) {
    super(props)
  }

  get value(): number {
    return this.props.value
  }

  get unit(): UnitOfMeasure {
    return this.props.unit
  }

  public static create(value: number, unit: UnitOfMeasure): Result<StockQuantity> {
    const guardResult = Guard.againstNegative(value, 'quantity')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new StockQuantity({ value, unit }))
  }
}
