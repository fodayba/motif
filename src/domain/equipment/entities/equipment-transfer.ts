import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { TransferStatus } from '../enums/transfer-status'
import { TRANSFER_STATUSES } from '../enums/transfer-status'

export type EquipmentTransferProps = {
  equipmentId: UniqueEntityID
  fromProjectId?: UniqueEntityID
  toProjectId?: UniqueEntityID
  fromSiteId?: UniqueEntityID
  toSiteId?: UniqueEntityID
  requestedBy: UniqueEntityID
  requestedAt: Date
  approvedBy?: UniqueEntityID
  approvedAt?: Date
  rejectedBy?: UniqueEntityID
  rejectedAt?: Date
  rejectionReason?: string
  status: TransferStatus
  reason: string
  scheduledTransferDate: Date
  actualTransferDate?: Date
  transportMethod?: string
  estimatedCost?: number
  actualCost?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class EquipmentTransfer extends AggregateRoot<EquipmentTransferProps> {
  private constructor(props: EquipmentTransferProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get equipmentId(): UniqueEntityID {
    return this.props.equipmentId
  }

  get fromProjectId(): UniqueEntityID | undefined {
    return this.props.fromProjectId
  }

  get toProjectId(): UniqueEntityID | undefined {
    return this.props.toProjectId
  }

  get fromSiteId(): UniqueEntityID | undefined {
    return this.props.fromSiteId
  }

  get toSiteId(): UniqueEntityID | undefined {
    return this.props.toSiteId
  }

  get requestedBy(): UniqueEntityID {
    return this.props.requestedBy
  }

  get requestedAt(): Date {
    return this.props.requestedAt
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt
  }

  get rejectedBy(): UniqueEntityID | undefined {
    return this.props.rejectedBy
  }

  get rejectedAt(): Date | undefined {
    return this.props.rejectedAt
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason
  }

  get status(): TransferStatus {
    return this.props.status
  }

  get reason(): string {
    return this.props.reason
  }

  get scheduledTransferDate(): Date {
    return this.props.scheduledTransferDate
  }

  get actualTransferDate(): Date | undefined {
    return this.props.actualTransferDate
  }

  get transportMethod(): string | undefined {
    return this.props.transportMethod
  }

  get estimatedCost(): number | undefined {
    return this.props.estimatedCost
  }

  get actualCost(): number | undefined {
    return this.props.actualCost
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Logic Methods

  public isPending(): boolean {
    return this.status === 'PENDING'
  }

  public isApproved(): boolean {
    return this.status === 'APPROVED'
  }

  public isInTransit(): boolean {
    return this.status === 'IN_TRANSIT'
  }

  public isCompleted(): boolean {
    return this.status === 'COMPLETED'
  }

  public isRejected(): boolean {
    return this.status === 'REJECTED'
  }

  public isCancelled(): boolean {
    return this.status === 'CANCELLED'
  }

  public canBeApproved(): boolean {
    return this.status === 'PENDING'
  }

  public canBeRejected(): boolean {
    return this.status === 'PENDING'
  }

  public canBeCancelled(): boolean {
    return this.status === 'PENDING' || this.status === 'APPROVED'
  }

  public canStartTransit(): boolean {
    return this.status === 'APPROVED'
  }

  public canComplete(): boolean {
    return this.status === 'IN_TRANSIT'
  }

  public approve(approvedBy: UniqueEntityID): Result<EquipmentTransfer> {
    if (!this.canBeApproved()) {
      return Result.fail(`cannot approve transfer with status: ${this.status}`)
    }

    this.props.status = 'APPROVED'
    this.props.approvedBy = approvedBy
    this.props.approvedAt = new Date()
    this.touch()

    return Result.ok(this)
  }

  public reject(rejectedBy: UniqueEntityID, reason: string): Result<EquipmentTransfer> {
    if (!this.canBeRejected()) {
      return Result.fail(`cannot reject transfer with status: ${this.status}`)
    }

    if (reason.trim().length === 0) {
      return Result.fail('rejection reason is required')
    }

    this.props.status = 'REJECTED'
    this.props.rejectedBy = rejectedBy
    this.props.rejectedAt = new Date()
    this.props.rejectionReason = reason.trim()
    this.touch()

    return Result.ok(this)
  }

  public cancel(): Result<EquipmentTransfer> {
    if (!this.canBeCancelled()) {
      return Result.fail(`cannot cancel transfer with status: ${this.status}`)
    }

    this.props.status = 'CANCELLED'
    this.touch()

    return Result.ok(this)
  }

  public startTransit(): Result<EquipmentTransfer> {
    if (!this.canStartTransit()) {
      return Result.fail(`cannot start transit with status: ${this.status}`)
    }

    this.props.status = 'IN_TRANSIT'
    this.touch()

    return Result.ok(this)
  }

  public complete(actualTransferDate?: Date, actualCost?: number): Result<EquipmentTransfer> {
    if (!this.canComplete()) {
      return Result.fail(`cannot complete transfer with status: ${this.status}`)
    }

    if (actualCost !== undefined && actualCost < 0) {
      return Result.fail('actual cost cannot be negative')
    }

    this.props.status = 'COMPLETED'
    this.props.actualTransferDate = actualTransferDate || new Date()
    if (actualCost !== undefined) {
      this.props.actualCost = actualCost
    }
    this.touch()

    return Result.ok(this)
  }

  public updateScheduledDate(date: Date): Result<EquipmentTransfer> {
    if (date < new Date()) {
      return Result.fail('scheduled transfer date cannot be in the past')
    }

    if (!this.canBeApproved() && !this.isApproved()) {
      return Result.fail('can only update scheduled date for pending or approved transfers')
    }

    this.props.scheduledTransferDate = date
    this.touch()

    return Result.ok(this)
  }

  public updateCostEstimate(cost: number): Result<EquipmentTransfer> {
    if (cost < 0) {
      return Result.fail('estimated cost cannot be negative')
    }

    this.props.estimatedCost = cost
    this.touch()

    return Result.ok(this)
  }

  public addNotes(notes: string): void {
    if (!this.props.notes) {
      this.props.notes = notes
    } else {
      this.props.notes += `\n${notes}`
    }
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(
    props: EquipmentTransferProps,
    id?: UniqueEntityID,
  ): Result<EquipmentTransfer> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.equipmentId, argumentName: 'equipmentId' },
      { argument: props.requestedBy, argumentName: 'requestedBy' },
      { argument: props.requestedAt, argumentName: 'requestedAt' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.reason, argumentName: 'reason' },
      { argument: props.scheduledTransferDate, argumentName: 'scheduledTransferDate' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!TRANSFER_STATUSES.includes(props.status)) {
      return Result.fail(`invalid transfer status: ${props.status}`)
    }

    if (props.reason.trim().length === 0) {
      return Result.fail('transfer reason cannot be empty')
    }

    // Validate that at least one destination is specified
    if (!props.toProjectId && !props.toSiteId) {
      return Result.fail('transfer must have at least a destination project or site')
    }

    if (props.requestedAt > new Date()) {
      return Result.fail('requested date cannot be in the future')
    }

    if (props.estimatedCost !== undefined && props.estimatedCost < 0) {
      return Result.fail('estimated cost cannot be negative')
    }

    if (props.actualCost !== undefined && props.actualCost < 0) {
      return Result.fail('actual cost cannot be negative')
    }

    return Result.ok(
      new EquipmentTransfer(
        {
          ...props,
          reason: props.reason.trim(),
          notes: props.notes?.trim(),
          rejectionReason: props.rejectionReason?.trim(),
        },
        id,
      ),
    )
  }
}
