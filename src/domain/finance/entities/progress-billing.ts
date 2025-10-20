import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'

/**
 * Progress Billing (AIA G702/G703) - simplified, consistent with project patterns
 */

export type BillingStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'void'
export type LienWaiverType = 'conditional' | 'unconditional' | 'partial' | 'final'
export type RetainageReleaseType = 'none' | 'partial' | 'full'

export type BillingLineItem = {
  id: string
  costCodeId: string
  description?: string
  scheduledValue: Money
  workCompletedPreviously: Money
  workCompletedThisPeriod: Money
  materialsStoredPreviously: Money
  materialsStoredThisPeriod: Money
  totalCompletedAndStored: Money
  percentComplete: number
  retainagePercent: number
  retainageAmount: Money
  balanceToFinish: Money
}

export type LienWaiver = {
  id: string
  type: LienWaiverType
  amount: Money
  throughDate: Date
  receivedDate?: Date
  isReceived: boolean
  documentUrl?: string
  notes?: string
}

export type ProgressBillingProps = {
  projectId: UniqueEntityID
  contractId: UniqueEntityID
  applicationNumber: number
  periodEndDate: Date
  status: BillingStatus

  originalContractSum: Money
  changeOrdersApproved: Money
  contractSumToDate: Money
  totalCompletedAndStored: Money
  retainage: Money
  totalEarned: Money
  lessAmountsPreviouslyCertified: Money
  currentPaymentDue: Money
  balanceToFinish: Money

  lineItems: BillingLineItem[]

  retainagePercent: number
  retainageReleaseType: RetainageReleaseType
  retainageReleased: Money

  lienWaivers: LienWaiver[]

  submittedBy?: UniqueEntityID
  submittedAt?: Date
  approvedBy?: UniqueEntityID
  approvedAt?: Date
  rejectedBy?: UniqueEntityID
  rejectedAt?: Date
  rejectionReason?: string
  paidAt?: Date
  paymentReference?: string

  documentUrls: string[]
  notes: string

  createdAt: Date
  createdBy: UniqueEntityID
  updatedAt: Date
}

export class ProgressBilling extends AggregateRoot<ProgressBillingProps> {
  private constructor(props: ProgressBillingProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(props: Omit<ProgressBillingProps, 'createdAt' | 'updatedAt'>, id?: UniqueEntityID): Result<ProgressBilling> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.contractId, argumentName: 'contractId' },
      { argument: props.applicationNumber, argumentName: 'applicationNumber' },
      { argument: props.periodEndDate, argumentName: 'periodEndDate' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.originalContractSum, argumentName: 'originalContractSum' },
      { argument: props.currentPaymentDue, argumentName: 'currentPaymentDue' },
      { argument: props.createdBy, argumentName: 'createdBy' }
    ])

    if (!guard.success) {
      return Result.fail<ProgressBilling>((guard as any).message || 'Invalid properties')
    }

    // ensure money currencies match
    const currency = props.originalContractSum.currency
    const amountsToCheck = [
      props.changeOrdersApproved,
      props.contractSumToDate,
      props.totalCompletedAndStored,
      props.retainage,
      props.totalEarned,
      props.lessAmountsPreviouslyCertified,
      props.currentPaymentDue,
      props.balanceToFinish,
      props.retainageReleased
    ]

    if (!amountsToCheck.every(a => a.currency === currency)) {
      return Result.fail<ProgressBilling>('All money amounts must use the same currency')
    }

    const now = new Date()
    const fullProps: ProgressBillingProps = {
      ...props,
      createdAt: now,
      updatedAt: now
    } as ProgressBillingProps

    return Result.ok<ProgressBilling>(new ProgressBilling(fullProps, id))
  }

  // getters
  get projectId(): UniqueEntityID { return this.props.projectId }
  get contractId(): UniqueEntityID { return this.props.contractId }
  get applicationNumber(): number { return this.props.applicationNumber }
  get periodEndDate(): Date { return this.props.periodEndDate }
  get status(): BillingStatus { return this.props.status }

  get originalContractSum(): Money { return this.props.originalContractSum }
  get changeOrdersApproved(): Money { return this.props.changeOrdersApproved }
  get contractSumToDate(): Money { return this.props.contractSumToDate }
  get totalCompletedAndStored(): Money { return this.props.totalCompletedAndStored }
  get retainage(): Money { return this.props.retainage }
  get totalEarned(): Money { return this.props.totalEarned }
  get lessAmountsPreviouslyCertified(): Money { return this.props.lessAmountsPreviouslyCertified }
  get currentPaymentDue(): Money { return this.props.currentPaymentDue }
  get balanceToFinish(): Money { return this.props.balanceToFinish }

  get lineItems(): BillingLineItem[] { return [...this.props.lineItems] }
  get lienWaivers(): LienWaiver[] { return [...this.props.lienWaivers] }
  get documentUrls(): string[] { return [...this.props.documentUrls] }
  get notes(): string { return this.props.notes }

  get createdAt(): Date { return this.props.createdAt }
  get createdBy(): UniqueEntityID { return this.props.createdBy }
  get updatedAt(): Date { return this.props.updatedAt }

  // computed
  get percentComplete(): number {
    if (this.contractSumToDate.amount === 0) return 0
    return (this.totalCompletedAndStored.amount / this.contractSumToDate.amount) * 100
  }

  get hasUnreceivedLienWaivers(): boolean {
    return this.props.lienWaivers.some(lw => !lw.isReceived)
  }

  get receivedLienWaiverAmount(): Money {
    const total = this.props.lienWaivers.filter(lw => lw.isReceived).reduce((s, lw) => s + lw.amount.amount, 0)
    const r = Money.create(total, this.currentPaymentDue.currency)
    return r.isSuccess ? r.value! : Money.create(0, this.currentPaymentDue.currency).value!
  }

  // behaviors
  submit(submittedBy: UniqueEntityID): Result<void> {
    if (this.props.status !== 'draft') return Result.fail('Only draft billings can be submitted')
    if (this.props.lineItems.length === 0) return Result.fail('Cannot submit billing with no line items')

    this.props.status = 'submitted'
    this.props.submittedBy = submittedBy
    this.props.submittedAt = new Date()
    this.touch()
    return Result.ok(undefined)
  }

  approve(approvedBy: UniqueEntityID): Result<void> {
    if (this.props.status !== 'submitted') return Result.fail('Only submitted billings can be approved')
    this.props.status = 'approved'
    this.props.approvedBy = approvedBy
    this.props.approvedAt = new Date()
    this.touch()
    return Result.ok(undefined)
  }

  reject(rejectedBy: UniqueEntityID, reason: string): Result<void> {
    if (this.props.status !== 'submitted') return Result.fail('Only submitted billings can be rejected')
    if (!reason || reason.trim().length < 10) return Result.fail('Rejection reason must be at least 10 characters')

    this.props.status = 'rejected'
    this.props.rejectedBy = rejectedBy
    this.props.rejectedAt = new Date()
    this.props.rejectionReason = reason
    this.touch()
    return Result.ok(undefined)
  }

  markAsPaid(paymentReference: string): Result<void> {
    if (this.props.status !== 'approved') return Result.fail('Only approved billings can be marked as paid')
    if (!paymentReference || paymentReference.trim().length < 3) return Result.fail('Payment reference is required')

    this.props.status = 'paid'
    this.props.paidAt = new Date()
    this.props.paymentReference = paymentReference
    this.touch()
    return Result.ok(undefined)
  }

  addLineItem(item: BillingLineItem): Result<void> {
    if (this.props.status !== 'draft') return Result.fail('Can only add line items to draft billings')
    const currency = this.originalContractSum.currency
    const allAmounts = [
      item.scheduledValue,
      item.workCompletedPreviously,
      item.workCompletedThisPeriod,
      item.materialsStoredPreviously,
      item.materialsStoredThisPeriod,
      item.totalCompletedAndStored,
      item.retainageAmount,
      item.balanceToFinish
    ]
    if (!allAmounts.every(a => a.currency === currency)) return Result.fail('Line item amounts must match billing currency')
    this.props.lineItems.push(item)
    this.touch()
    return Result.ok(undefined)
  }

  removeLineItem(id: string): Result<void> {
    if (this.props.status !== 'draft') return Result.fail('Can only remove line items from draft billings')
    const idx = this.props.lineItems.findIndex(i => i.id === id)
    if (idx === -1) return Result.fail('Line item not found')
    this.props.lineItems.splice(idx, 1)
    this.touch()
    return Result.ok(undefined)
  }

  addLienWaiver(lw: LienWaiver): Result<void> {
    if (lw.amount.currency !== this.currentPaymentDue.currency) return Result.fail('Lien waiver amount must match billing currency')
    this.props.lienWaivers.push(lw)
    this.touch()
    return Result.ok(undefined)
  }

  markLienWaiverReceived(id: string, documentUrl?: string): Result<void> {
    const lw = this.props.lienWaivers.find(w => w.id === id)
    if (!lw) return Result.fail('Lien waiver not found')
    lw.isReceived = true
    lw.receivedDate = new Date()
    if (documentUrl) lw.documentUrl = documentUrl
    this.touch()
    return Result.ok(undefined)
  }

  releaseRetainage(amount: Money, releaseType: RetainageReleaseType): Result<void> {
    if (amount.currency !== this.retainage.currency) return Result.fail('Release amount must match retainage currency')
    if (amount.amount > this.retainage.amount) return Result.fail('Cannot release more than available retainage')
    this.props.retainageReleaseType = releaseType
    this.props.retainageReleased = amount
    this.touch()
    return Result.ok(undefined)
  }

  addDocument(url: string): Result<void> {
    if (!url || url.trim().length === 0) return Result.fail('Document URL is required')
    this.props.documentUrls.push(url)
    this.touch()
    return Result.ok(undefined)
  }

  addNote(note: string): Result<void> {
    if (!note || note.trim().length === 0) return Result.fail('Note cannot be empty')
    const ts = new Date().toISOString()
    this.props.notes += `\n[${ts}] ${note}`
    this.touch()
    return Result.ok(undefined)
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}
