import type { UniqueEntityID } from '../../shared'
import type { ProjectBudget } from '../entities/project-budget'

export interface ProjectBudgetRepository {
  findById(id: UniqueEntityID): Promise<ProjectBudget | null>
  findLatestByProject(projectId: UniqueEntityID): Promise<ProjectBudget | null>
  listByProject(projectId: UniqueEntityID): Promise<ProjectBudget[]>
  save(budget: ProjectBudget): Promise<void>
}
