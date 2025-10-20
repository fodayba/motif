import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'

export type ThreeWayMatchStatus =
  | 'pending'
  | 'matched'
  | 'discrepancy'
  | 'approved'
  | 'rejected'

export const THREE_WAY_MATCH_STATUSES: ThreeWayMatchStatus[] = [
  'pending',
  'matched',
  'discrepancy',
  'approved',
  'rejected',
]

export type DiscrepancyType =
  | 'quantity'
  | 'price'
  | 'total'
  | 'item-missing'
  | 'extra-item'

export type LineItemMatch = {
  purchaseOrderLineId: UniqueEntityID
  itemDescription: string
  poQuantity: number
  grQuantity: number
  invoiceQuantity: number
  poUnitPrice: Money
  invoiceUnitPrice: Money
  poLineTotal: Money
  invoiceLineTotal: Money
  quantityVariance: number
  priceVariance: Money
  totalVariance: Money
  discrepancies: DiscrepancyType[]
  matched: boolean
}

type ThreeWayMatchProps = {
  matchNumber: string
  purchaseOrderId: UniqueEntityID
  purchaseOrderNumber: string
  goodsReceiptId: UniqueEntityID
  goodsReceiptNumber: string
  invoiceId: UniqueEntityID
  invoiceNumber: string
  vendorId: UniqueEntityID
  vendorName: string
  projectId: UniqueEntityID
  status: ThreeWayMatchStatus
  lineItems: LineItemMatch[]
  poTotal: Money
  grTotal: Money
  invoiceTotal: Money
  totalVariance: Money
  tolerancePercentage: number
  withinTolerance: boolean
  hasDiscrepancies: boolean
  matchedDate?: Date
  reviewedBy?: UniqueEntityID
  reviewedByName?: string
  reviewedDate?: Date
  reviewNotes?: string
  approvedBy?: UniqueEntityID
  approvedByName?: string
  approvedDate?: Date
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

export class ThreeWayMatch extends AggregateRoot<ThreeWayMatchProps> {
  private constructor(props: ThreeWayMatchProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get matchNumber(): string {
    return this.props.matchNumber
  }

  get purchaseOrderId(): UniqueEntityID {
    return this.props.purchaseOrderId
  }

  get purchaseOrderNumber(): string {
    return this.props.purchaseOrderNumber
  }

  get goodsReceiptId(): UniqueEntityID {
    return this.props.goodsReceiptId
  }

  get goodsReceiptNumber(): string {
    return this.props.goodsReceiptNumber
  }

  get invoiceId(): UniqueEntityID {
    return this.props.invoiceId
  }

  get invoiceNumber(): string {
    return this.props.invoiceNumber
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

  get status(): ThreeWayMatchStatus {
    return this.props.status
  }

  get lineItems(): LineItemMatch[] {
    return [...this.props.lineItems]
  }

  get poTotal(): Money {
    return this.props.poTotal
  }

  get grTotal(): Money {
    return this.props.grTotal
  }

  get invoiceTotal(): Money {
    return this.props.invoiceTotal
  }

  get totalVariance(): Money {
    return this.props.totalVariance
  }

  get tolerancePercentage(): number {
    return this.props.tolerancePercentage
  }

  get withinTolerance(): boolean {
    return this.props.withinTolerance
  }

  get hasDiscrepancies(): boolean {
    return this.props.hasDiscrepancies
  }

  get matchedDate(): Date | undefined {
    return this.props.matchedDate
  }

  get reviewedBy(): UniqueEntityID | undefined {
    return this.props.reviewedBy
  }

  get reviewedByName(): string | undefined {
    return this.props.reviewedByName
  }

  get reviewedDate(): Date | undefined {
    return this.props.reviewedDate
  }

  get reviewNotes(): string | undefined {
    return this.props.reviewNotes
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy
  }

  get approvedByName(): string | undefined {
    return this.props.approvedByName
  }

  get approvedDate(): Date | undefined {
    return this.props.approvedDate
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(
    props: ThreeWayMatchProps,
    id?: UniqueEntityID,
  ): Result<ThreeWayMatch> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.matchNumber, argumentName: 'matchNumber' },
      { argument: props.purchaseOrderId, argumentName: 'purchaseOrderId' },
      { argument: props.purchaseOrderNumber, argumentName: 'purchaseOrderNumber' },
      { argument: props.goodsReceiptId, argumentName: 'goodsReceiptId' },
      { argument: props.goodsReceiptNumber, argumentName: 'goodsReceiptNumber' },
      { argument: props.invoiceId, argumentName: 'invoiceId' },
      { argument: props.invoiceNumber, argumentName: 'invoiceNumber' },
      { argument: props.vendorId, argumentName: 'vendorId' },
      { argument: props.vendorName, argumentName: 'vendorName' },
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.lineItems, argumentName: 'lineItems' },
      { argument: props.poTotal, argumentName: 'poTotal' },
      { argument: props.invoiceTotal, argumentName: 'invoiceTotal' },
      { argument: props.totalVariance, argumentName: 'totalVariance' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!THREE_WAY_MATCH_STATUSES.includes(props.status)) {
      return Result.fail('invalid three-way match status')
    }

    if (props.lineItems.length === 0) {
      return Result.fail('three-way match must contain at least one line item')
    }

    if (props.tolerancePercentage < 0 || props.tolerancePercentage > 100) {
      return Result.fail('tolerance percentage must be between 0 and 100')
    }

    return Result.ok(new ThreeWayMatch(props, id))
  }

  public performMatch() {
    if (this.props.status !== 'pending') {
      throw new Error('only pending matches can be performed')
    }

    const hasDiscrepancies = this.props.lineItems.some((item) => !item.matched)

    this.props.hasDiscrepancies = hasDiscrepancies
    this.props.status = hasDiscrepancies ? 'discrepancy' : 'matched'
    this.props.matchedDate = new Date()
    this.touch()
  }

  public review(
    reviewedBy: UniqueEntityID,
    reviewedByName: string,
    notes?: string,
  ) {
    if (this.props.status !== 'discrepancy') {
      throw new Error('only matches with discrepancies can be reviewed')
    }

    this.props.reviewedBy = reviewedBy
    this.props.reviewedByName = reviewedByName
    this.props.reviewedDate = new Date()
    this.props.reviewNotes = notes
    this.touch()
  }

  public approve(approvedBy: UniqueEntityID, approvedByName: string) {
    if (
      this.props.status !== 'matched' &&
      this.props.status !== 'discrepancy'
    ) {
      throw new Error('only matched or reviewed matches can be approved')
    }

    this.props.status = 'approved'
    this.props.approvedBy = approvedBy
    this.props.approvedByName = approvedByName
    this.props.approvedDate = new Date()
    this.touch()
  }

  public reject(reason: string) {
    if (this.props.status === 'approved' || this.props.status === 'rejected') {
      throw new Error('cannot reject approved or already rejected matches')
    }

    this.props.status = 'rejected'
    this.props.rejectionReason = reason
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
