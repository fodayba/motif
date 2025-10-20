import { UniqueEntityID } from '@domain/shared'
import { CostCodeHierarchy, type CostCodeHierarchyRepository } from '@domain/finance'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type CostCodeHierarchyDocument = FirestoreDocument<{
  code: string
  name: string
  description?: string
  parentCode?: string
  level: number
  isActive: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
}>

/**
 * Firebase implementation of CostCodeHierarchyRepository
 * Manages the 4-level cost code hierarchy in Firestore:
 * - Level 1: Division (e.g., "01")
 * - Level 2: Subdivision (e.g., "01.01")
 * - Level 3: Cost Type (e.g., "01.01.01")
 * - Level 4: Detail Code (e.g., "01.01.01.001")
 */
export class FirebaseCostCodeHierarchyRepository
  extends FirestoreRepository<CostCodeHierarchy>
  implements CostCodeHierarchyRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'cost_code_hierarchies')
  }

  // save() and findById() are inherited from FirestoreRepository base class

  async findByCode(code: string): Promise<CostCodeHierarchy | null> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'code', op: '==', value: code },
      { field: 'code', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)
    return results[0] ?? null
  }

  async findByLevel(level: number): Promise<CostCodeHierarchy[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'level', op: '==', value: level },
      { field: 'sortOrder', op: 'orderBy', direction: 'asc' },
      { field: 'code', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findChildren(parentCode: string): Promise<CostCodeHierarchy[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'parentCode', op: '==', value: parentCode },
      { field: 'sortOrder', op: 'orderBy', direction: 'asc' },
      { field: 'code', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findParent(code: string): Promise<CostCodeHierarchy | null> {
    // Extract parent code from the child code
    // e.g., "01.01.01.001" -> "01.01.01"
    const codeParts = code.split('.')
    if (codeParts.length <= 1) {
      return null // No parent for top-level codes
    }

    const parentCode = codeParts.slice(0, -1).join('.')
    return this.findByCode(parentCode)
  }

  async findAllActive(): Promise<CostCodeHierarchy[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'isActive', op: '==', value: true },
      { field: 'level', op: 'orderBy', direction: 'asc' },
      { field: 'sortOrder', op: 'orderBy', direction: 'asc' },
      { field: 'code', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async findAll(): Promise<CostCodeHierarchy[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'level', op: 'orderBy', direction: 'asc' },
      { field: 'sortOrder', op: 'orderBy', direction: 'asc' },
      { field: 'code', op: 'orderBy', direction: 'asc' },
    ]

    return this.list(constraints)
  }

  async search(query: string): Promise<CostCodeHierarchy[]> {
    // Firestore doesn't support full-text search natively
    // For production, consider using Algolia or similar
    // For now, we'll fetch all active codes and filter client-side
    const allCodes = await this.findAllActive()
    
    const lowerQuery = query.toLowerCase()
    return allCodes.filter(
      (code) =>
        code.code.toLowerCase().includes(lowerQuery) ||
        code.name.toLowerCase().includes(lowerQuery) ||
        code.description?.toLowerCase().includes(lowerQuery)
    )
  }

  // delete() is inherited from FirestoreRepository base class
  // Note: In practice, cost codes should be soft-deleted (deactivated) rather than deleted

  protected obtainId(entity: CostCodeHierarchy): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(costCode: CostCodeHierarchy): CostCodeHierarchyDocument {
    return {
      code: costCode.code,
      name: costCode.name,
      description: costCode.description,
      parentCode: costCode.parentCode,
      level: costCode.level,
      isActive: costCode.isActive,
      sortOrder: costCode.sortOrder,
      createdAt: costCode.createdAt.toISOString(),
      updatedAt: costCode.updatedAt.toISOString(),
    }
  }

  protected toDomain(doc: CostCodeHierarchyDocument & { id: string }): CostCodeHierarchy | null {
    try {
      const result = CostCodeHierarchy.create(
        {
          code: doc.code,
          name: doc.name,
          description: doc.description,
          parentCode: doc.parentCode,
          level: doc.level,
          isActive: doc.isActive,
          sortOrder: doc.sortOrder,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        },
        new UniqueEntityID(doc.id),
      )

      return result.isSuccess ? result.value! : null
    } catch (error) {
      console.error('Failed to reconstruct CostCodeHierarchy:', error)
      return null
    }
  }
}
