import {
  AggregateRoot,
  Guard,
  Money,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { TransferStatus } from '../enums/transfer-status'
import { TRANSFER_STATUSES } from '../enums/transfer-status'

export type TransferItemProps = {
  itemId: UniqueEntityID
  itemName: string
  sku: string
  quantity: number
  unit: string
  batchNumber?: string
  lotNumber?: string
  unitCost: Money
}

export type TransferRouteStopProps = {
  locationId: UniqueEntityID
  locationName: string
  sequence: number
  estimatedArrival?: Date
  actualArrival?: Date
  notes?: string
}

export type InventoryTransferProps = {
  transferNumber: string
  status: TransferStatus
  fromLocationId: UniqueEntityID
  toLocationId: UniqueEntityID
  items: TransferItemProps[]
  routeStops: TransferRouteStopProps[]
  requestedById: UniqueEntityID
  approvedById?: UniqueEntityID
  approvedAt?: Date
  shippedById?: UniqueEntityID
  shippedAt?: Date
  receivedById?: UniqueEntityID
  receivedAt?: Date
  estimatedArrival?: Date
  carrier?: string
  trackingNumber?: string
  transportCost?: Money
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class InventoryTransfer extends AggregateRoot<InventoryTransferProps> {
  private constructor(props: InventoryTransferProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get transferNumber(): string {
    return this.props.transferNumber
  }

  get status(): TransferStatus {
    return this.props.status
  }

  get fromLocationId(): UniqueEntityID {
    return this.props.fromLocationId
  }

  get toLocationId(): UniqueEntityID {
    return this.props.toLocationId
  }

  get items(): TransferItemProps[] {
    return this.props.items
  }

  get routeStops(): TransferRouteStopProps[] {
    return this.props.routeStops
  }

  get requestedById(): UniqueEntityID {
    return this.props.requestedById
  }

  get approvedById(): UniqueEntityID | undefined {
    return this.props.approvedById
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt
  }

  get shippedById(): UniqueEntityID | undefined {
    return this.props.shippedById
  }

  get shippedAt(): Date | undefined {
    return this.props.shippedAt
  }

  get receivedById(): UniqueEntityID | undefined {
    return this.props.receivedById
  }

  get receivedAt(): Date | undefined {
    return this.props.receivedAt
  }

  get estimatedArrival(): Date | undefined {
    return this.props.estimatedArrival
  }

  get carrier(): string | undefined {
    return this.props.carrier
  }

  get trackingNumber(): string | undefined {
    return this.props.trackingNumber
  }

  get transportCost(): Money | undefined {
    return this.props.transportCost
  }

  get priority(): 'low' | 'normal' | 'high' | 'urgent' {
    return this.props.priority
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
    props: InventoryTransferProps,
    id?: UniqueEntityID,
  ): Result<InventoryTransfer> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.transferNumber, argumentName: 'transferNumber' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.fromLocationId, argumentName: 'fromLocationId' },
      { argument: props.toLocationId, argumentName: 'toLocationId' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.requestedById, argumentName: 'requestedById' },
      { argument: props.priority, argumentName: 'priority' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!TRANSFER_STATUSES.includes(props.status)) {
      return Result.fail('Invalid transfer status')
    }

    if (props.items.length === 0) {
      return Result.fail('Transfer must have at least one item')
    }

    if (props.fromLocationId.equals(props.toLocationId)) {
      return Result.fail('From and to locations cannot be the same')
    }

    return Result.ok(new InventoryTransfer(props, id))
  }

  public approve(approvedById: UniqueEntityID): Result<void> {
    if (this.props.status !== 'pending-approval') {
      return Result.fail<void>('Transfer must be in pending-approval status')
    }

    this.props.status = 'approved'
    this.props.approvedById = approvedById
    this.props.approvedAt = new Date()
    this.touch()
    return Result.ok<void>(undefined)
  }

  public reject(): Result<void> {
    if (this.props.status !== 'pending-approval') {
      return Result.fail<void>('Transfer must be in pending-approval status')
    }

    this.props.status = 'rejected'
    this.touch()
    return Result.ok<void>(undefined)
  }

  public ship(shippedById: UniqueEntityID, carrier?: string, trackingNumber?: string): Result<void> {
    if (this.props.status !== 'approved') {
      return Result.fail<void>('Transfer must be approved before shipping')
    }

    this.props.status = 'in-transit'
    this.props.shippedById = shippedById
    this.props.shippedAt = new Date()
    this.props.carrier = carrier
    this.props.trackingNumber = trackingNumber
    this.touch()
    return Result.ok<void>(undefined)
  }

  public receive(receivedById: UniqueEntityID): Result<void> {
    if (this.props.status !== 'in-transit') {
      return Result.fail<void>('Transfer must be in-transit to be received')
    }

    this.props.status = 'received'
    this.props.receivedById = receivedById
    this.props.receivedAt = new Date()
    this.touch()
    return Result.ok<void>(undefined)
  }

  public cancel(): Result<void> {
    if (['received', 'cancelled'].includes(this.props.status)) {
      return Result.fail<void>('Cannot cancel a received or already cancelled transfer')
    }

    this.props.status = 'cancelled'
    this.touch()
    return Result.ok<void>(undefined)
  }

  public addRouteStop(stop: TransferRouteStopProps): Result<void> {
    if (this.props.status !== 'draft') {
      return Result.fail<void>('Can only add route stops to draft transfers')
    }

    this.props.routeStops.push(stop)
    this.touch()
    return Result.ok<void>(undefined)
  }

  public updateRouteStop(sequence: number, actualArrival: Date): Result<void> {
    const stop = this.props.routeStops.find(s => s.sequence === sequence)
    if (!stop) {
      return Result.fail<void>('Route stop not found')
    }

    stop.actualArrival = actualArrival
    this.touch()
    return Result.ok<void>(undefined)
  }

  public getTotalValue(): number {
    return this.props.items.reduce((total, item) => {
      return total + (item.unitCost.amount * item.quantity)
    }, 0)
  }

  public isOverdue(): boolean {
    if (!this.props.estimatedArrival || this.props.status === 'received') {
      return false
    }
    return new Date() > this.props.estimatedArrival
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
