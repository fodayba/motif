import { Guard, Result, ValueObject } from '../../shared'

type UserProfileProps = {
  firstName: string
  lastName: string
  jobTitle?: string
}

export class UserProfile extends ValueObject<UserProfileProps> {
  private constructor(props: UserProfileProps) {
    super(props)
  }

  get firstName(): string {
    return this.props.firstName
  }

  get lastName(): string {
    return this.props.lastName
  }

  get jobTitle(): string | undefined {
    return this.props.jobTitle
  }

  get displayName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim()
  }

  public static create(
    props: UserProfileProps,
  ): Result<UserProfile> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.firstName, argumentName: 'firstName' },
      { argument: props.lastName, argumentName: 'lastName' },
    ])
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.firstName.trim().length === 0 || props.lastName.trim().length === 0) {
      return Result.fail('firstName and lastName cannot be empty')
    }

    return Result.ok(
      new UserProfile({
        firstName: props.firstName.trim(),
        lastName: props.lastName.trim(),
        jobTitle: props.jobTitle?.trim(),
      }),
    )
  }
}
