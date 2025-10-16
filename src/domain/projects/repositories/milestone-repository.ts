import type { UniqueEntityID } from '../../shared'
import type { Milestone } from '../entities/milestone'
import type { MilestoneStatus } from '../enums/milestone-status'

export interface MilestoneRepository {
  // Basic CRUD operations
  findById(milestoneId: UniqueEntityID): Promise<Milestone | null>
  save(milestone: Milestone): Promise<void>
  delete(milestoneId: UniqueEntityID): Promise<void>

  // Query methods
  findByProject(projectId: UniqueEntityID): Promise<Milestone[]>
  findByStatus(projectId: UniqueEntityID, status: MilestoneStatus): Promise<Milestone[]>
  findCriticalMilestones(projectId: UniqueEntityID): Promise<Milestone[]>
  findOverdueMilestones(projectId?: UniqueEntityID): Promise<Milestone[]>
  findUpcomingMilestones(projectId: UniqueEntityID, daysAhead: number): Promise<Milestone[]>
}
