import { Result, ValueObject } from '../../shared'

interface LotNumberProps extends Record<string, unknown> {
  value: string
}

export class LotNumber extends ValueObject<LotNumberProps> {
  private constructor(props: LotNumberProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(lotNumber: string): Result<LotNumber> {
    if (!lotNumber || lotNumber.trim().length === 0) {
      return Result.fail('Lot number cannot be empty')
    }

    if (lotNumber.length > 50) {
      return Result.fail('Lot number cannot exceed 50 characters')
    }

    // Validate format: alphanumeric with hyphens and underscores
    const validFormat = /^[A-Z0-9\-_]+$/i.test(lotNumber)
    if (!validFormat) {
      return Result.fail('Lot number can only contain letters, numbers, hyphens, and underscores')
    }

    return Result.ok(new LotNumber({ value: lotNumber.toUpperCase().trim() }))
  }

  public toString(): string {
    return this.value
  }
}
