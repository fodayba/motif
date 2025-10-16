import { Result, ValueObject } from '../../shared'

interface BatchNumberProps extends Record<string, unknown> {
  value: string
}

export class BatchNumber extends ValueObject<BatchNumberProps> {
  private constructor(props: BatchNumberProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(batchNumber: string): Result<BatchNumber> {
    if (!batchNumber || batchNumber.trim().length === 0) {
      return Result.fail('Batch number cannot be empty')
    }

    if (batchNumber.length > 50) {
      return Result.fail('Batch number cannot exceed 50 characters')
    }

    // Validate format: alphanumeric with hyphens and underscores
    const validFormat = /^[A-Z0-9\-_]+$/i.test(batchNumber)
    if (!validFormat) {
      return Result.fail('Batch number can only contain letters, numbers, hyphens, and underscores')
    }

    return Result.ok(new BatchNumber({ value: batchNumber.toUpperCase().trim() }))
  }

  public toString(): string {
    return this.value
  }
}
