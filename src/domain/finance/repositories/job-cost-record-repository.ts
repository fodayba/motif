import { UniqueEntityID } from '../../shared'
import { JobCostRecord } from '../entities/job-cost-record'

/**
 * Repository interface for JobCostRecord aggregate
 * 
 * Note: Repositories return raw values, not Result<T>.
 * Error handling is done via try-catch at the application service layer.
 */
export interface JobCostRecordRepository {
  /**
   * Save a job cost record (create or update)
   */
  save(record: JobCostRecord): Promise<void>

  /**
   * Find a job cost record by ID
   */
  findById(id: UniqueEntityID): Promise<JobCostRecord | null>

  /**
   * Find all job cost records for a project
   */
  findByProject(projectId: UniqueEntityID): Promise<JobCostRecord[]>

  /**
   * Find all job cost records for a budget
   */
  findByBudget(budgetId: UniqueEntityID): Promise<JobCostRecord[]>

  /**
   * Find all job cost records for a project phase
   */
  findByPhase(projectId: UniqueEntityID, phase: string): Promise<JobCostRecord[]>

  /**
   * Find all job cost records by cost category
   */
  findByCategory(projectId: UniqueEntityID, category: string): Promise<JobCostRecord[]>

  /**
   * Find all job cost records within a date range
   */
  findByDateRange(
    projectId: UniqueEntityID,
    startDate: Date,
    endDate: Date
  ): Promise<JobCostRecord[]>

  /**
   * Find all over-budget job cost records for a project
   */
  findOverBudget(projectId: UniqueEntityID): Promise<JobCostRecord[]>

  /**
   * Find all unapproved job cost records for a project
   */
  findUnapproved(projectId: UniqueEntityID): Promise<JobCostRecord[]>

  /**
   * Delete a job cost record
   */
  delete(id: UniqueEntityID): Promise<void>
}
