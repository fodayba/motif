import { Guard, Result, ValueObject } from '../../shared'

type ItemSkuProps = {
  value: string
}

const SKU_REGEX = /^[A-Z0-9-]{4,30}$/

export class ItemSku extends ValueObject<ItemSkuProps> {
  private constructor(props: ItemSkuProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(raw: string): Result<ItemSku> {
    const guardResult = Guard.againstEmptyString(raw, 'sku')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    const normalized = raw.toUpperCase()

    if (!SKU_REGEX.test(normalized)) {
      return Result.fail('sku must be 4-30 chars, uppercase letters, numbers, or dash')
    }

    return Result.ok(new ItemSku({ value: normalized }))
  }
}
