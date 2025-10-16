import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'

export type PullSignalStatus = 'pending' | 'approved' | 'in-transit' | 'received' | 'rejected'
export type PullSignalType = 'kanban' | 'demand' | 'manual'

export type PullSignalProps = {
  signalType: PullSignalType
  itemId: UniqueEntityID
  itemSku: string
  itemName: string
  fromLocationId: UniqueEntityID
  fromLocationName: string
  toLocationId: UniqueEntityID
  toLocationName: string
  requestedQuantity: number
  approvedQuantity?: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: PullSignalStatus
  demandSource?: string // e.g., "Project XYZ", "Work Order 123"
  requiredBy?: Date
  requestedBy: UniqueEntityID
  requestedByName: string
  approvedBy?: UniqueEntityID
  approvedByName?: string
  approvedAt?: Date
  receivedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * PullSignal Entity
 * Represents a demand-driven signal that pulls inventory from one location to another
 * Core component of JIT pull system
 */
export class PullSignal extends AggregateRoot<PullSignalProps> {
  private constructor(props: PullSignalProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get signalType(): PullSignalType {
    return this.props.signalType
  }

  get itemId(): UniqueEntityID {
    return this.props.itemId
  }

  get itemSku(): string {
    return this.props.itemSku
  }

  get itemName(): string {
    return this.props.itemName
  }

  get fromLocationId(): UniqueEntityID {
    return this.props.fromLocationId
  }

  get fromLocationName(): string {
    return this.props.fromLocationName
  }

  get toLocationId(): UniqueEntityID {
    return this.props.toLocationId
  }

  get toLocationName(): string {
    return this.props.toLocationName
  }

  get requestedQuantity(): number {
    return this.props.requestedQuantity
  }

  get approvedQuantity(): number | undefined {
    return this.props.approvedQuantity
  }

  get priority(): 'low' | 'normal' | 'high' | 'urgent' {
    return this.props.priority
  }

  get status(): PullSignalStatus {
    return this.props.status
  }

  get demandSource(): string | undefined {
    return this.props.demandSource
  }

  get requiredBy(): Date | undefined {
    return this.props.requiredBy
  }

  get requestedBy(): UniqueEntityID {
    return this.props.requestedBy
  }

  get requestedByName(): string {
    return this.props.requestedByName
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy
  }

  get approvedByName(): string | undefined {
    return this.props.approvedByName
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt
  }

  get receivedAt(): Date | undefined {
    return this.props.receivedAt
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

  public static create(
    props: PullSignalProps,
    id?: UniqueEntityID,
  ): Result<PullSignal> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.signalType, argumentName: 'signalType' },
      { argument: props.itemId, argumentName: 'itemId' },
      { argument: props.itemSku, argumentName: 'itemSku' },
      { argument: props.itemName, argumentName: 'itemName' },
      { argument: props.fromLocationId, argumentName: 'fromLocationId' },
      { argument: props.fromLocationName, argumentName: 'fromLocationName' },
      { argument: props.toLocationId, argumentName: 'toLocationId' },
      { argument: props.toLocationName, argumentName: 'toLocationName' },
      { argument: props.requestedQuantity, argumentName: 'requestedQuantity' },
      { argument: props.priority, argumentName: 'priority' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.requestedBy, argumentName: 'requestedBy' },
      { argument: props.requestedByName, argumentName: 'requestedByName' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.requestedQuantity <= 0) {
      return Result.fail('requested quantity must be positive')
    }

    if (props.fromLocationId.equals(props.toLocationId)) {
      return Result.fail('from and to locations must be different')
    }

    return Result.ok(new PullSignal(props, id))
  }

  /**
   * Approve the pull signal
   */
  public approve(
    approvedBy: UniqueEntityID,
    approvedByName: string,
    approvedQuantity?: number,
  ): Result<void> {
    if (this.props.status !== 'pending') {
      return Result.fail('can only approve pending pull signals')
    }

    const quantity = approvedQuantity ?? this.props.requestedQuantity

    if (quantity <= 0) {
      return Result.fail('approved quantity must be positive')
    }

    if (quantity > this.props.requestedQuantity) {
      return Result.fail('approved quantity cannot exceed requested quantity')
    }

    this.props.status = 'approved'
    this.props.approvedBy = approvedBy
    this.props.approvedByName = approvedByName
    this.props.approvedQuantity = quantity
    this.props.approvedAt = new Date()
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Reject the pull signal
   */
  public reject(reason: string): Result<void> {
    if (this.props.status !== 'pending') {
      return Result.fail('can only reject pending pull signals')
    }

    this.props.status = 'rejected'
    this.props.notes = `Rejected: ${reason}`
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Mark as in-transit (inventory is being moved)
   */
  public markInTransit(): Result<void> {
    if (this.props.status !== 'approved') {
      return Result.fail('can only mark approved pull signals as in-transit')
    }

    this.props.status = 'in-transit'
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Mark as received (inventory has arrived at destination)
   */
  public receive(): Result<void> {
    if (this.props.status !== 'in-transit') {
      return Result.fail('can only receive in-transit pull signals')
    }

    this.props.status = 'received'
    this.props.receivedAt = new Date()
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Check if signal is overdue
   */
  public isOverdue(): boolean {
    if (!this.props.requiredBy || this.props.status === 'received') {
      return false
    }

    return new Date() > this.props.requiredBy
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
