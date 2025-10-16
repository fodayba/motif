import type { Result, UniqueEntityID } from '../../shared'
import type { KanbanSignal } from '../entities/kanban-signal'

export interface KanbanSignalRepository {
  findById(id: UniqueEntityID): Promise<Result<KanbanSignal | null>>
  findByItemId(itemId: UniqueEntityID): Promise<Result<KanbanSignal[]>>
  findByLocationId(locationId: UniqueEntityID): Promise<Result<KanbanSignal[]>>
  findByStatus(status: string): Promise<Result<KanbanSignal[]>>
  findActiveSignals(): Promise<Result<KanbanSignal[]>>
  findTriggeredSignals(): Promise<Result<KanbanSignal[]>>
  save(signal: KanbanSignal): Promise<Result<void>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
