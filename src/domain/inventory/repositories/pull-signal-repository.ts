import type { Result, UniqueEntityID } from '../../shared'
import type { PullSignal } from '../entities/pull-signal'

export interface PullSignalRepository {
  findById(id: UniqueEntityID): Promise<Result<PullSignal | null>>
  findByItemId(itemId: UniqueEntityID): Promise<Result<PullSignal[]>>
  findByFromLocation(locationId: UniqueEntityID): Promise<Result<PullSignal[]>>
  findByToLocation(locationId: UniqueEntityID): Promise<Result<PullSignal[]>>
  findByStatus(status: string): Promise<Result<PullSignal[]>>
  findPendingSignals(): Promise<Result<PullSignal[]>>
  findInTransitSignals(): Promise<Result<PullSignal[]>>
  findOverdueSignals(): Promise<Result<PullSignal[]>>
  save(signal: PullSignal): Promise<Result<void>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
