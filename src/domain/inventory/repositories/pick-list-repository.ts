import type { Result, UniqueEntityID } from '../../shared'
import type { PickList } from '../entities/pick-list'

export interface PickListRepository {
  findById(id: UniqueEntityID): Promise<Result<PickList | null>>
  findByPickListNumber(pickListNumber: string): Promise<Result<PickList | null>>
  findByOrderReference(orderReference: UniqueEntityID): Promise<Result<PickList[]>>
  findByWarehouseId(warehouseId: UniqueEntityID): Promise<Result<PickList[]>>
  findByStatus(status: string): Promise<Result<PickList[]>>
  findByAssignedTo(userId: UniqueEntityID): Promise<Result<PickList[]>>
  findPendingPickLists(): Promise<Result<PickList[]>>
  findInProgressPickLists(): Promise<Result<PickList[]>>
  save(pickList: PickList): Promise<Result<void>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
