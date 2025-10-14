import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { PurchaseOrderStatus } from '../enums/purchase-order-status'
import { PURCHASE_ORDER_STATUSES } from '../enums/purchase-order-status'
import type { PurchaseOrderNumber } from '../value-objects/purchase-order-number'
import type { PurchaseOrderItem } from '../value-objects/purchase-order-item'

export type PurchaseOrderProps = {
  number: PurchaseOrderNumber
  vendorId: UniqueEntityID
  projectId: UniqueEntityID
  status: PurchaseOrderStatus
  orderDate: Date
  expectedDate?: Date
  currency: string
  items: PurchaseOrderItem[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class PurchaseOrder extends AggregateRoot<PurchaseOrderProps> {
  private constructor(props: PurchaseOrderProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get number(): PurchaseOrderNumber {
    return this.props.number
  }

  get vendorId(): UniqueEntityID {
    return this.props.vendorId
  }

  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get status(): PurchaseOrderStatus {
    return this.props.status
  }

  get orderDate(): Date {
    return this.props.orderDate
  }

  get expectedDate(): Date | undefined {
    return this.props.expectedDate
  }

  get currency(): string {
    return this.props.currency
  }

  get items(): PurchaseOrderItem[] {
    return [...this.props.items]
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

  get total(): number {
    return this.props.items.reduce((sum, item) => sum + item.lineTotal, 0)
  }

  public static create(props: PurchaseOrderProps, id?: UniqueEntityID): Result<PurchaseOrder> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.number, argumentName: 'number' },
      { argument: props.vendorId, argumentName: 'vendorId' },
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.orderDate, argumentName: 'orderDate' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!PURCHASE_ORDER_STATUSES.includes(props.status)) {
      return Result.fail('purchase order status is invalid')
    }

    if (props.items.length === 0) {
      return Result.fail('purchase order must contain at least one item')
    }

    return Result.ok(
      new PurchaseOrder(
        {
          ...props,
          currency: props.currency.toUpperCase(),
          notes: props.notes?.trim(),
          items: props.items,
        },
        id,
      ),
    )
  }

  public addItem(item: PurchaseOrderItem) {
    this.props.items = [...this.props.items, item]
    this.touch()
  }

  public removeItem(lineId: UniqueEntityID) {
    this.props.items = this.props.items.filter((item) => !item.lineId.equals(lineId))
    this.touch()
  }

  public updateStatus(status: PurchaseOrderStatus) {
    if (!PURCHASE_ORDER_STATUSES.includes(status)) {
      throw new Error('purchase order status is invalid')
    }

    this.props.status = status
    this.touch()
  }

  public setExpectedDate(date: Date | undefined) {
    this.props.expectedDate = date
    this.touch()
  }

  public addNote(note: string) {
    const existing = this.props.notes ?? ''
    this.props.notes = [existing, note.trim()].filter(Boolean).join('\n')
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
