import { Guard, Result, ValueObject } from '../core'

type PhoneNumberProps = {
  value: string
}

const PHONE_REGEX = /^\+?[0-9\-()\s]{7,20}$/

export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  private constructor(props: PhoneNumberProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(raw: string): Result<PhoneNumber> {
    const guardResult = Guard.againstEmptyString(raw, 'phone')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!PHONE_REGEX.test(raw)) {
      return Result.fail('phone is invalid')
    }

    return Result.ok(new PhoneNumber({ value: raw }))
  }
}
