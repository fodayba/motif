import { Guard, Result, ValueObject } from '../core'

type EmailProps = {
  value: string
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(raw: string): Result<Email> {
    const guardResult = Guard.againstEmptyString(raw, 'email')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!EMAIL_REGEX.test(raw)) {
      return Result.fail('email is invalid')
    }

    return Result.ok(new Email({ value: raw.toLowerCase() }))
  }
}
