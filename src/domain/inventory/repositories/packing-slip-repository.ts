import type { Result, UniqueEntityID } from '../../shared'
import type { PackingSlip } from '../entities/packing-slip'

export interface PackingSlipRepository {
  findById(id: UniqueEntityID): Promise<Result<PackingSlip | null>>
  findByPackingSlipNumber(packingSlipNumber: string): Promise<Result<PackingSlip | null>>
  findByPickListId(pickListId: UniqueEntityID): Promise<Result<PackingSlip | null>>
  findByOrderReference(orderReference: UniqueEntityID): Promise<Result<PackingSlip[]>>
  findByWarehouseId(warehouseId: UniqueEntityID): Promise<Result<PackingSlip[]>>
  findByStatus(status: string): Promise<Result<PackingSlip[]>>
  findPendingPackingSlips(): Promise<Result<PackingSlip[]>>
  findInProgressPackingSlips(): Promise<Result<PackingSlip[]>>
  save(packingSlip: PackingSlip): Promise<Result<void>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
