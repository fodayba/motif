import { UniqueEntityID } from '../../shared'
import { ProgressBilling } from '../entities/progress-billing'
import type { BillingStatus } from '../entities/progress-billing'

/**
 * Repository interface for ProgressBilling aggregate
 * 
 * Note: Repositories return raw values, not Result<T>.
 * Error handling is done via try-catch at the application service layer.
 */
export interface ProgressBillingRepository {
  /**
   * Save a progress billing (create or update)
   */
  save(billing: ProgressBilling): Promise<void>

  /**
   * Find a progress billing by ID
   */
  findById(id: UniqueEntityID): Promise<ProgressBilling | null>

  /**
   * Find all progress billings for a project
   */
  findByProject(projectId: UniqueEntityID): Promise<ProgressBilling[]>

  /**
   * Find all progress billings for a contract
   */
  findByContract(contractId: UniqueEntityID): Promise<ProgressBilling[]>

  /**
   * Find progress billing by application number
   */
  findByApplicationNumber(
    projectId: UniqueEntityID,
    applicationNumber: number
  ): Promise<ProgressBilling | null>

  /**
   * Find progress billings by status
   */
  findByStatus(status: BillingStatus): Promise<ProgressBilling[]>

  /**
   * Find all submitted billings pending approval
   */
  findPendingApproval(): Promise<ProgressBilling[]>

  /**
   * Find all approved billings pending payment
   */
  findPendingPayment(): Promise<ProgressBilling[]>

  /**
   * Find billings with unreceived lien waivers
   */
  findWithUnreceivedLienWaivers(): Promise<ProgressBilling[]>

  /**
   * Find all billings within a date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<ProgressBilling[]>

  /**
   * Get the latest billing for a project
   */
  findLatest(projectId: UniqueEntityID): Promise<ProgressBilling | null>

  /**
   * Delete a progress billing
   */
  delete(id: UniqueEntityID): Promise<void>
}
