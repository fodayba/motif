import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'

export type ShipmentStatus = 
  | 'pending'
  | 'picked-up'
  | 'in-transit'
  | 'out-for-delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled'

export type ShipmentEvent = {
  timestamp: Date
  status: ShipmentStatus
  location?: string
  description: string
  recordedBy?: UniqueEntityID
}

export type ShipmentProps = {
  shipmentNumber: string
  status: ShipmentStatus
  packingSlipId: UniqueEntityID
  orderReference: UniqueEntityID
  orderType: 'requisition' | 'transfer' | 'sales-order' | 'work-order'
  carrierName: string
  trackingNumber: string
  shippingMethod: string
  shipFromWarehouseId: UniqueEntityID
  shipFromWarehouseName: string
  shipFromAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  shipToName: string
  shipToAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  shipDate: Date
  estimatedDeliveryDate?: Date
  actualDeliveryDate?: Date
  events: ShipmentEvent[]
  deliveredTo?: string
  deliverySignature?: string
  deliveryPhoto?: string
  notes?: string
  createdBy: UniqueEntityID
  createdAt: Date
  updatedAt: Date
}

export class Shipment extends AggregateRoot<ShipmentProps> {
  private constructor(props: ShipmentProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get shipmentNumber(): string {
    return this.props.shipmentNumber
  }

  get status(): ShipmentStatus {
    return this.props.status
  }

  get packingSlipId(): UniqueEntityID {
    return this.props.packingSlipId
  }

  get orderReference(): UniqueEntityID {
    return this.props.orderReference
  }

  get orderType(): string {
    return this.props.orderType
  }

  get carrierName(): string {
    return this.props.carrierName
  }

  get trackingNumber(): string {
    return this.props.trackingNumber
  }

  get shippingMethod(): string {
    return this.props.shippingMethod
  }

  get shipFromWarehouseId(): UniqueEntityID {
    return this.props.shipFromWarehouseId
  }

  get shipFromWarehouseName(): string {
    return this.props.shipFromWarehouseName
  }

  get shipFromAddress(): ShipmentProps['shipFromAddress'] {
    return this.props.shipFromAddress
  }

  get shipToName(): string {
    return this.props.shipToName
  }

  get shipToAddress(): ShipmentProps['shipToAddress'] {
    return this.props.shipToAddress
  }

  get shipDate(): Date {
    return this.props.shipDate
  }

  get estimatedDeliveryDate(): Date | undefined {
    return this.props.estimatedDeliveryDate
  }

  get actualDeliveryDate(): Date | undefined {
    return this.props.actualDeliveryDate
  }

  get events(): ShipmentEvent[] {
    return this.props.events
  }

  get deliveredTo(): string | undefined {
    return this.props.deliveredTo
  }

  get deliverySignature(): string | undefined {
    return this.props.deliverySignature
  }

  get deliveryPhoto(): string | undefined {
    return this.props.deliveryPhoto
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
    props: ShipmentProps,
    id?: UniqueEntityID,
  ): Result<Shipment> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.shipmentNumber, argumentName: 'shipmentNumber' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.packingSlipId, argumentName: 'packingSlipId' },
      { argument: props.orderReference, argumentName: 'orderReference' },
      { argument: props.orderType, argumentName: 'orderType' },
      { argument: props.carrierName, argumentName: 'carrierName' },
      { argument: props.trackingNumber, argumentName: 'trackingNumber' },
      { argument: props.shippingMethod, argumentName: 'shippingMethod' },
      { argument: props.shipFromWarehouseId, argumentName: 'shipFromWarehouseId' },
      { argument: props.shipFromWarehouseName, argumentName: 'shipFromWarehouseName' },
      { argument: props.shipFromAddress, argumentName: 'shipFromAddress' },
      { argument: props.shipToName, argumentName: 'shipToName' },
      { argument: props.shipToAddress, argumentName: 'shipToAddress' },
      { argument: props.shipDate, argumentName: 'shipDate' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new Shipment(props, id))
  }

  public addEvent(
    status: ShipmentStatus,
    description: string,
    location?: string,
    recordedBy?: UniqueEntityID,
  ): Result<void> {
    const event: ShipmentEvent = {
      timestamp: new Date(),
      status,
      description,
      location,
      recordedBy,
    }

    this.props.events.push(event)
    this.props.status = status
    this.props.updatedAt = new Date()

    return Result.ok(undefined as void)
  }

  public markPickedUp(location?: string, recordedBy?: UniqueEntityID): Result<void> {
    if (this.props.status !== 'pending') {
      return Result.fail('Shipment must be pending to mark as picked up')
    }

    return this.addEvent('picked-up', 'Package picked up by carrier', location, recordedBy)
  }

  public markInTransit(location?: string, recordedBy?: UniqueEntityID): Result<void> {
    if (!['pending', 'picked-up'].includes(this.props.status)) {
      return Result.fail('Invalid status transition to in-transit')
    }

    return this.addEvent('in-transit', 'Package in transit', location, recordedBy)
  }

  public markOutForDelivery(location?: string, recordedBy?: UniqueEntityID): Result<void> {
    if (this.props.status !== 'in-transit') {
      return Result.fail('Shipment must be in transit to mark out for delivery')
    }

    return this.addEvent('out-for-delivery', 'Out for delivery', location, recordedBy)
  }

  public markDelivered(
    deliveredTo: string,
    signature?: string,
    photo?: string,
    recordedBy?: UniqueEntityID,
  ): Result<void> {
    if (this.props.status !== 'out-for-delivery') {
      return Result.fail('Shipment must be out for delivery to mark as delivered')
    }

    this.props.deliveredTo = deliveredTo
    this.props.deliverySignature = signature
    this.props.deliveryPhoto = photo
    this.props.actualDeliveryDate = new Date()

    return this.addEvent('delivered', `Delivered to ${deliveredTo}`, undefined, recordedBy)
  }

  public markReturned(reason: string, recordedBy?: UniqueEntityID): Result<void> {
    if (this.props.status === 'delivered' || this.props.status === 'cancelled') {
      return Result.fail('Cannot return delivered or cancelled shipments')
    }

    this.props.notes = `Returned: ${reason}`
    return this.addEvent('returned', `Shipment returned - ${reason}`, undefined, recordedBy)
  }

  public cancel(reason: string, recordedBy?: UniqueEntityID): Result<void> {
    if (this.props.status === 'delivered') {
      return Result.fail('Cannot cancel delivered shipments')
    }

    this.props.notes = `Cancelled: ${reason}`
    return this.addEvent('cancelled', `Shipment cancelled - ${reason}`, undefined, recordedBy)
  }

  public isDelivered(): boolean {
    return this.props.status === 'delivered'
  }

  public isDelayed(): boolean {
    if (!this.props.estimatedDeliveryDate || this.props.status === 'delivered') {
      return false
    }

    return new Date() > this.props.estimatedDeliveryDate
  }

  public getDaysInTransit(): number {
    const endDate = this.props.actualDeliveryDate ?? new Date()
    const startDate = this.props.shipDate
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  public getLatestEvent(): ShipmentEvent | undefined {
    if (this.props.events.length === 0) {
      return undefined
    }

    return this.props.events[this.props.events.length - 1]
  }
}
