import type { Result, UniqueEntityID } from '../../shared'
import type { StockMovement } from '../entities/stock-movement'
import type { StockMovementType } from '../enums/stock-movement-type'

export interface StockMovementRepository {
  save(movement: StockMovement): Promise<Result<void>>
  findById(id: UniqueEntityID): Promise<Result<StockMovement | null>>
  findByItemId(itemId: UniqueEntityID, startDate?: Date, endDate?: Date): Promise<Result<StockMovement[]>>
  findByLocation(locationId: UniqueEntityID, startDate?: Date, endDate?: Date): Promise<Result<StockMovement[]>>
  findByType(type: StockMovementType, startDate?: Date, endDate?: Date): Promise<Result<StockMovement[]>>
  findByReference(referenceType: string, referenceId: UniqueEntityID): Promise<Result<StockMovement[]>>
}
