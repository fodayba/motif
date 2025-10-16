import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'

export type PickListStatus = 'pending' | 'in-progress' | 'picked' | 'cancelled'

export type PickListPriority = 'low' | 'normal' | 'high' | 'urgent'

export type PickListItem = {
  itemId: UniqueEntityID
  itemName: string
  sku: string
  binLocation: string
  quantityRequired: number
  quantityPicked: number
  unit: string
  notes?: string
  pickedAt?: Date
  pickedBy?: UniqueEntityID
}

export type PickListProps = {
  pickListNumber: string
  status: PickListStatus
  priority: PickListPriority
  orderType: 'requisition' | 'transfer' | 'sales-order' | 'work-order'
  orderReference: UniqueEntityID
  warehouseId: UniqueEntityID
  warehouseName: string
  items: PickListItem[]
  assignedTo?: UniqueEntityID
  assignedToName?: string
  startedAt?: Date
  completedAt?: Date
  notes?: string
  createdBy: UniqueEntityID
  createdAt: Date
  updatedAt: Date
}

export class PickList extends AggregateRoot<PickListProps> {
  private constructor(props: PickListProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get pickListNumber(): string {
    return this.props.pickListNumber
  }

  get status(): PickListStatus {
    return this.props.status
  }

  get priority(): PickListPriority {
    return this.props.priority
  }

  get orderType(): string {
    return this.props.orderType
  }

  get orderReference(): UniqueEntityID {
    return this.props.orderReference
  }

  get warehouseId(): UniqueEntityID {
    return this.props.warehouseId
  }

  get warehouseName(): string {
    return this.props.warehouseName
  }

  get items(): PickListItem[] {
    return this.props.items
  }

  get assignedTo(): UniqueEntityID | undefined {
    return this.props.assignedTo
  }

  get assignedToName(): string | undefined {
    return this.props.assignedToName
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt
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
    props: PickListProps,
    id?: UniqueEntityID,
  ): Result<PickList> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.pickListNumber, argumentName: 'pickListNumber' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.priority, argumentName: 'priority' },
      { argument: props.orderType, argumentName: 'orderType' },
      { argument: props.orderReference, argumentName: 'orderReference' },
      { argument: props.warehouseId, argumentName: 'warehouseId' },
      { argument: props.warehouseName, argumentName: 'warehouseName' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.items.length === 0) {
      return Result.fail('Pick list must have at least one item')
    }

    return Result.ok(new PickList(props, id))
  }

  public assign(userId: UniqueEntityID, userName: string): Result<void> {
    if (this.props.status !== 'pending') {
      return Result.fail('Can only assign pending pick lists')
    }

    this.props.assignedTo = userId
    this.props.assignedToName = userName
    this.props.updatedAt = new Date()

    return Result.ok(undefined as void)
  }

  public start(): Result<void> {
    if (this.props.status !== 'pending') {
      return Result.fail('Can only start pending pick lists')
    }

    if (!this.props.assignedTo) {
      return Result.fail('Pick list must be assigned before starting')
    }

    this.props.status = 'in-progress'
    this.props.startedAt = new Date()
    this.props.updatedAt = new Date()

    return Result.ok(undefined as void)
  }

  public pickItem(
    itemId: UniqueEntityID,
    quantityPicked: number,
    pickedBy: UniqueEntityID,
  ): Result<void> {
    if (this.props.status !== 'in-progress') {
      return Result.fail('Pick list must be in progress to pick items')
    }

    const item = this.props.items.find(i => i.itemId.equals(itemId))
    if (!item) {
      return Result.fail('Item not found in pick list')
    }

    if (quantityPicked <= 0) {
      return Result.fail('Quantity picked must be greater than zero')
    }

    if (quantityPicked > item.quantityRequired) {
      return Result.fail('Cannot pick more than required quantity')
    }

    item.quantityPicked = quantityPicked
    item.pickedAt = new Date()
    item.pickedBy = pickedBy
    this.props.updatedAt = new Date()

    // Check if all items are picked
    const allItemsPicked = this.props.items.every(
      i => i.quantityPicked >= i.quantityRequired
    )

    if (allItemsPicked) {
      this.props.status = 'picked'
      this.props.completedAt = new Date()
    }

    return Result.ok(undefined as void)
  }

  public cancel(reason?: string): Result<void> {
    if (this.props.status === 'picked' || this.props.status === 'cancelled') {
      return Result.fail('Cannot cancel picked or already cancelled pick lists')
    }

    this.props.status = 'cancelled'
    this.props.notes = reason ? `Cancelled: ${reason}` : 'Cancelled'
    this.props.updatedAt = new Date()

    return Result.ok(undefined as void)
  }

  public isComplete(): boolean {
    return this.props.status === 'picked'
  }

  public getCompletionPercentage(): number {
    const totalRequired = this.props.items.reduce((sum, item) => sum + item.quantityRequired, 0)
    const totalPicked = this.props.items.reduce((sum, item) => sum + item.quantityPicked, 0)

    return totalRequired > 0 ? (totalPicked / totalRequired) * 100 : 0
  }

  public getUnpickedItems(): PickListItem[] {
    return this.props.items.filter(item => item.quantityPicked < item.quantityRequired)
  }
}
