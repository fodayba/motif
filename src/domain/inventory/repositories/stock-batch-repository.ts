import type { Result, UniqueEntityID } from '../../shared'
import type { StockBatch } from '../entities/stock-batch'

export interface StockBatchRepository {
  save(batch: StockBatch): Promise<Result<void>>
  findById(id: UniqueEntityID): Promise<Result<StockBatch | null>>
  findByItemId(itemId: UniqueEntityID): Promise<Result<StockBatch[]>>
  findByBatchNumber(batchNumber: string): Promise<Result<StockBatch | null>>
  findExpiring(daysThreshold: number): Promise<Result<StockBatch[]>>
  findExpired(): Promise<Result<StockBatch[]>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
