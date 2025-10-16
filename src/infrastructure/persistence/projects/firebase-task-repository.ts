import { UniqueEntityID, Money, type CurrencyCode } from '@domain/shared'
import {
  Task,
  type TaskRepository,
  type TaskProps,
} from '@domain/projects'
import { type TaskStatus } from '@domain/projects/enums/task-status'
import { type TaskPriority } from '@domain/projects/enums/task-priority'
import { TaskDependency as TaskDependencyVO } from '@domain/projects/value-objects/task-dependency'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type TaskDocument = FirestoreDocument<{
  projectId: string
  name: string
  description?: string
  wbsCode?: string
  status: TaskStatus
  priority: TaskPriority
  progress: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  duration: number
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: {
    amount: number
    currency: string
  }
  actualCost?: {
    amount: number
    currency: string
  }
  assignedTo: string[]
  dependencies: Array<{
    taskId: string
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
    lag: number
  }>
  parentTaskId?: string
  milestoneId?: string
  createdAt: string
  updatedAt: string
}>

export class FirebaseTaskRepository
  extends FirestoreRepository<Task>
  implements TaskRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'tasks')
  }

  async findByProject(projectId: UniqueEntityID): Promise<Task[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'plannedStartDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findByStatus(projectId: UniqueEntityID, status: TaskStatus): Promise<Task[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'status', op: '==', value: status },
      { field: 'plannedStartDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findByAssignee(assigneeId: UniqueEntityID): Promise<Task[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'assignedTo', op: 'array-contains', value: assigneeId.toString() },
      { field: 'plannedStartDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findByMilestone(milestoneId: UniqueEntityID): Promise<Task[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'milestoneId', op: '==', value: milestoneId.toString() },
      { field: 'plannedStartDate', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findOverdueTasks(projectId?: UniqueEntityID): Promise<Task[]> {
    const now = new Date()
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'status', op: '!=', value: 'completed' },
      { field: 'plannedEndDate', op: '<', value: now.toISOString() },
    ]

    if (projectId) {
      constraints.unshift({ field: 'projectId', op: '==', value: projectId.toString() })
    }

    constraints.push({ field: 'plannedEndDate', op: 'orderBy', direction: 'asc' })

    return this.list(constraints)
  }

  async findCriticalPathTasks(projectId: UniqueEntityID): Promise<Task[]> {
    // Note: Critical path calculation requires analyzing all tasks and their dependencies
    // This is a simplified query that returns all tasks for the project
    // The actual critical path should be calculated in the application layer
    return this.findByProject(projectId)
  }

  async findTasksWithDependencies(projectId: UniqueEntityID): Promise<Task[]> {
    // Note: Firestore doesn't support querying array length
    // This returns all tasks and filtering should be done in the application layer
    return this.findByProject(projectId)
  }

  protected obtainId(entity: Task): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(task: Task): TaskDocument {
    const doc: TaskDocument = {
      projectId: task.projectId.toString(),
      name: task.name,
      description: task.description,
      wbsCode: task.wbsCode,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      plannedStartDate: task.plannedStartDate.toISOString(),
      plannedEndDate: task.plannedEndDate.toISOString(),
      actualStartDate: task.actualStartDate?.toISOString(),
      actualEndDate: task.actualEndDate?.toISOString(),
      duration: task.duration,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      estimatedCost: task.estimatedCost
        ? {
            amount: task.estimatedCost.amount,
            currency: task.estimatedCost.currency,
          }
        : undefined,
      actualCost: task.actualCost
        ? {
            amount: task.actualCost.amount,
            currency: task.actualCost.currency,
          }
        : undefined,
      assignedTo: task.assignedTo.map((id) => id.toString()),
      dependencies: task.dependencies.map((dep) => ({
        taskId: dep.predecessorId.toString(),
        type: dep.dependencyType,
        lag: dep.lag,
      })),
      parentTaskId: task.parentTaskId?.toString(),
      milestoneId: task.milestoneId?.toString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }

    return doc
  }

  protected toDomain(doc: TaskDocument & { id: string }): Task | null {
    try {
      // Reconstruct Money value objects if they exist
      let estimatedCost: Money | undefined
      if (doc.estimatedCost) {
        const costResult = Money.create(
          doc.estimatedCost.amount,
          doc.estimatedCost.currency as CurrencyCode
        )
        if (!costResult.isSuccess) {
          console.error(`Invalid estimated cost: ${costResult.error}`)
          estimatedCost = undefined
        } else {
          estimatedCost = costResult.value!
        }
      }

      let actualCost: Money | undefined
      if (doc.actualCost) {
        const costResult = Money.create(
          doc.actualCost.amount,
          doc.actualCost.currency as CurrencyCode
        )
        if (!costResult.isSuccess) {
          console.error(`Invalid actual cost: ${costResult.error}`)
          actualCost = undefined
        } else {
          actualCost = costResult.value!
        }
      }

      // Reconstruct TaskDependency value objects
      const dependencies = doc.dependencies.map((dep) => {
        const result = TaskDependencyVO.create({
          predecessorId: new UniqueEntityID(dep.taskId),
          dependencyType: dep.type,
          lag: dep.lag,
        })
        if (!result.isSuccess) {
          throw new Error(`Invalid task dependency: ${result.error}`)
        }
        return result.value!
      })

      const props: TaskProps = {
        projectId: new UniqueEntityID(doc.projectId),
        name: doc.name,
        description: doc.description,
        wbsCode: doc.wbsCode,
        status: doc.status,
        priority: doc.priority,
        progress: doc.progress,
        plannedStartDate: new Date(doc.plannedStartDate),
        plannedEndDate: new Date(doc.plannedEndDate),
        actualStartDate: doc.actualStartDate ? new Date(doc.actualStartDate) : undefined,
        actualEndDate: doc.actualEndDate ? new Date(doc.actualEndDate) : undefined,
        duration: doc.duration,
        estimatedHours: doc.estimatedHours,
        actualHours: doc.actualHours,
        estimatedCost,
        actualCost,
        assignedTo: doc.assignedTo.map((id) => new UniqueEntityID(id)),
        dependencies,
        parentTaskId: doc.parentTaskId ? new UniqueEntityID(doc.parentTaskId) : undefined,
        milestoneId: doc.milestoneId ? new UniqueEntityID(doc.milestoneId) : undefined,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }

      const result = Task.create(props, new UniqueEntityID(doc.id))

      if (!result.isSuccess) {
        console.error(`Failed to reconstitute Task: ${result.error}`)
        return null
      }

      return result.value!
    } catch (error) {
      console.error('Error reconstituting Task:', error)
      return null
    }
  }
}
