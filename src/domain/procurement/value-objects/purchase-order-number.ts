import { Guard, Result, ValueObject } from '../../shared'

type PurchaseOrderNumberProps = {
  value: string
}

const PO_REGEX = /^[A-Z0-9-]{5,30}$/

export class PurchaseOrderNumber extends ValueObject<PurchaseOrderNumberProps> {
  private constructor(props: PurchaseOrderNumberProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(raw: string): Result<PurchaseOrderNumber> {
    const guardResult = Guard.againstEmptyString(raw, 'purchase order number')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    const normalized = raw.toUpperCase()

    if (!PO_REGEX.test(normalized)) {
      return Result.fail(
        'purchase order number must be 5-30 chars, uppercase letters, numbers, or dash',
      )
    }

    return Result.ok(new PurchaseOrderNumber({ value: normalized }))
  }
}
