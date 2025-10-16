import { Result, ValueObject } from '../../shared'

interface SerialNumberProps extends Record<string, unknown> {
  value: string
}

export class SerialNumber extends ValueObject<SerialNumberProps> {
  private constructor(props: SerialNumberProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(serialNumber: string): Result<SerialNumber> {
    if (!serialNumber || serialNumber.trim().length === 0) {
      return Result.fail('Serial number cannot be empty')
    }

    if (serialNumber.length > 100) {
      return Result.fail('Serial number cannot exceed 100 characters')
    }

    // Validate format: alphanumeric with hyphens, underscores, and slashes
    const validFormat = /^[A-Z0-9\-_/]+$/i.test(serialNumber)
    if (!validFormat) {
      return Result.fail('Serial number can only contain letters, numbers, hyphens, underscores, and slashes')
    }

    return Result.ok(new SerialNumber({ value: serialNumber.toUpperCase().trim() }))
  }

  public toString(): string {
    return this.value
  }
}
