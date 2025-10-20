import type { UniqueEntityID } from '../../shared'
import type { GoodsReceipt, GoodsReceiptStatus } from '../entities/goods-receipt'

export interface GoodsReceiptRepository {
  save(goodsReceipt: GoodsReceipt): Promise<void>
  findById(id: UniqueEntityID): Promise<GoodsReceipt | null>
  findByReceiptNumber(receiptNumber: string): Promise<GoodsReceipt | null>
  findByPurchaseOrder(purchaseOrderId: UniqueEntityID): Promise<GoodsReceipt[]>
  findByProject(projectId: UniqueEntityID): Promise<GoodsReceipt[]>
  findByStatus(status: GoodsReceiptStatus): Promise<GoodsReceipt[]>
  findByVendor(vendorId: UniqueEntityID): Promise<GoodsReceipt[]>
  listAll(): Promise<GoodsReceipt[]>
  listPending(): Promise<GoodsReceipt[]>
  listWithDiscrepancies(): Promise<GoodsReceipt[]>
  delete(id: UniqueEntityID): Promise<void>
  nextIdentity(): Promise<string>
}
