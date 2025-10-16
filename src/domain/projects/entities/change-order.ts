import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'
import { CHANGE_ORDER_STATUSES, type ChangeOrderStatus } from '../enums/change-order-status'

export type ChangeOrderImpact = {
  costImpact: Money // Positive = cost increase, negative = cost decrease
  scheduleImpact: number // in days, positive = delay, negative = acceleration
  scopeImpact: string // Description of scope changes
}

export type ChangeOrderApproval = {
  approvedBy: UniqueEntityID
  approvedByName: string
  approvedAt: Date
  comments?: string
}

export type ChangeOrderRejection = {
  rejectedBy: UniqueEntityID
  rejectedByName: string
  rejectedAt: Date
  reason: string
}

export type ChangeOrderProps = {
  projectId: UniqueEntityID
  changeOrderNumber: string
  title: string
  description: string
  reason: string
  category: 'scope' | 'schedule' | 'cost' | 'quality' | 'risk' | 'other'
  requestedBy: UniqueEntityID
  requestedByName: string
  status: ChangeOrderStatus
  impact: ChangeOrderImpact
  attachments: string[] // File URLs or IDs
  approvals: ChangeOrderApproval[]
  rejection?: ChangeOrderRejection
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class ChangeOrder extends AggregateRoot<ChangeOrderProps> {
  private constructor(props: ChangeOrderProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get changeOrderNumber(): string {
    return this.props.changeOrderNumber
  }

  get title(): string {
    return this.props.title
  }

  get description(): string {
    return this.props.description
  }

  get reason(): string {
    return this.props.reason
  }

  get category(): ChangeOrderProps['category'] {
    return this.props.category
  }

  get requestedBy(): UniqueEntityID {
    return this.props.requestedBy
  }

  get requestedByName(): string {
    return this.props.requestedByName
  }

  get status(): ChangeOrderStatus {
    return this.props.status
  }

  get impact(): ChangeOrderImpact {
    return this.props.impact
  }

  get attachments(): string[] {
    return this.props.attachments
  }

  get approvals(): ChangeOrderApproval[] {
    return this.props.approvals
  }

  get rejection(): ChangeOrderRejection | undefined {
    return this.props.rejection
  }

  get submittedAt(): Date | undefined {
    return this.props.submittedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Computed properties
  get isApproved(): boolean {
    return this.status === 'approved'
  }

  get isRejected(): boolean {
    return this.status === 'rejected'
  }

  get isPending(): boolean {
    return this.status === 'submitted' || this.status === 'under-review'
  }

  get canBeEdited(): boolean {
    return this.status === 'draft'
  }

  get requiresApproval(): boolean {
    // Logic to determine if change order needs approval based on thresholds
    const costThreshold = 10000 // Example: $10k
    const scheduleThreshold = 5 // Example: 5 days
    
    return (
      Math.abs(this.impact.costImpact.amount) >= costThreshold ||
      Math.abs(this.impact.scheduleImpact) >= scheduleThreshold
    )
  }

  // Business Logic Methods

  public submit(): Result<ChangeOrder> {
    if (this.status !== 'draft') {
      return Result.fail('only draft change orders can be submitted')
    }

    if (!this.impact) {
      return Result.fail('impact analysis is required before submission')
    }

    this.props.status = 'submitted'
    this.props.submittedAt = new Date()
    this.touch()

    return Result.ok(this)
  }

  public startReview(): Result<ChangeOrder> {
    if (this.status !== 'submitted') {
      return Result.fail('only submitted change orders can be moved to review')
    }

    this.props.status = 'under-review'
    this.touch()

    return Result.ok(this)
  }

  public approve(approvedBy: UniqueEntityID, approvedByName: string, comments?: string): Result<ChangeOrder> {
    if (this.status !== 'submitted' && this.status !== 'under-review') {
      return Result.fail('only submitted or under-review change orders can be approved')
    }

    const approval: ChangeOrderApproval = {
      approvedBy,
      approvedByName,
      approvedAt: new Date(),
      comments,
    }

    this.props.approvals.push(approval)
    this.props.status = 'approved'
    this.props.rejection = undefined // Clear any previous rejection
    this.touch()

    return Result.ok(this)
  }

  public reject(rejectedBy: UniqueEntityID, rejectedByName: string, reason: string): Result<ChangeOrder> {
    if (this.status !== 'submitted' && this.status !== 'under-review') {
      return Result.fail('only submitted or under-review change orders can be rejected')
    }

    if (!reason || reason.trim().length === 0) {
      return Result.fail('rejection reason is required')
    }

    this.props.rejection = {
      rejectedBy,
      rejectedByName,
      rejectedAt: new Date(),
      reason: reason.trim(),
    }

    this.props.status = 'rejected'
    this.touch()

    return Result.ok(this)
  }

  public cancel(): Result<ChangeOrder> {
    if (this.status === 'approved') {
      return Result.fail('cannot cancel an approved change order')
    }

    if (this.status === 'cancelled') {
      return Result.fail('change order is already cancelled')
    }

    this.props.status = 'cancelled'
    this.touch()

    return Result.ok(this)
  }

  public updateImpact(impact: ChangeOrderImpact): Result<ChangeOrder> {
    if (!this.canBeEdited) {
      return Result.fail('cannot update impact of a change order that is not in draft status')
    }

    this.props.impact = impact
    this.touch()

    return Result.ok(this)
  }

  public addAttachment(attachmentUrl: string): Result<ChangeOrder> {
    if (!this.canBeEdited) {
      return Result.fail('cannot add attachments to a change order that is not in draft status')
    }

    const alreadyExists = this.props.attachments.includes(attachmentUrl)
    if (alreadyExists) {
      return Result.fail('attachment already exists')
    }

    this.props.attachments.push(attachmentUrl)
    this.touch()

    return Result.ok(this)
  }

  public removeAttachment(attachmentUrl: string): Result<ChangeOrder> {
    if (!this.canBeEdited) {
      return Result.fail('cannot remove attachments from a change order that is not in draft status')
    }

    const index = this.props.attachments.indexOf(attachmentUrl)
    if (index === -1) {
      return Result.fail('attachment not found')
    }

    this.props.attachments.splice(index, 1)
    this.touch()

    return Result.ok(this)
  }

  public updateDescription(description: string, reason: string): Result<ChangeOrder> {
    if (!this.canBeEdited) {
      return Result.fail('cannot update description of a change order that is not in draft status')
    }

    const trimmedDesc = description.trim()
    const trimmedReason = reason.trim()

    if (trimmedDesc.length === 0) {
      return Result.fail('description cannot be empty')
    }

    if (trimmedReason.length === 0) {
      return Result.fail('reason cannot be empty')
    }

    this.props.description = trimmedDesc
    this.props.reason = trimmedReason
    this.touch()

    return Result.ok(this)
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(props: ChangeOrderProps, id?: UniqueEntityID): Result<ChangeOrder> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.changeOrderNumber, argumentName: 'changeOrderNumber' },
      { argument: props.title, argumentName: 'title' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.reason, argumentName: 'reason' },
      { argument: props.category, argumentName: 'category' },
      { argument: props.requestedBy, argumentName: 'requestedBy' },
      { argument: props.requestedByName, argumentName: 'requestedByName' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.impact, argumentName: 'impact' },
      { argument: props.attachments, argumentName: 'attachments' },
      { argument: props.approvals, argumentName: 'approvals' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!CHANGE_ORDER_STATUSES.includes(props.status)) {
      return Result.fail('change order status is invalid')
    }

    const trimmedTitle = props.title.trim()
    const trimmedDesc = props.description.trim()
    const trimmedReason = props.reason.trim()

    if (trimmedTitle.length === 0) {
      return Result.fail('title cannot be empty')
    }

    if (trimmedDesc.length === 0) {
      return Result.fail('description cannot be empty')
    }

    if (trimmedReason.length === 0) {
      return Result.fail('reason cannot be empty')
    }

    return Result.ok(
      new ChangeOrder(
        {
          ...props,
          title: trimmedTitle,
          description: trimmedDesc,
          reason: trimmedReason,
          requestedByName: props.requestedByName.trim(),
        },
        id,
      ),
    )
  }
}
