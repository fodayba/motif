import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'

export type RFQStatus = 'draft' | 'published' | 'closed' | 'awarded' | 'cancelled'

export const RFQ_STATUSES: RFQStatus[] = [
  'draft',
  'published',
  'closed',
  'awarded',
  'cancelled',
]

export type RFQType = 'goods' | 'services' | 'construction'

export type RFQItem = {
  id: string
  description: string
  quantity: number
  unitOfMeasure: string
  specifications?: string
}

export type VendorBid = {
  vendorId: UniqueEntityID
  vendorName: string
  submittedAt: Date
  totalAmount: Money
  deliveryDays: number
  items: BidItem[]
  notes?: string
  attachments?: string[]
}

export type BidItem = {
  rfqItemId: string
  unitPrice: Money
  leadTimeDays: number
  notes?: string
}

type RFQProps = {
  rfqNumber: string
  title: string
  description: string
  type: RFQType
  projectId: UniqueEntityID
  status: RFQStatus
  items: RFQItem[]
  publishedAt?: Date
  closeDate?: Date
  bids: VendorBid[]
  selectedBidVendorId?: UniqueEntityID
  awardedAt?: Date
  createdBy: UniqueEntityID
  createdAt: Date
  updatedAt: Date
}

export class RFQ extends AggregateRoot<RFQProps> {
  private constructor(props: RFQProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get rfqNumber(): string {
    return this.props.rfqNumber
  }

  get title(): string {
    return this.props.title
  }

  get description(): string {
    return this.props.description
  }

  get type(): RFQType {
    return this.props.type
  }

  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get status(): RFQStatus {
    return this.props.status
  }

  get items(): RFQItem[] {
    return [...this.props.items]
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt
  }

  get closeDate(): Date | undefined {
    return this.props.closeDate
  }

  get bids(): VendorBid[] {
    return [...this.props.bids]
  }

  get selectedBidVendorId(): UniqueEntityID | undefined {
    return this.props.selectedBidVendorId
  }

  get awardedAt(): Date | undefined {
    return this.props.awardedAt
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

  public static create(props: RFQProps, id?: UniqueEntityID): Result<RFQ> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.rfqNumber, argumentName: 'rfqNumber' },
      { argument: props.title, argumentName: 'title' },
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!RFQ_STATUSES.includes(props.status)) {
      return Result.fail('invalid RFQ status')
    }

    if (props.items.length === 0) {
      return Result.fail('RFQ must contain at least one item')
    }

    return Result.ok(new RFQ(props, id))
  }

  public publish(closeDate: Date) {
    if (this.props.status !== 'draft') {
      throw new Error('only draft RFQs can be published')
    }

    if (closeDate <= new Date()) {
      throw new Error('close date must be in the future')
    }

    this.props.status = 'published'
    this.props.publishedAt = new Date()
    this.props.closeDate = closeDate
    this.touch()
  }

  public addBid(bid: VendorBid) {
    if (this.props.status !== 'published') {
      throw new Error('can only add bids to published RFQs')
    }

    if (this.props.closeDate && new Date() > this.props.closeDate) {
      throw new Error('RFQ is closed for bidding')
    }

    // Check for duplicate bids from same vendor
    const existingBidIndex = this.props.bids.findIndex((b) =>
      b.vendorId.equals(bid.vendorId),
    )

    if (existingBidIndex >= 0) {
      // Replace existing bid
      this.props.bids[existingBidIndex] = bid
    } else {
      this.props.bids = [...this.props.bids, bid]
    }

    this.touch()
  }

  public close() {
    if (this.props.status !== 'published') {
      throw new Error('only published RFQs can be closed')
    }

    this.props.status = 'closed'
    this.touch()
  }

  public awardBid(vendorId: UniqueEntityID) {
    if (this.props.status !== 'closed' && this.props.status !== 'published') {
      throw new Error('RFQ must be closed or published to award bid')
    }

    const bid = this.props.bids.find((b) => b.vendorId.equals(vendorId))
    if (!bid) {
      throw new Error('vendor has not submitted a bid')
    }

    this.props.status = 'awarded'
    this.props.selectedBidVendorId = vendorId
    this.props.awardedAt = new Date()
    this.touch()
  }

  public cancel() {
    if (this.props.status === 'awarded') {
      throw new Error('cannot cancel awarded RFQs')
    }

    this.props.status = 'cancelled'
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
