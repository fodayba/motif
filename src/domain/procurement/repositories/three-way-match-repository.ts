import type { UniqueEntityID } from '../../shared'
import type { ThreeWayMatch, ThreeWayMatchStatus } from '../entities/three-way-match'

export interface ThreeWayMatchRepository {
  save(match: ThreeWayMatch): Promise<void>
  findById(id: UniqueEntityID): Promise<ThreeWayMatch | null>
  findByMatchNumber(matchNumber: string): Promise<ThreeWayMatch | null>
  findByPurchaseOrder(purchaseOrderId: UniqueEntityID): Promise<ThreeWayMatch | null>
  findByInvoice(invoiceId: UniqueEntityID): Promise<ThreeWayMatch | null>
  findByGoodsReceipt(goodsReceiptId: UniqueEntityID): Promise<ThreeWayMatch | null>
  findByProject(projectId: UniqueEntityID): Promise<ThreeWayMatch[]>
  findByStatus(status: ThreeWayMatchStatus): Promise<ThreeWayMatch[]>
  findByVendor(vendorId: UniqueEntityID): Promise<ThreeWayMatch[]>
  listAll(): Promise<ThreeWayMatch[]>
  listPending(): Promise<ThreeWayMatch[]>
  listWithDiscrepancies(): Promise<ThreeWayMatch[]>
  listRequiringReview(): Promise<ThreeWayMatch[]>
  delete(id: UniqueEntityID): Promise<void>
  nextIdentity(): Promise<string>
}
