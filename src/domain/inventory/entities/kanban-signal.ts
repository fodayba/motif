import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'

export type KanbanSignalStatus = 'active' | 'triggered' | 'fulfilled' | 'cancelled'

export type KanbanSignalProps = {
  itemId: UniqueEntityID
  itemSku: string
  itemName: string
  triggerQuantity: number
  orderQuantity: number
  currentQuantity: number
  status: KanbanSignalStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  locationId: UniqueEntityID
  locationName: string
  supplierId?: UniqueEntityID
  supplierName?: string
  triggeredAt?: Date
  fulfilledAt?: Date
  expectedDeliveryDate?: Date
  notes?: string
  createdBy: UniqueEntityID
  createdAt: Date
  updatedAt: Date
}

/**
 * KanbanSignal Entity
 * Represents a visual signal in the JIT system that triggers replenishment
 * when inventory reaches a specific threshold (pull system)
 */
export class KanbanSignal extends AggregateRoot<KanbanSignalProps> {
  private constructor(props: KanbanSignalProps, id?: UniqueEntityID) {
    super(props, id)
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

  get triggerQuantity(): number {
    return this.props.triggerQuantity
  }

  get orderQuantity(): number {
    return this.props.orderQuantity
  }

  get currentQuantity(): number {
    return this.props.currentQuantity
  }

  get status(): KanbanSignalStatus {
    return this.props.status
  }

  get priority(): 'low' | 'normal' | 'high' | 'urgent' {
    return this.props.priority
  }

  get locationId(): UniqueEntityID {
    return this.props.locationId
  }

  get locationName(): string {
    return this.props.locationName
  }

  get supplierId(): UniqueEntityID | undefined {
    return this.props.supplierId
  }

  get supplierName(): string | undefined {
    return this.props.supplierName
  }

  get triggeredAt(): Date | undefined {
    return this.props.triggeredAt
  }

  get fulfilledAt(): Date | undefined {
    return this.props.fulfilledAt
  }

  get expectedDeliveryDate(): Date | undefined {
    return this.props.expectedDeliveryDate
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get createdBy(): UniqueEntityID {
    return this.props.createdBy
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(
    props: KanbanSignalProps,
    id?: UniqueEntityID,
  ): Result<KanbanSignal> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.itemId, argumentName: 'itemId' },
      { argument: props.itemSku, argumentName: 'itemSku' },
      { argument: props.itemName, argumentName: 'itemName' },
      { argument: props.triggerQuantity, argumentName: 'triggerQuantity' },
      { argument: props.orderQuantity, argumentName: 'orderQuantity' },
      { argument: props.currentQuantity, argumentName: 'currentQuantity' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.priority, argumentName: 'priority' },
      { argument: props.locationId, argumentName: 'locationId' },
      { argument: props.locationName, argumentName: 'locationName' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.triggerQuantity < 0) {
      return Result.fail('trigger quantity cannot be negative')
    }

    if (props.orderQuantity <= 0) {
      return Result.fail('order quantity must be positive')
    }

    if (props.currentQuantity < 0) {
      return Result.fail('current quantity cannot be negative')
    }

    return Result.ok(new KanbanSignal(props, id))
  }

  /**
   * Trigger the kanban signal when inventory reaches trigger point
   */
  public trigger(expectedDeliveryDate?: Date): Result<void> {
    if (this.props.status !== 'active') {
      return Result.fail('can only trigger active kanban signals')
    }

    this.props.status = 'triggered'
    this.props.triggeredAt = new Date()
    this.props.expectedDeliveryDate = expectedDeliveryDate
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Mark the kanban signal as fulfilled after inventory is replenished
   */
  public fulfill(): Result<void> {
    if (this.props.status !== 'triggered') {
      return Result.fail('can only fulfill triggered kanban signals')
    }

    this.props.status = 'fulfilled'
    this.props.fulfilledAt = new Date()
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Cancel the kanban signal
   */
  public cancel(reason?: string): Result<void> {
    if (this.props.status === 'fulfilled') {
      return Result.fail('cannot cancel fulfilled kanban signals')
    }

    this.props.status = 'cancelled'
    this.props.notes = reason ? `Cancelled: ${reason}` : 'Cancelled'
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Update current quantity (used during inventory checks)
   */
  public updateCurrentQuantity(quantity: number): Result<void> {
    if (quantity < 0) {
      return Result.fail('quantity cannot be negative')
    }

    this.props.currentQuantity = quantity
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Reset the signal to active after fulfillment
   */
  public reset(): Result<void> {
    if (this.props.status !== 'fulfilled') {
      return Result.fail('can only reset fulfilled kanban signals')
    }

    this.props.status = 'active'
    this.props.triggeredAt = undefined
    this.props.fulfilledAt = undefined
    this.props.expectedDeliveryDate = undefined
    this.touch()

    return Result.ok(undefined as void)
  }

  /**
   * Check if signal should be triggered based on current quantity
   */
  public shouldTrigger(): boolean {
    return (
      this.props.status === 'active' &&
      this.props.currentQuantity <= this.props.triggerQuantity
    )
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
