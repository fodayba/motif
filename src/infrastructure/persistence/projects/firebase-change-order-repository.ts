import { UniqueEntityID, Money, type CurrencyCode } from '@domain/shared'
import {
  ChangeOrder,
  type ChangeOrderRepository,
  type ChangeOrderProps,
  type ChangeOrderImpact,
  type ChangeOrderApproval,
  type ChangeOrderRejection,
} from '@domain/projects'
import { type ChangeOrderStatus } from '@domain/projects/enums/change-order-status'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type ChangeOrderDocument = FirestoreDocument<{
  projectId: string
  changeOrderNumber: string
  title: string
  description: string
  reason: string
  category: 'scope' | 'schedule' | 'cost' | 'quality' | 'risk' | 'other'
  requestedBy: string
  requestedByName: string
  status: ChangeOrderStatus

  // Impact
  impact: {
    costImpact: {
      amount: number
      currency: string
    }
    scheduleImpact: number
    scopeImpact: string
  }

  // Tracking
  attachments: string[]
  approvals: Array<{
    approvedBy: string
    approvedByName: string
    approvedAt: string
    comments?: string
  }>
  rejection?: {
    rejectedBy: string
    rejectedByName: string
    rejectedAt: string
    reason: string
  }
  submittedAt?: string

  // Metadata
  createdAt: string
  updatedAt: string
}>

export class FirebaseChangeOrderRepository
  extends FirestoreRepository<ChangeOrder>
  implements ChangeOrderRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'change-orders')
  }

  async findByNumber(changeOrderNumber: string): Promise<ChangeOrder | null> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'changeOrderNumber', op: '==', value: changeOrderNumber },
      { field: 'changeOrderNumber', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)
    return results[0] ?? null
  }

  async findByProject(projectId: UniqueEntityID): Promise<ChangeOrder[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'createdAt', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findByStatus(projectId: UniqueEntityID, status: ChangeOrderStatus): Promise<ChangeOrder[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'status', op: '==', value: status },
      { field: 'createdAt', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findByRequestor(requestorId: UniqueEntityID): Promise<ChangeOrder[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'requestedBy', op: '==', value: requestorId.toString() },
      { field: 'createdAt', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findPendingApprovals(projectId?: UniqueEntityID): Promise<ChangeOrder[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'status', op: '==', value: 'under-review' },
    ]

    if (projectId) {
      constraints.unshift({ field: 'projectId', op: '==', value: projectId.toString() })
    }

    constraints.push({ field: 'submittedAt', op: 'orderBy', direction: 'asc' })

    return this.list(constraints)
  }

  async update(changeOrder: ChangeOrder): Promise<void>
  async update(entity: { id: UniqueEntityID; data: Partial<ChangeOrder> }): Promise<void>
  async update(input: ChangeOrder | { id: UniqueEntityID; data: Partial<ChangeOrder> }): Promise<void> {
    if ('data' in input) {
      await super.update(input)
    } else {
      const id = this.obtainId(input)
      if (!id) {
        throw new Error('ChangeOrder does not have an id')
      }
      await super.update({ id, data: input })
    }
  }

  async getNextChangeOrderNumber(projectId: UniqueEntityID): Promise<string> {
    const projectIdStr = projectId.toString()
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectIdStr },
      { field: 'changeOrderNumber', op: 'orderBy', direction: 'desc' },
      { field: 'changeOrderNumber', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)

    if (results.length === 0) {
      return `CO-${projectIdStr.slice(0, 8)}-001`
    }

    const lastCO = results[0]
    const lastNumber = lastCO.changeOrderNumber
    const match = lastNumber.match(/-(\d+)$/)

    if (!match) {
      return `CO-${projectIdStr.slice(0, 8)}-001`
    }

    const nextNumber = Number.parseInt(match[1], 10) + 1
    return `CO-${projectIdStr.slice(0, 8)}-${nextNumber.toString().padStart(3, '0')}`
  }

  protected toPersistence(changeOrder: ChangeOrder): ChangeOrderDocument {
    const doc: ChangeOrderDocument = {
      projectId: changeOrder.projectId.toString(),
      changeOrderNumber: changeOrder.changeOrderNumber,
      title: changeOrder.title,
      description: changeOrder.description,
      reason: changeOrder.reason,
      category: changeOrder.category,
      requestedBy: changeOrder.requestedBy.toString(),
      requestedByName: changeOrder.requestedByName,
      status: changeOrder.status,

      impact: {
        costImpact: {
          amount: changeOrder.impact.costImpact.amount,
          currency: changeOrder.impact.costImpact.currency,
        },
        scheduleImpact: changeOrder.impact.scheduleImpact,
        scopeImpact: changeOrder.impact.scopeImpact,
      },

      attachments: [...changeOrder.attachments],
      approvals: changeOrder.approvals.map((approval) => ({
        approvedBy: approval.approvedBy.toString(),
        approvedByName: approval.approvedByName,
        approvedAt: approval.approvedAt.toISOString(),
        comments: approval.comments,
      })),
      rejection: changeOrder.rejection
        ? {
            rejectedBy: changeOrder.rejection.rejectedBy.toString(),
            rejectedByName: changeOrder.rejection.rejectedByName,
            rejectedAt: changeOrder.rejection.rejectedAt.toISOString(),
            reason: changeOrder.rejection.reason,
          }
        : undefined,
      submittedAt: changeOrder.submittedAt?.toISOString(),

      createdAt: changeOrder.createdAt.toISOString(),
      updatedAt: changeOrder.updatedAt.toISOString(),
    }

    return doc
  }

  protected obtainId(entity: ChangeOrder): UniqueEntityID | null {
    return entity.id
  }

  protected toDomain(doc: ChangeOrderDocument & { id: string }): ChangeOrder | null {
    try {
      // Reconstruct Money value object for cost impact
      const costImpactResult = Money.create(
        doc.impact.costImpact.amount,
        doc.impact.costImpact.currency as CurrencyCode
      )

      if (!costImpactResult.isSuccess) {
        console.error(`Invalid cost impact money: ${costImpactResult.error}`)
        return null
      }

      const impact: ChangeOrderImpact = {
        costImpact: costImpactResult.value!,
        scheduleImpact: doc.impact.scheduleImpact,
        scopeImpact: doc.impact.scopeImpact,
      }

      // Reconstruct approvals
      const approvals: ChangeOrderApproval[] = doc.approvals.map((approval) => ({
        approvedBy: new UniqueEntityID(approval.approvedBy),
        approvedByName: approval.approvedByName,
        approvedAt: new Date(approval.approvedAt),
        comments: approval.comments,
      }))

      // Reconstruct rejection (if exists)
      const rejection: ChangeOrderRejection | undefined = doc.rejection
        ? {
            rejectedBy: new UniqueEntityID(doc.rejection.rejectedBy),
            rejectedByName: doc.rejection.rejectedByName,
            rejectedAt: new Date(doc.rejection.rejectedAt),
            reason: doc.rejection.reason,
          }
        : undefined

      const props: ChangeOrderProps = {
        projectId: new UniqueEntityID(doc.projectId),
        changeOrderNumber: doc.changeOrderNumber,
        title: doc.title,
        description: doc.description,
        reason: doc.reason,
        category: doc.category,
        requestedBy: new UniqueEntityID(doc.requestedBy),
        requestedByName: doc.requestedByName,
        status: doc.status,
        impact,
        attachments: [...doc.attachments],
        approvals,
        rejection,
        submittedAt: doc.submittedAt ? new Date(doc.submittedAt) : undefined,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }

      const result = ChangeOrder.create(props, new UniqueEntityID(doc.id))

      if (!result.isSuccess) {
        console.error(`Failed to reconstitute ChangeOrder: ${result.error}`)
        return null
      }

      return result.value!
    } catch (error) {
      console.error('Error reconstituting ChangeOrder:', error)
      return null
    }
  }
}
