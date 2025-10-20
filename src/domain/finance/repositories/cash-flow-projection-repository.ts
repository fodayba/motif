import { UniqueEntityID } from '../../shared'
import { CashFlowProjection } from '../entities/cash-flow-projection'
import type { CashFlowScenario } from '../entities/cash-flow-projection'

/**
 * Repository interface for CashFlowProjection aggregate
 * 
 * Note: Repositories return raw values, not Result<T>.
 * Error handling is done via try-catch at the application service layer.
 */
export interface CashFlowProjectionRepository {
  /**
   * Save a cash flow projection (create or update)
   */
  save(projection: CashFlowProjection): Promise<void>

  /**
   * Find a cash flow projection by ID
   */
  findById(id: UniqueEntityID): Promise<CashFlowProjection | null>

  /**
   * Find all cash flow projections for a project
   */
  findByProject(projectId: UniqueEntityID): Promise<CashFlowProjection[]>

  /**
   * Find cash flow projections by scenario type
   */
  findByScenario(
    projectId: UniqueEntityID,
    scenario: CashFlowScenario
  ): Promise<CashFlowProjection[]>

  /**
   * Find the most recent cash flow projection for a project
   */
  findLatest(projectId: UniqueEntityID): Promise<CashFlowProjection | null>

  /**
   * Find all cash flow projections within a date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<CashFlowProjection[]>

  /**
   * Find all projections with negative cash flow weeks
   */
  findWithNegativeCashFlow(): Promise<CashFlowProjection[]>

  /**
   * Find all company-wide projections (not project-specific)
   */
  findCompanyWide(): Promise<CashFlowProjection[]>

  /**
   * Delete a cash flow projection
   */
  delete(id: UniqueEntityID): Promise<void>
}
