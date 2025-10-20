import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'

export type GoodsReceiptStatus =
  | 'pending'
  | 'partially-received'
  | 'received'
  | 'discrepancy'

export const GOODS_RECEIPT_STATUSES: GoodsReceiptStatus[] = [
  'pending',
  'partially-received',
  'received',
  'discrepancy',
]

export type GoodsReceiptItem = {
  purchaseOrderLineId: UniqueEntityID
  itemDescription: string
  orderedQuantity: number
  receivedQuantity: number
  acceptedQuantity: number
  rejectedQuantity: number
  unitOfMeasure: string
  rejectionReason?: string
  notes?: string
}

type GoodsReceiptProps = {
  receiptNumber: string
  purchaseOrderId: UniqueEntityID
  purchaseOrderNumber: string
  vendorId: UniqueEntityID
  vendorName: string
  projectId: UniqueEntityID
  locationId: UniqueEntityID
  status: GoodsReceiptStatus
  items: GoodsReceiptItem[]
  receivedDate: Date
  receivedBy: UniqueEntityID
  receivedByName: string
  inspectedBy?: UniqueEntityID
  inspectedByName?: string
  inspectionDate?: Date
  packingSlipNumber?: string
  carrierName?: string
  trackingNumber?: string
  notes?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

export class GoodsReceipt extends AggregateRoot<GoodsReceiptProps> {
  private constructor(props: GoodsReceiptProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get receiptNumber(): string {
    return this.props.receiptNumber
  }

  get purchaseOrderId(): UniqueEntityID {
    return this.props.purchaseOrderId
  }

  get purchaseOrderNumber(): string {
    return this.props.purchaseOrderNumber
  }

  get vendorId(): UniqueEntityID {
    return this.props.vendorId
  }

  get vendorName(): string {
    return this.props.vendorName
  }

  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get locationId(): UniqueEntityID {
    return this.props.locationId
  }

  get status(): GoodsReceiptStatus {
    return this.props.status
  }

  get items(): GoodsReceiptItem[] {
    return [...this.props.items]
  }

  get receivedDate(): Date {
    return this.props.receivedDate
  }

  get receivedBy(): UniqueEntityID {
    return this.props.receivedBy
  }

  get receivedByName(): string {
    return this.props.receivedByName
  }

  get inspectedBy(): UniqueEntityID | undefined {
    return this.props.inspectedBy
  }

  get inspectedByName(): string | undefined {
    return this.props.inspectedByName
  }

  get inspectionDate(): Date | undefined {
    return this.props.inspectionDate
  }

  get packingSlipNumber(): string | undefined {
    return this.props.packingSlipNumber
  }

  get carrierName(): string | undefined {
    return this.props.carrierName
  }

  get trackingNumber(): string | undefined {
    return this.props.trackingNumber
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get attachments(): string[] {
    return this.props.attachments ? [...this.props.attachments] : []
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get totalReceivedQuantity(): number {
    return this.props.items.reduce((sum, item) => sum + item.receivedQuantity, 0)
  }

  get totalAcceptedQuantity(): number {
    return this.props.items.reduce((sum, item) => sum + item.acceptedQuantity, 0)
  }

  get totalRejectedQuantity(): number {
    return this.props.items.reduce((sum, item) => sum + item.rejectedQuantity, 0)
  }

  public static create(props: GoodsReceiptProps, id?: UniqueEntityID): Result<GoodsReceipt> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.receiptNumber, argumentName: 'receiptNumber' },
      { argument: props.purchaseOrderId, argumentName: 'purchaseOrderId' },
      { argument: props.purchaseOrderNumber, argumentName: 'purchaseOrderNumber' },
      { argument: props.vendorId, argumentName: 'vendorId' },
      { argument: props.vendorName, argumentName: 'vendorName' },
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.locationId, argumentName: 'locationId' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.receivedDate, argumentName: 'receivedDate' },
      { argument: props.receivedBy, argumentName: 'receivedBy' },
      { argument: props.receivedByName, argumentName: 'receivedByName' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!GOODS_RECEIPT_STATUSES.includes(props.status)) {
      return Result.fail('invalid goods receipt status')
    }

    if (props.items.length === 0) {
      return Result.fail('goods receipt must contain at least one item')
    }

    // Validate item quantities
    for (const item of props.items) {
      if (item.receivedQuantity < 0) {
        return Result.fail('received quantity cannot be negative')
      }
      if (item.acceptedQuantity < 0) {
        return Result.fail('accepted quantity cannot be negative')
      }
      if (item.rejectedQuantity < 0) {
        return Result.fail('rejected quantity cannot be negative')
      }
      if (item.acceptedQuantity + item.rejectedQuantity > item.receivedQuantity) {
        return Result.fail(
          'accepted + rejected quantities cannot exceed received quantity',
        )
      }
    }

    return Result.ok(new GoodsReceipt(props, id))
  }

  public inspectItem(
    lineId: UniqueEntityID,
    acceptedQty: number,
    rejectedQty: number,
    rejectionReason?: string,
  ) {
    const itemIndex = this.props.items.findIndex((item) =>
      item.purchaseOrderLineId.equals(lineId),
    )

    if (itemIndex === -1) {
      throw new Error('item not found in goods receipt')
    }

    const item = this.props.items[itemIndex]

    if (acceptedQty + rejectedQty > item.receivedQuantity) {
      throw new Error('accepted + rejected cannot exceed received quantity')
    }

    item.acceptedQuantity = acceptedQty
    item.rejectedQuantity = rejectedQty
    if (rejectedQty > 0 && rejectionReason) {
      item.rejectionReason = rejectionReason
    }

    this.updateStatus()
    this.touch()
  }

  public completeInspection(inspectedBy: UniqueEntityID, inspectedByName: string) {
    this.props.inspectedBy = inspectedBy
    this.props.inspectedByName = inspectedByName
    this.props.inspectionDate = new Date()
    this.updateStatus()
    this.touch()
  }

  public addNote(note: string) {
    const existing = this.props.notes ?? ''
    this.props.notes = [existing, note.trim()].filter(Boolean).join('\n')
    this.touch()
  }

  public addAttachment(attachmentUrl: string) {
    this.props.attachments = [...(this.props.attachments ?? []), attachmentUrl]
    this.touch()
  }

  private updateStatus() {
    const totalOrdered = this.props.items.reduce(
      (sum, item) => sum + item.orderedQuantity,
      0,
    )
    const totalReceived = this.totalReceivedQuantity
    const totalRejected = this.totalRejectedQuantity

    if (totalRejected > 0) {
      this.props.status = 'discrepancy'
    } else if (totalReceived >= totalOrdered) {
      this.props.status = 'received'
    } else if (totalReceived > 0) {
      this.props.status = 'partially-received'
    } else {
      this.props.status = 'pending'
    }
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
