import type { UniqueEntityID } from '../../shared'
import type { RFQ, RFQStatus } from '../entities/rfq'

export interface RFQRepository {
  save(rfq: RFQ): Promise<void>
  findById(id: UniqueEntityID): Promise<RFQ | null>
  findByRFQNumber(rfqNumber: string): Promise<RFQ | null>
  findByProject(projectId: UniqueEntityID): Promise<RFQ[]>
  findByStatus(status: RFQStatus): Promise<RFQ[]>
  listAll(): Promise<RFQ[]>
  listPublished(): Promise<RFQ[]>
  listOpen(): Promise<RFQ[]>
  delete(id: UniqueEntityID): Promise<void>
  nextIdentity(): Promise<string>
}
