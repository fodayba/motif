import type { UniqueEntityID } from '../../shared'
import type { ChangeOrder } from '../entities/change-order'
import type { ChangeOrderStatus } from '../enums/change-order-status'

export interface ChangeOrderRepository {
  // Basic CRUD operations
  findById(changeOrderId: UniqueEntityID): Promise<ChangeOrder | null>
  findByNumber(changeOrderNumber: string): Promise<ChangeOrder | null>
  save(changeOrder: ChangeOrder): Promise<void>
  delete(changeOrderId: UniqueEntityID): Promise<void>

  // Query methods
  findByProject(projectId: UniqueEntityID): Promise<ChangeOrder[]>
  findByStatus(projectId: UniqueEntityID, status: ChangeOrderStatus): Promise<ChangeOrder[]>
  findByRequestor(requestorId: UniqueEntityID): Promise<ChangeOrder[]>
  findPendingApprovals(projectId?: UniqueEntityID): Promise<ChangeOrder[]>
  getNextChangeOrderNumber(projectId: UniqueEntityID): Promise<string>
}
