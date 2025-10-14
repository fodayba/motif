import { Email, Guard, PhoneNumber, Result, ValueObject } from '../../shared'

type VendorProfileProps = {
  legalName: string
  taxId?: string
  contactName: string
  contactEmail: Email
  contactPhone?: PhoneNumber
  website?: string
}

export class VendorProfile extends ValueObject<VendorProfileProps> {
  private constructor(props: VendorProfileProps) {
    super(props)
  }

  get legalName(): string {
    return this.props.legalName
  }

  get taxId(): string | undefined {
    return this.props.taxId
  }

  get contactName(): string {
    return this.props.contactName
  }

  get contactEmail(): Email {
    return this.props.contactEmail
  }

  get contactPhone(): PhoneNumber | undefined {
    return this.props.contactPhone
  }

  get website(): string | undefined {
    return this.props.website
  }

  public static create(props: VendorProfileProps): Result<VendorProfile> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.legalName, argumentName: 'legalName' },
      { argument: props.contactName, argumentName: 'contactName' },
      { argument: props.contactEmail, argumentName: 'contactEmail' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(
      new VendorProfile({
        legalName: props.legalName.trim(),
        taxId: props.taxId?.trim(),
        contactName: props.contactName.trim(),
        contactEmail: props.contactEmail,
        contactPhone: props.contactPhone,
        website: props.website?.trim(),
      }),
    )
  }
}
