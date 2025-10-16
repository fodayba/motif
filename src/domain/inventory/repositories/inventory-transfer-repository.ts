import type { Result, UniqueEntityID } from '../../shared'
import type { InventoryTransfer } from '../entities/inventory-transfer'
import type { TransferStatus } from '../enums/transfer-status'

export interface InventoryTransferRepository {
  save(transfer: InventoryTransfer): Promise<Result<void>>
  findById(id: UniqueEntityID): Promise<Result<InventoryTransfer | null>>
  findByTransferNumber(transferNumber: string): Promise<Result<InventoryTransfer | null>>
  findByStatus(status: TransferStatus): Promise<Result<InventoryTransfer[]>>
  findByLocation(locationId: UniqueEntityID): Promise<Result<InventoryTransfer[]>>
  findOverdue(): Promise<Result<InventoryTransfer[]>>
  findInTransit(): Promise<Result<InventoryTransfer[]>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
