import { UniqueEntityID } from '@domain/shared'
import {
  Milestone,
  type MilestoneRepository,
  type MilestoneProps,
  type MilestoneEvidence,
} from '@domain/projects'
import { type MilestoneStatus } from '@domain/projects/enums/milestone-status'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type MilestoneDocument = FirestoreDocument<{
  projectId: string
  name: string
  description?: string
  dueDate: string
  completedDate?: string
  status: MilestoneStatus
  critical: boolean
  dependencies: string[]
  proofRequired: boolean
  evidence: Array<{
    id: string
    submittedBy: string
    submittedAt: string
    type: 'document' | 'photo' | 'inspection' | 'approval'
    fileUrl?: string
    notes?: string
  }>
  createdAt: string
  updatedAt: string
}>

export class FirebaseMilestoneRepository
  extends FirestoreRepository<Milestone>
  implements MilestoneRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'milestones')
  }

  async findByProject(projectId: UniqueEntityID): Promise<Milestone[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'dueDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findByStatus(projectId: UniqueEntityID, status: MilestoneStatus): Promise<Milestone[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'status', op: '==', value: status },
      { field: 'dueDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findCriticalMilestones(projectId: UniqueEntityID): Promise<Milestone[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'critical', op: '==', value: true },
      { field: 'dueDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findOverdueMilestones(projectId?: UniqueEntityID): Promise<Milestone[]> {
    const now = new Date()
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'status', op: '!=', value: 'completed' },
      { field: 'dueDate', op: '<', value: now.toISOString() },
    ]

    if (projectId) {
      constraints.unshift({ field: 'projectId', op: '==', value: projectId.toString() })
    }

    constraints.push({ field: 'dueDate', op: 'orderBy', direction: 'asc' })

    return this.list(constraints)
  }

  async findUpcomingMilestones(projectId: UniqueEntityID, daysAhead: number): Promise<Milestone[]> {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'status', op: '==', value: 'not-started' },
      { field: 'dueDate', op: '>=', value: now.toISOString() },
      { field: 'dueDate', op: '<=', value: futureDate.toISOString() },
      { field: 'dueDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  protected obtainId(entity: Milestone): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(milestone: Milestone): MilestoneDocument {
    const doc: MilestoneDocument = {
      projectId: milestone.projectId.toString(),
      name: milestone.name,
      description: milestone.description,
      dueDate: milestone.dueDate.toISOString(),
      completedDate: milestone.completedDate?.toISOString(),
      status: milestone.status,
      critical: milestone.critical,
      dependencies: milestone.dependencies.map((id) => id.toString()),
      proofRequired: milestone.proofRequired,
      evidence: milestone.evidence.map((e) => ({
        id: e.id,
        submittedBy: e.submittedBy.toString(),
        submittedAt: e.submittedAt.toISOString(),
        type: e.type,
        fileUrl: e.fileUrl,
        notes: e.notes,
      })),
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    }

    return doc
  }

  protected toDomain(doc: MilestoneDocument & { id: string }): Milestone | null {
    try {
      const evidence: MilestoneEvidence[] = doc.evidence.map((e) => ({
        id: e.id,
        submittedBy: new UniqueEntityID(e.submittedBy),
        submittedAt: new Date(e.submittedAt),
        type: e.type,
        fileUrl: e.fileUrl,
        notes: e.notes,
      }))

      const props: MilestoneProps = {
        projectId: new UniqueEntityID(doc.projectId),
        name: doc.name,
        description: doc.description,
        dueDate: new Date(doc.dueDate),
        completedDate: doc.completedDate ? new Date(doc.completedDate) : undefined,
        status: doc.status,
        critical: doc.critical,
        dependencies: doc.dependencies.map((id) => new UniqueEntityID(id)),
        proofRequired: doc.proofRequired,
        evidence,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }

      const result = Milestone.create(props, new UniqueEntityID(doc.id))

      if (!result.isSuccess) {
        console.error(`Failed to reconstitute Milestone: ${result.error}`)
        return null
      }

      return result.value!
    } catch (error) {
      console.error('Error reconstituting Milestone:', error)
      return null
    }
  }
}
