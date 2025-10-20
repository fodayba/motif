import { UniqueEntityID, Money, type CurrencyCode } from '@domain/shared'
import { JobCostRecord, type JobCostRecordRepository, type CostCategory, CostCode } from '@domain/finance'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type JobCostRecordDocument = FirestoreDocument<{
  projectId: string
  budgetId: string
  costCode: string
  category: CostCategory
  description: string
  phase?: string
  task?: string
  resourceType?: string
  resourceId?: string
  transactionDate: string
  plannedAmount: { amount: number; currency: string }
  committedAmount: { amount: number; currency: string }
  actualAmount: { amount: number; currency: string }
  invoiceId?: string
  purchaseOrderId?: string
  approved: boolean
  approvedBy?: string
  approvedAt?: string
  notes?: string
  tags?: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}>

/**
 * Firebase implementation of JobCostRecordRepository
 * Manages persistence of job cost records in Firestore
 */
export class FirebaseJobCostRecordRepository
  extends FirestoreRepository<JobCostRecord>
  implements JobCostRecordRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'job_cost_records')
  }

  // save() and findById() are inherited from FirestoreRepository base class

  async findByProject(projectId: UniqueEntityID): Promise<JobCostRecord[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'transactionDate', op: 'orderBy', direction: 'desc' },
    ]
    return this.list(constraints)
  }

  async findByBudget(budgetId: UniqueEntityID): Promise<JobCostRecord[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'budgetId', op: '==', value: budgetId.toString() },
      { field: 'transactionDate', op: 'orderBy', direction: 'desc' },
    ]
    return this.list(constraints)
  }

  async findByPhase(projectId: UniqueEntityID, phase: string): Promise<JobCostRecord[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'phase', op: '==', value: phase },
      { field: 'transactionDate', op: 'orderBy', direction: 'desc' },
    ]
    return this.list(constraints)
  }

  async findByCategory(
    projectId: UniqueEntityID,
    category: string
  ): Promise<JobCostRecord[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'category', op: '==', value: category },
      { field: 'transactionDate', op: 'orderBy', direction: 'desc' },
    ]
    return this.list(constraints)
  }

  async findByDateRange(
    projectId: UniqueEntityID,
    startDate: Date,
    endDate: Date
  ): Promise<JobCostRecord[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'transactionDate', op: '>=', value: startDate.toISOString() },
      { field: 'transactionDate', op: '<=', value: endDate.toISOString() },
      { field: 'transactionDate', op: 'orderBy', direction: 'desc' },
    ]
    return this.list(constraints)
  }

  async findOverBudget(projectId: UniqueEntityID): Promise<JobCostRecord[]> {
    // Note: Firestore cannot compare two fields in a query (actualAmount > plannedAmount)
    // So we fetch all records and filter client-side
    // For production, consider denormalizing an 'overBudget' flag
    const allRecords = await this.findByProject(projectId)
    const overBudget = allRecords.filter(
      (record) => record.actualAmount.amount > record.plannedAmount.amount,
    )
    return overBudget
  }

  async findUnapproved(projectId: UniqueEntityID): Promise<JobCostRecord[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'approved', op: '==', value: false },
      { field: 'transactionDate', op: 'orderBy', direction: 'desc' },
    ]
    return this.list(constraints)
  }

  // delete() is inherited from FirestoreRepository base class

  protected obtainId(entity: JobCostRecord): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(record: JobCostRecord): JobCostRecordDocument {
    return {
      projectId: record.projectId.toString(),
      budgetId: record.budgetId.toString(),
      costCode: record.costCode.value,
      category: record.category,
      description: record.description,
      phase: record.phase,
      task: record.task,
      resourceType: record.resourceType,
      resourceId: record.resourceId?.toString(),
      transactionDate: record.transactionDate.toISOString(),
      plannedAmount: {
        amount: record.plannedAmount.amount,
        currency: record.plannedAmount.currency,
      },
      committedAmount: {
        amount: record.committedAmount.amount,
        currency: record.committedAmount.currency,
      },
      actualAmount: {
        amount: record.actualAmount.amount,
        currency: record.actualAmount.currency,
      },
      invoiceId: record.invoiceId?.toString(),
      purchaseOrderId: record.purchaseOrderId?.toString(),
      approved: record.approved,
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAt?.toISOString(),
      notes: record.notes,
      tags: record.tags,
      createdBy: record.createdBy,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }
  }

  protected toDomain(doc: JobCostRecordDocument & { id: string }): JobCostRecord | null {
    try {
      // Reconstruct CostCode value object
      const costCodeValue = doc.costCode.includes('-') ? doc.costCode : `CC-${doc.costCode}`
      const costCodeResult = CostCode.create(costCodeValue)
      if (!costCodeResult.isSuccess) {
        console.error('Invalid cost code:', costCodeResult.error)
        return null
      }
      
      const result = JobCostRecord.create(
        {
          projectId: new UniqueEntityID(doc.projectId),
          budgetId: new UniqueEntityID(doc.budgetId),
          costCode: costCodeResult.value!,
          category: doc.category,
          description: doc.description,
          phase: doc.phase,
          task: doc.task,
          resourceType: doc.resourceType,
          resourceId: doc.resourceId ? new UniqueEntityID(doc.resourceId) : undefined,
          transactionDate: new Date(doc.transactionDate),
          plannedAmount: Money.create(
            doc.plannedAmount.amount,
            doc.plannedAmount.currency as CurrencyCode,
          ).value!,
          committedAmount: Money.create(
            doc.committedAmount.amount,
            doc.committedAmount.currency as CurrencyCode,
          ).value!,
          actualAmount: Money.create(
            doc.actualAmount.amount,
            doc.actualAmount.currency as CurrencyCode,
          ).value!,
          invoiceId: doc.invoiceId ? new UniqueEntityID(doc.invoiceId) : undefined,
          purchaseOrderId: doc.purchaseOrderId ? new UniqueEntityID(doc.purchaseOrderId) : undefined,
          approved: doc.approved,
          approvedBy: doc.approvedBy,
          approvedAt: doc.approvedAt ? new Date(doc.approvedAt) : undefined,
          notes: doc.notes,
          tags: doc.tags,
          createdBy: doc.createdBy,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        },
        new UniqueEntityID(doc.id),
      )

      return result.isSuccess ? result.value! : null
    } catch (error) {
      console.error('Failed to reconstruct JobCostRecord:', error)
      return null
    }
  }
}
