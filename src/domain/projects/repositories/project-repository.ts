import type { Project } from '../entities/project'
import type { UniqueEntityID } from '../../shared'
import type { ProjectCode } from '../value-objects/project-code'

export interface ProjectRepository {
  findById(id: UniqueEntityID): Promise<Project | null>
  findByCode(code: ProjectCode): Promise<Project | null>
  save(project: Project): Promise<void>
  delete(project: Project): Promise<void>
  listByManager(managerId: UniqueEntityID): Promise<Project[]>
}
