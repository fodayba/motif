import type { Result, UniqueEntityID } from '../../shared'
import type { CycleCount } from '../entities/cycle-count'
import type { CycleCountStatus } from '../enums/cycle-count-status'

export interface CycleCountRepository {
  save(cycleCount: CycleCount): Promise<Result<void>>
  findById(id: UniqueEntityID): Promise<Result<CycleCount | null>>
  findByCountNumber(countNumber: string): Promise<Result<CycleCount | null>>
  findByStatus(status: CycleCountStatus): Promise<Result<CycleCount[]>>
  findByLocation(locationId: UniqueEntityID): Promise<Result<CycleCount[]>>
  findScheduled(startDate: Date, endDate: Date): Promise<Result<CycleCount[]>>
  findRequiringRecount(): Promise<Result<CycleCount[]>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
