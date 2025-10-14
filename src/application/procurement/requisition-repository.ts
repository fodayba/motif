import type { PurchaseRequisitionRecord, RequisitionStatus } from './types'

export interface RequisitionRepository {
  nextIdentity(): Promise<string>
  save(record: PurchaseRequisitionRecord): Promise<void>
  findById(id: string): Promise<PurchaseRequisitionRecord | null>
  listByStatus(status: RequisitionStatus): Promise<PurchaseRequisitionRecord[]>
  update(record: PurchaseRequisitionRecord): Promise<void>
}
