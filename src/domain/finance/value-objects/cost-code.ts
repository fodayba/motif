import { Guard, Result, ValueObject } from '../../shared'

type CostCodeProps = {
  value: string
  description?: string
}

const COST_CODE_REGEX = /^[A-Z]{2,5}-[0-9]{2,4}$/

export class CostCode extends ValueObject<CostCodeProps> {
  private constructor(props: CostCodeProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  get description(): string | undefined {
    return this.props.description
  }

  public static create(value: string, description?: string): Result<CostCode> {
    const guardResult = Guard.againstEmptyString(value, 'cost code')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    const normalized = value.toUpperCase()

    if (!COST_CODE_REGEX.test(normalized)) {
      return Result.fail('cost code must match pattern AA-## (letters-numbers)')
    }

    return Result.ok(
      new CostCode({
        value: normalized,
        description: description?.trim(),
      }),
    )
  }
}
