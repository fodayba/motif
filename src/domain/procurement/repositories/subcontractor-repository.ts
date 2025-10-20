import type { UniqueEntityID } from '../../shared'
import type { Subcontractor, SubcontractorStatus } from '../entities/subcontractor'

export interface SubcontractorRepository {
  save(subcontractor: Subcontractor): Promise<void>
  findById(id: UniqueEntityID): Promise<Subcontractor | null>
  findByTaxId(taxId: string): Promise<Subcontractor | null>
  findByStatus(status: SubcontractorStatus): Promise<Subcontractor[]>
  findByTradeSpecialty(specialty: string): Promise<Subcontractor[]>
  listAll(): Promise<Subcontractor[]>
  listActive(): Promise<Subcontractor[]>
  listPrequalifying(): Promise<Subcontractor[]>
  listWithExpiringDocuments(daysThreshold: number): Promise<Subcontractor[]>
  listWithExpiredDocuments(): Promise<Subcontractor[]>
  delete(id: UniqueEntityID): Promise<void>
  nextIdentity(): Promise<string>
}
