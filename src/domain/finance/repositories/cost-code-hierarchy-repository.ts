import { UniqueEntityID } from '../../shared'
import { CostCodeHierarchy } from '../entities/cost-code-hierarchy'

/**
 * Repository interface for CostCodeHierarchy entity
 * 
 * Note: Repositories return raw values, not Result<T>.
 * Error handling is done via try-catch at the application service layer.
 */
export interface CostCodeHierarchyRepository {
  /**
   * Save a cost code hierarchy (create or update)
   */
  save(costCode: CostCodeHierarchy): Promise<void>

  /**
   * Find a cost code by ID
   */
  findById(id: UniqueEntityID): Promise<CostCodeHierarchy | null>

  /**
   * Find a cost code by code string
   */
  findByCode(code: string): Promise<CostCodeHierarchy | null>

  /**
   * Find all cost codes at a specific hierarchy level
   */
  findByLevel(level: number): Promise<CostCodeHierarchy[]>

  /**
   * Find all child cost codes for a parent code
   */
  findChildren(parentCode: string): Promise<CostCodeHierarchy[]>

  /**
   * Find the parent cost code for a given code
   */
  findParent(code: string): Promise<CostCodeHierarchy | null>

  /**
   * Find all active cost codes
   */
  findAllActive(): Promise<CostCodeHierarchy[]>

  /**
   * Find all cost codes (active and inactive)
   */
  findAll(): Promise<CostCodeHierarchy[]>

  /**
   * Search cost codes by name or code pattern
   */
  search(query: string): Promise<CostCodeHierarchy[]>

  /**
   * Delete a cost code (soft delete by marking inactive)
   */
  delete(id: UniqueEntityID): Promise<void>
}
