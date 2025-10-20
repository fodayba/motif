import { UniqueEntityID, Money, type CurrencyCode } from '@domain/shared'
import {
  ProgressBilling,
  type ProgressBillingRepository,
  type BillingStatus,
  type BillingLineItem,
  type LienWaiver,
} from '@domain/finance'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type BillingLineItemDocument = {
  id: string
  costCodeId: string
  description?: string
  scheduledValue: { amount: number; currency: string }
  workCompletedPreviously: { amount: number; currency: string }
  workCompletedThisPeriod: { amount: number; currency: string }
  materialsStoredPreviously: { amount: number; currency: string }
  materialsStoredThisPeriod: { amount: number; currency: string }
  totalCompletedAndStored: { amount: number; currency: string }
  percentComplete: number
  retainagePercent: number
  retainageAmount: { amount: number; currency: string }
  balanceToFinish: { amount: number; currency: string }
}

type LienWaiverDocument = {
  id: string
  type: string
  amount: { amount: number; currency: string }
  throughDate: string
  receivedDate?: string
  isReceived: boolean
  documentUrl?: string
  notes?: string
}

type ProgressBillingDocument = FirestoreDocument<{
  projectId: string
  contractId: string
  applicationNumber: number
  periodEndDate: string
  status: BillingStatus

  originalContractSum: { amount: number; currency: string }
  changeOrdersApproved: { amount: number; currency: string }
  contractSumToDate: { amount: number; currency: string }
  totalCompletedAndStored: { amount: number; currency: string }
  retainage: { amount: number; currency: string }
  totalEarned: { amount: number; currency: string }
  lessAmountsPreviouslyCertified: { amount: number; currency: string }
  currentPaymentDue: { amount: number; currency: string }
  balanceToFinish: { amount: number; currency: string }

  lineItems: BillingLineItemDocument[]

  retainagePercent: number
  retainageReleaseType: string
  retainageReleased: { amount: number; currency: string }

  lienWaivers: LienWaiverDocument[]
  hasUnreceivedLienWaivers: boolean // Denormalized for querying

  submittedBy?: string
  submittedAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  paidAt?: string
  paymentReference?: string

  documentUrls: string[]
  notes: string

  createdBy: string
  createdAt: string
  updatedAt: string
}>

/**
 * Firebase implementation of ProgressBillingRepository
 * Manages AIA G702/G703 progress billing documents in Firestore
 */
export class FirebaseProgressBillingRepository
  extends FirestoreRepository<ProgressBilling>
  implements ProgressBillingRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'progress_billings')
  }

  // save() and findById() are inherited from FirestoreRepository base class

  async findByProject(projectId: UniqueEntityID): Promise<ProgressBilling[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'applicationNumber', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findByContract(contractId: UniqueEntityID): Promise<ProgressBilling[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'contractId', op: '==', value: contractId.toString() },
      { field: 'applicationNumber', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findByApplicationNumber(
    projectId: UniqueEntityID,
    applicationNumber: number
  ): Promise<ProgressBilling | null> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'applicationNumber', op: '==', value: applicationNumber },
      { field: 'applicationNumber', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)
    return results[0] ?? null
  }

  async findByStatus(status: BillingStatus): Promise<ProgressBilling[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'status', op: '==', value: status },
      { field: 'periodEndDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findPendingApproval(): Promise<ProgressBilling[]> {
    return this.findByStatus('submitted')
  }

  async findPendingPayment(): Promise<ProgressBilling[]> {
    return this.findByStatus('approved')
  }

  async findWithUnreceivedLienWaivers(): Promise<ProgressBilling[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'hasUnreceivedLienWaivers', op: '==', value: true },
      { field: 'status', op: '==', value: 'approved' },
      { field: 'periodEndDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ProgressBilling[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'periodEndDate', op: '>=', value: startDate.toISOString() },
      { field: 'periodEndDate', op: '<=', value: endDate.toISOString() },
      { field: 'periodEndDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findLatest(projectId: UniqueEntityID): Promise<ProgressBilling | null> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'applicationNumber', op: 'orderBy', direction: 'desc' },
      { field: 'applicationNumber', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)
    return results[0] ?? null
  }

  // delete() is inherited from FirestoreRepository base class

  protected obtainId(entity: ProgressBilling): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(billing: ProgressBilling): ProgressBillingDocument {
    // Convert line items
    const lineItemsDocs: BillingLineItemDocument[] = billing.lineItems.map((item) => ({
      id: item.id,
      costCodeId: item.costCodeId,
      description: item.description,
      scheduledValue: {
        amount: item.scheduledValue.amount,
        currency: item.scheduledValue.currency,
      },
      workCompletedPreviously: {
        amount: item.workCompletedPreviously.amount,
        currency: item.workCompletedPreviously.currency,
      },
      workCompletedThisPeriod: {
        amount: item.workCompletedThisPeriod.amount,
        currency: item.workCompletedThisPeriod.currency,
      },
      materialsStoredPreviously: {
        amount: item.materialsStoredPreviously.amount,
        currency: item.materialsStoredPreviously.currency,
      },
      materialsStoredThisPeriod: {
        amount: item.materialsStoredThisPeriod.amount,
        currency: item.materialsStoredThisPeriod.currency,
      },
      totalCompletedAndStored: {
        amount: item.totalCompletedAndStored.amount,
        currency: item.totalCompletedAndStored.currency,
      },
      percentComplete: item.percentComplete,
      retainagePercent: item.retainagePercent,
      retainageAmount: {
        amount: item.retainageAmount.amount,
        currency: item.retainageAmount.currency,
      },
      balanceToFinish: {
        amount: item.balanceToFinish.amount,
        currency: item.balanceToFinish.currency,
      },
    }))

    // Convert lien waivers
    const lienWaiversDocs: LienWaiverDocument[] = billing.lienWaivers.map((waiver) => ({
      id: waiver.id,
      type: waiver.type,
      amount: {
        amount: waiver.amount.amount,
        currency: waiver.amount.currency,
      },
      throughDate: waiver.throughDate.toISOString(),
      receivedDate: waiver.receivedDate?.toISOString(),
      isReceived: waiver.isReceived,
      documentUrl: waiver.documentUrl,
      notes: waiver.notes,
    }))

    return {
      projectId: billing.projectId.toString(),
      contractId: billing.contractId.toString(),
      applicationNumber: billing.applicationNumber,
      periodEndDate: billing.periodEndDate.toISOString(),
      status: billing.status,

      originalContractSum: {
        amount: billing.originalContractSum.amount,
        currency: billing.originalContractSum.currency,
      },
      changeOrdersApproved: {
        amount: billing.changeOrdersApproved.amount,
        currency: billing.changeOrdersApproved.currency,
      },
      contractSumToDate: {
        amount: billing.contractSumToDate.amount,
        currency: billing.contractSumToDate.currency,
      },
      totalCompletedAndStored: {
        amount: billing.totalCompletedAndStored.amount,
        currency: billing.totalCompletedAndStored.currency,
      },
      retainage: {
        amount: billing.retainage.amount,
        currency: billing.retainage.currency,
      },
      totalEarned: {
        amount: billing.totalEarned.amount,
        currency: billing.totalEarned.currency,
      },
      lessAmountsPreviouslyCertified: {
        amount: billing.lessAmountsPreviouslyCertified.amount,
        currency: billing.lessAmountsPreviouslyCertified.currency,
      },
      currentPaymentDue: {
        amount: billing.currentPaymentDue.amount,
        currency: billing.currentPaymentDue.currency,
      },
      balanceToFinish: {
        amount: billing.balanceToFinish.amount,
        currency: billing.balanceToFinish.currency,
      },

      lineItems: lineItemsDocs,

      retainagePercent: (billing as any).props.retainagePercent,
      retainageReleaseType: (billing as any).props.retainageReleaseType,
      retainageReleased: {
        amount: (billing as any).props.retainageReleased.amount,
        currency: (billing as any).props.retainageReleased.currency,
      },

      lienWaivers: lienWaiversDocs,
      hasUnreceivedLienWaivers: billing.hasUnreceivedLienWaivers, // Denormalized

      submittedBy: (billing as any).props.submittedBy?.toString(),
      submittedAt: (billing as any).props.submittedAt?.toISOString(),
      approvedBy: (billing as any).props.approvedBy?.toString(),
      approvedAt: (billing as any).props.approvedAt?.toISOString(),
      rejectedBy: (billing as any).props.rejectedBy?.toString(),
      rejectedAt: (billing as any).props.rejectedAt?.toISOString(),
      rejectionReason: (billing as any).props.rejectionReason,
      paidAt: (billing as any).props.paidAt?.toISOString(),
      paymentReference: (billing as any).props.paymentReference,

      documentUrls: billing.documentUrls,
      notes: billing.notes,

      createdBy: billing.createdBy.toString(),
      createdAt: billing.createdAt.toISOString(),
      updatedAt: billing.updatedAt.toISOString(),
    }
  }

  protected toDomain(doc: ProgressBillingDocument & { id: string }): ProgressBilling | null {
    try {
      const currency = doc.originalContractSum.currency as CurrencyCode

      // Reconstruct line items
      const lineItems: BillingLineItem[] = doc.lineItems.map((itemDoc) => ({
        id: itemDoc.id,
        costCodeId: itemDoc.costCodeId,
        description: itemDoc.description,
        scheduledValue: Money.create(itemDoc.scheduledValue.amount, currency).value!,
        workCompletedPreviously: Money.create(itemDoc.workCompletedPreviously.amount, currency).value!,
        workCompletedThisPeriod: Money.create(itemDoc.workCompletedThisPeriod.amount, currency).value!,
        materialsStoredPreviously: Money.create(itemDoc.materialsStoredPreviously.amount, currency).value!,
        materialsStoredThisPeriod: Money.create(itemDoc.materialsStoredThisPeriod.amount, currency).value!,
        totalCompletedAndStored: Money.create(itemDoc.totalCompletedAndStored.amount, currency).value!,
        percentComplete: itemDoc.percentComplete,
        retainagePercent: itemDoc.retainagePercent,
        retainageAmount: Money.create(itemDoc.retainageAmount.amount, currency).value!,
        balanceToFinish: Money.create(itemDoc.balanceToFinish.amount, currency).value!,
      }))

      // Reconstruct lien waivers
      const lienWaivers: LienWaiver[] = doc.lienWaivers.map((waiverDoc) => ({
        id: waiverDoc.id,
        type: waiverDoc.type as any,
        amount: Money.create(waiverDoc.amount.amount, currency).value!,
        throughDate: new Date(waiverDoc.throughDate),
        receivedDate: waiverDoc.receivedDate ? new Date(waiverDoc.receivedDate) : undefined,
        isReceived: waiverDoc.isReceived,
        documentUrl: waiverDoc.documentUrl,
        notes: waiverDoc.notes,
      }))

      const result = ProgressBilling.create(
        {
          projectId: new UniqueEntityID(doc.projectId),
          contractId: new UniqueEntityID(doc.contractId),
          applicationNumber: doc.applicationNumber,
          periodEndDate: new Date(doc.periodEndDate),
          status: doc.status,

          originalContractSum: Money.create(doc.originalContractSum.amount, currency).value!,
          changeOrdersApproved: Money.create(doc.changeOrdersApproved.amount, currency).value!,
          contractSumToDate: Money.create(doc.contractSumToDate.amount, currency).value!,
          totalCompletedAndStored: Money.create(doc.totalCompletedAndStored.amount, currency).value!,
          retainage: Money.create(doc.retainage.amount, currency).value!,
          totalEarned: Money.create(doc.totalEarned.amount, currency).value!,
          lessAmountsPreviouslyCertified: Money.create(
            doc.lessAmountsPreviouslyCertified.amount,
            currency
          ).value!,
          currentPaymentDue: Money.create(doc.currentPaymentDue.amount, currency).value!,
          balanceToFinish: Money.create(doc.balanceToFinish.amount, currency).value!,

          lineItems,

          retainagePercent: doc.retainagePercent,
          retainageReleaseType: doc.retainageReleaseType as any,
          retainageReleased: Money.create(doc.retainageReleased.amount, currency).value!,

          lienWaivers,

          submittedBy: doc.submittedBy ? new UniqueEntityID(doc.submittedBy) : undefined,
          submittedAt: doc.submittedAt ? new Date(doc.submittedAt) : undefined,
          approvedBy: doc.approvedBy ? new UniqueEntityID(doc.approvedBy) : undefined,
          approvedAt: doc.approvedAt ? new Date(doc.approvedAt) : undefined,
          rejectedBy: doc.rejectedBy ? new UniqueEntityID(doc.rejectedBy) : undefined,
          rejectedAt: doc.rejectedAt ? new Date(doc.rejectedAt) : undefined,
          rejectionReason: doc.rejectionReason,
          paidAt: doc.paidAt ? new Date(doc.paidAt) : undefined,
          paymentReference: doc.paymentReference,

          documentUrls: doc.documentUrls,
          notes: doc.notes,

          createdBy: new UniqueEntityID(doc.createdBy),
        },
        new UniqueEntityID(doc.id),
      )

      return result.isSuccess ? result.value! : null
    } catch (error) {
      console.error('Failed to reconstruct ProgressBilling:', error)
      return null
    }
  }
}
