import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { VendorStatus } from '../enums/vendor-status'
import { VENDOR_STATUSES } from '../enums/vendor-status'
import type { VendorProfile } from '../value-objects/vendor-profile'

export type VendorCapability = {
  category: string
  certifications?: string[]
}

type PerformanceMetrics = {
  onTimeDeliveryRate: number
  qualityScore: number
  disputeCount: number
}

type VendorProps = {
  profile: VendorProfile
  status: VendorStatus
  rating: number
  capabilities: VendorCapability[]
  performance: PerformanceMetrics
  paymentTerms: string
  createdAt: Date
  updatedAt: Date
}

export class Vendor extends AggregateRoot<VendorProps> {
  private constructor(props: VendorProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get profile(): VendorProfile {
    return this.props.profile
  }

  get status(): VendorStatus {
    return this.props.status
  }

  get rating(): number {
    return this.props.rating
  }

  get capabilities(): VendorCapability[] {
    return [...this.props.capabilities]
  }

  get performance(): PerformanceMetrics {
    return { ...this.props.performance }
  }

  get paymentTerms(): string {
    return this.props.paymentTerms
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(props: VendorProps, id?: UniqueEntityID): Result<Vendor> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.profile, argumentName: 'profile' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!VENDOR_STATUSES.includes(props.status)) {
      return Result.fail('vendor status is invalid')
    }

    if (props.rating < 0 || props.rating > 5) {
      return Result.fail('vendor rating must be between 0 and 5')
    }

    return Result.ok(
      new Vendor(
        {
          ...props,
          capabilities: props.capabilities.map((capability) => ({
            category: capability.category.trim(),
            certifications: capability.certifications?.map((cert) => cert.trim()),
          })),
          paymentTerms: props.paymentTerms.trim(),
        },
        id,
      ),
    )
  }

  public updateStatus(status: VendorStatus) {
    if (!VENDOR_STATUSES.includes(status)) {
      throw new Error('vendor status is invalid')
    }

    this.props.status = status
    this.touch()
  }

  public updateRating(rating: number) {
    if (rating < 0 || rating > 5) {
      throw new Error('vendor rating must be between 0 and 5')
    }

    this.props.rating = rating
    this.touch()
  }

  public updatePerformance(performance: Partial<PerformanceMetrics>) {
    this.props.performance = {
      ...this.props.performance,
      ...performance,
    }
    this.touch()
  }

  public updatePaymentTerms(terms: string) {
    if (terms.trim().length === 0) {
      throw new Error('payment terms cannot be empty')
    }

    this.props.paymentTerms = terms.trim()
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
