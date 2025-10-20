import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'

export type InvoiceStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'paid',
]

export type InvoiceLineItem = {
  purchaseOrderLineId: UniqueEntityID
  description: string
  quantity: number
  unitPrice: Money
  lineTotal: Money
  taxAmount?: Money
}

type InvoiceProps = {
  invoiceNumber: string
  vendorId: UniqueEntityID
  vendorName: string
  purchaseOrderId: UniqueEntityID
  purchaseOrderNumber: string
  projectId: UniqueEntityID
  status: InvoiceStatus
  invoiceDate: Date
  dueDate: Date
  items: InvoiceLineItem[]
  subtotal: Money
  taxTotal: Money
  total: Money
  paymentTerms?: string
  notes?: string
  attachmentUrl?: string
  submittedDate?: Date
  approvedDate?: Date
  approvedBy?: UniqueEntityID
  approvedByName?: string
  rejectionReason?: string
  paidDate?: Date
  createdAt: Date
  updatedAt: Date
}

export class Invoice extends AggregateRoot<InvoiceProps> {
  private constructor(props: InvoiceProps, id?: UniqueEntityID) {
    super(props, id)
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

  get purchaseOrderId(): UniqueEntityID {
    return this.props.purchaseOrderId
  }

  get purchaseOrderNumber(): string {
    return this.props.purchaseOrderNumber
  }

  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get status(): InvoiceStatus {
    return this.props.status
  }

  get invoiceDate(): Date {
    return this.props.invoiceDate
  }

  get dueDate(): Date {
    return this.props.dueDate
  }

  get items(): InvoiceLineItem[] {
    return [...this.props.items]
  }

  get subtotal(): Money {
    return this.props.subtotal
  }

  get taxTotal(): Money {
    return this.props.taxTotal
  }

  get total(): Money {
    return this.props.total
  }

  get paymentTerms(): string | undefined {
    return this.props.paymentTerms
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get attachmentUrl(): string | undefined {
    return this.props.attachmentUrl
  }

  get submittedDate(): Date | undefined {
    return this.props.submittedDate
  }

  get approvedDate(): Date | undefined {
    return this.props.approvedDate
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy
  }

  get approvedByName(): string | undefined {
    return this.props.approvedByName
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason
  }

  get paidDate(): Date | undefined {
    return this.props.paidDate
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(props: InvoiceProps, id?: UniqueEntityID): Result<Invoice> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.invoiceNumber, argumentName: 'invoiceNumber' },
      { argument: props.vendorId, argumentName: 'vendorId' },
      { argument: props.vendorName, argumentName: 'vendorName' },
      { argument: props.purchaseOrderId, argumentName: 'purchaseOrderId' },
      { argument: props.purchaseOrderNumber, argumentName: 'purchaseOrderNumber' },
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.invoiceDate, argumentName: 'invoiceDate' },
      { argument: props.dueDate, argumentName: 'dueDate' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.subtotal, argumentName: 'subtotal' },
      { argument: props.taxTotal, argumentName: 'taxTotal' },
      { argument: props.total, argumentName: 'total' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!INVOICE_STATUSES.includes(props.status)) {
      return Result.fail('invalid invoice status')
    }

    if (props.items.length === 0) {
      return Result.fail('invoice must contain at least one line item')
    }

    if (props.dueDate < props.invoiceDate) {
      return Result.fail('due date must be after invoice date')
    }

    return Result.ok(new Invoice(props, id))
  }

  public submit() {
    if (this.props.status !== 'draft') {
      throw new Error('only draft invoices can be submitted')
    }

    this.props.status = 'submitted'
    this.props.submittedDate = new Date()
    this.touch()
  }

  public approve(approvedBy: UniqueEntityID, approvedByName: string) {
    if (this.props.status !== 'submitted') {
      throw new Error('only submitted invoices can be approved')
    }

    this.props.status = 'approved'
    this.props.approvedDate = new Date()
    this.props.approvedBy = approvedBy
    this.props.approvedByName = approvedByName
    this.touch()
  }

  public reject(reason: string) {
    if (this.props.status !== 'submitted') {
      throw new Error('only submitted invoices can be rejected')
    }

    this.props.status = 'rejected'
    this.props.rejectionReason = reason
    this.touch()
  }

  public markAsPaid() {
    if (this.props.status !== 'approved') {
      throw new Error('only approved invoices can be marked as paid')
    }

    this.props.status = 'paid'
    this.props.paidDate = new Date()
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
