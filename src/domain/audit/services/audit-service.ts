import { Result, UniqueEntityID } from '../../shared'
import { AuditLogEntry } from '../entities/audit-log-entry'
import type { AuditLogRepository } from '../repositories/audit-log-repository'

export interface RecordAuditEventProps {
  actorId: UniqueEntityID
  module: string
  action: string
  description?: string
  targetId?: UniqueEntityID | null
  metadata?: Record<string, unknown>
  correlationId?: string | null
  occurredAt?: Date
}

export class AuditService {
  private readonly repository: AuditLogRepository

  constructor(repository: AuditLogRepository) {
    this.repository = repository
  }

  async recordEvent(props: RecordAuditEventProps): Promise<Result<AuditLogEntry>> {
    const entryResult = AuditLogEntry.create({
      actorId: props.actorId,
      module: props.module,
      action: props.action,
      description: props.description ?? null,
      targetId: props.targetId ?? null,
      metadata: props.metadata,
      correlationId: props.correlationId ?? null,
      occurredAt: props.occurredAt ?? new Date(),
    })

    if (!entryResult.isSuccess || !entryResult.value) {
      return Result.fail(entryResult.error ?? 'Failed to create audit log entry')
    }

    const entry = entryResult.value

    await this.repository.append(entry)

    return Result.ok(entry)
  }

  async fetchTimelineForTarget(targetId: UniqueEntityID, limit = 100): Promise<AuditLogEntry[]> {
    return this.repository.listForTarget(targetId, { limit })
  }

  async fetchTimelineForActor(actorId: UniqueEntityID, limit = 100): Promise<AuditLogEntry[]> {
    return this.repository.listForActor(actorId, { limit })
  }

  async fetchCorrelation(correlationId: string): Promise<AuditLogEntry[]> {
    return this.repository.findByCorrelationId(correlationId)
  }
}
