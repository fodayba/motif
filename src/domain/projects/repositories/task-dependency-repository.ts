import { UniqueEntityID } from '../../shared'
import { TaskDependency } from '../entities/task-dependency'

/**
 * TaskDependency Repository Interface
 * 
 * Persistence operations for task dependencies
 */
export interface TaskDependencyRepository {
  findById(id: UniqueEntityID): Promise<TaskDependency | null>
  save(dependency: TaskDependency): Promise<void>
  update(dependency: TaskDependency): Promise<void>
  delete(id: UniqueEntityID): Promise<void>
  findByProject(projectId: UniqueEntityID): Promise<TaskDependency[]>
  findByPredecessor(predecessorId: UniqueEntityID): Promise<TaskDependency[]>
  findBySuccessor(successorId: UniqueEntityID): Promise<TaskDependency[]>
}
