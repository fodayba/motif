import { UniqueEntityID } from '@domain/shared'
import {
  TaskDependency,
  type TaskDependencyRepository,
  type TaskDependencyProps,
} from '@domain/projects'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type TaskDependencyDocument = FirestoreDocument<{
  projectId: string
  predecessorId: string
  successorId: string
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
  lagDays: number
  createdAt: string
  updatedAt: string
}>

export class FirebaseTaskDependencyRepository
  extends FirestoreRepository<TaskDependency>
  implements TaskDependencyRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'task-dependencies')
  }

  async findByProject(projectId: UniqueEntityID): Promise<TaskDependency[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'createdAt', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findByPredecessor(predecessorId: UniqueEntityID): Promise<TaskDependency[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'predecessorId', op: '==', value: predecessorId.toString() },
      { field: 'createdAt', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findBySuccessor(successorId: UniqueEntityID): Promise<TaskDependency[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'successorId', op: '==', value: successorId.toString() },
      { field: 'createdAt', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async update(dependency: TaskDependency): Promise<void>
  async update(entity: { id: UniqueEntityID; data: Partial<TaskDependency> }): Promise<void>
  async update(input: TaskDependency | { id: UniqueEntityID; data: Partial<TaskDependency> }): Promise<void> {
    if ('data' in input) {
      await super.update(input)
    } else {
      const id = this.obtainId(input)
      if (!id) {
        throw new Error('TaskDependency does not have an id')
      }
      await super.update({ id, data: input })
    }
  }

  protected obtainId(entity: TaskDependency): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(dependency: TaskDependency): TaskDependencyDocument {
    const doc: TaskDependencyDocument = {
      projectId: dependency.projectId.toString(),
      predecessorId: dependency.predecessorId.toString(),
      successorId: dependency.successorId.toString(),
      type: dependency.type as 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish',
      lagDays: dependency.lagDays,
      createdAt: dependency.createdAt.toISOString(),
      updatedAt: dependency.updatedAt.toISOString(),
    }

    return doc
  }

  protected toDomain(doc: TaskDependencyDocument & { id: string }): TaskDependency | null {
    try {
      const props: TaskDependencyProps = {
        projectId: new UniqueEntityID(doc.projectId),
        predecessorId: new UniqueEntityID(doc.predecessorId),
        successorId: new UniqueEntityID(doc.successorId),
        type: doc.type,
        lagDays: doc.lagDays,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }

      const result = TaskDependency.create(props, new UniqueEntityID(doc.id))

      if (!result.isSuccess) {
        console.error(`Failed to reconstitute TaskDependency: ${result.error}`)
        return null
      }

      return result.value!
    } catch (error) {
      console.error('Error reconstituting TaskDependency:', error)
      return null
    }
  }
}
