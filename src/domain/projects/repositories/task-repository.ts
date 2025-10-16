import type { UniqueEntityID } from '../../shared'
import type { Task } from '../entities/task'
import type { TaskStatus } from '../enums/task-status'

export interface TaskRepository {
  // Basic CRUD operations
  findById(taskId: UniqueEntityID): Promise<Task | null>
  save(task: Task): Promise<void>
  delete(taskId: UniqueEntityID): Promise<void>

  // Query methods
  findByProject(projectId: UniqueEntityID): Promise<Task[]>
  findByStatus(projectId: UniqueEntityID, status: TaskStatus): Promise<Task[]>
  findByAssignee(assigneeId: UniqueEntityID): Promise<Task[]>
  findByMilestone(milestoneId: UniqueEntityID): Promise<Task[]>
  findOverdueTasks(projectId?: UniqueEntityID): Promise<Task[]>
  findCriticalPathTasks(projectId: UniqueEntityID): Promise<Task[]>
  findTasksWithDependencies(projectId: UniqueEntityID): Promise<Task[]>
}
