import type { UniqueEntityID } from '../../shared'
import type { PurchaseOrder } from '../entities/purchase-order'
import type { PurchaseOrderNumber } from '../value-objects/purchase-order-number'

export interface PurchaseOrderRepository {
  findById(id: UniqueEntityID): Promise<PurchaseOrder | null>
  findByNumber(number: PurchaseOrderNumber): Promise<PurchaseOrder | null>
  listByProject(projectId: UniqueEntityID): Promise<PurchaseOrder[]>
  save(order: PurchaseOrder): Promise<void>
  delete(order: PurchaseOrder): Promise<void>
}
