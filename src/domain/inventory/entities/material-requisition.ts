import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { RequisitionStatus } from '../enums/requisition-status'
import { REQUISITION_STATUSES } from '../enums/requisition-status'

export type RequisitionItemProps = {
  itemId: UniqueEntityID
  itemName: string
  sku: string
  requestedQuantity: number
  fulfilledQuantity: number
  unit: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
}

export type MaterialRequisitionProps = {
  requisitionNumber: string
  status: RequisitionStatus
  projectId?: UniqueEntityID
  locationId: UniqueEntityID
  requestedById: UniqueEntityID
  approvedById?: UniqueEntityID
  approvedAt?: Date
  rejectedById?: UniqueEntityID
  rejectedAt?: Date
  rejectionReason?: string
  requiredByDate: Date
  items: RequisitionItemProps[]
  purpose?: string
  costCenter?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class MaterialRequisition extends AggregateRoot<MaterialRequisitionProps> {
  private constructor(props: MaterialRequisitionProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get requisitionNumber(): string {
    return this.props.requisitionNumber
  }

  get status(): RequisitionStatus {
    return this.props.status
  }

  get projectId(): UniqueEntityID | undefined {
    return this.props.projectId
  }

  get locationId(): UniqueEntityID {
    return this.props.locationId
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

  get rejectedById(): UniqueEntityID | undefined {
    return this.props.rejectedById
  }

  get rejectedAt(): Date | undefined {
    return this.props.rejectedAt
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason
  }

  get requiredByDate(): Date {
    return this.props.requiredByDate
  }

  get items(): RequisitionItemProps[] {
    return this.props.items
  }

  get purpose(): string | undefined {
    return this.props.purpose
  }

  get costCenter(): string | undefined {
    return this.props.costCenter
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
    props: MaterialRequisitionProps,
    id?: UniqueEntityID,
  ): Result<MaterialRequisition> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.requisitionNumber, argumentName: 'requisitionNumber' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.locationId, argumentName: 'locationId' },
      { argument: props.requestedById, argumentName: 'requestedById' },
      { argument: props.requiredByDate, argumentName: 'requiredByDate' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!REQUISITION_STATUSES.includes(props.status)) {
      return Result.fail('Invalid requisition status')
    }

    if (props.items.length === 0) {
      return Result.fail('Requisition must have at least one item')
    }

    return Result.ok(new MaterialRequisition(props, id))
  }

  public submit(): Result<void> {
    if (this.props.status !== 'draft') {
      return Result.fail<void>('Can only submit draft requisitions')
    }

    this.props.status = 'submitted'
    this.touch()
    return Result.ok<void>(undefined)
  }

  public approve(approvedById: UniqueEntityID): Result<void> {
    if (this.props.status !== 'submitted') {
      return Result.fail<void>('Can only approve submitted requisitions')
    }

    this.props.status = 'approved'
    this.props.approvedById = approvedById
    this.props.approvedAt = new Date()
    this.touch()
    return Result.ok<void>(undefined)
  }

  public reject(rejectedById: UniqueEntityID, reason: string): Result<void> {
    if (this.props.status !== 'submitted') {
      return Result.fail<void>('Can only reject submitted requisitions')
    }

    this.props.status = 'rejected'
    this.props.rejectedById = rejectedById
    this.props.rejectedAt = new Date()
    this.props.rejectionReason = reason
    this.touch()
    return Result.ok<void>(undefined)
  }

  public fulfillItem(itemId: UniqueEntityID, quantity: number): Result<void> {
    if (!['approved', 'partially-fulfilled'].includes(this.props.status)) {
      return Result.fail<void>('Requisition must be approved or partially fulfilled')
    }

    const item = this.props.items.find(i => i.itemId.equals(itemId))
    if (!item) {
      return Result.fail<void>('Item not found in requisition')
    }

    const newFulfilled = item.fulfilledQuantity + quantity
    if (newFulfilled > item.requestedQuantity) {
      return Result.fail<void>('Cannot fulfill more than requested quantity')
    }

    item.fulfilledQuantity = newFulfilled

    // Update overall status
    const allFulfilled = this.props.items.every(i => i.fulfilledQuantity >= i.requestedQuantity)
    const anyFulfilled = this.props.items.some(i => i.fulfilledQuantity > 0)

    if (allFulfilled) {
      this.props.status = 'fulfilled'
    } else if (anyFulfilled) {
      this.props.status = 'partially-fulfilled'
    }

    this.touch()
    return Result.ok<void>(undefined)
  }

  public cancel(): Result<void> {
    if (['fulfilled', 'cancelled', 'rejected'].includes(this.props.status)) {
      return Result.fail<void>('Cannot cancel fulfilled, cancelled, or rejected requisitions')
    }

    this.props.status = 'cancelled'
    this.touch()
    return Result.ok<void>(undefined)
  }

  public isOverdue(): boolean {
    if (this.props.status === 'fulfilled' || this.props.status === 'cancelled') {
      return false
    }
    return new Date() > this.props.requiredByDate
  }

  public getFulfillmentPercentage(): number {
    const totalRequested = this.props.items.reduce((sum, item) => sum + item.requestedQuantity, 0)
    const totalFulfilled = this.props.items.reduce((sum, item) => sum + item.fulfilledQuantity, 0)
    return totalRequested > 0 ? (totalFulfilled / totalRequested) * 100 : 0
  }

  public getUnfulfilledItems(): RequisitionItemProps[] {
    return this.props.items.filter(i => i.fulfilledQuantity < i.requestedQuantity)
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
