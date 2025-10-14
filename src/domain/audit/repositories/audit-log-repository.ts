import type { AuditLogEntry } from '../entities/audit-log-entry'
import type { UniqueEntityID } from '../../shared'

export interface AuditLogRepository {
  append(entry: AuditLogEntry): Promise<void>
  findByCorrelationId(correlationId: string): Promise<AuditLogEntry[]>
  listForTarget(targetId: UniqueEntityID, options?: { limit?: number }): Promise<AuditLogEntry[]>
  listForActor(actorId: UniqueEntityID, options?: { limit?: number }): Promise<AuditLogEntry[]>
}
