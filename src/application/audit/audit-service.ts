import { Result, UniqueEntityID } from '@domain/shared'
import {
  AuditService as DomainAuditService,
  type AuditLogEntry,
} from '@domain/audit'

export type RecordAuditActionInput = {
  actorId: string
  module: string
  action: string
  description?: string
  targetId?: string
  metadata?: Record<string, unknown>
  correlationId?: string
  occurredAt?: Date
}

export type RecordComplianceEventInput = Omit<
  RecordAuditActionInput,
  'module'
> & { regulation: string }

export class AuditService {
  private readonly domainService: DomainAuditService

  constructor(domainService: DomainAuditService) {
    this.domainService = domainService
  }

  async recordAction(input: RecordAuditActionInput): Promise<Result<AuditLogEntry>> {
    const actorIdResult = this.parseId(input.actorId, 'actorId')
    if (!actorIdResult.isSuccess || !actorIdResult.value) {
      return Result.fail(actorIdResult.error ?? 'invalid actorId')
    }

    const targetIdResult = this.parseOptionalId(input.targetId, 'targetId')
    if (!targetIdResult.isSuccess) {
      return Result.fail(targetIdResult.error ?? 'invalid targetId')
    }

    const entryResult = await this.domainService.recordEvent({
      actorId: actorIdResult.value,
      module: input.module,
      action: input.action,
      description: input.description,
      targetId: targetIdResult.value,
      metadata: input.metadata,
      correlationId: input.correlationId ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    })

    if (!entryResult.isSuccess || !entryResult.value) {
      return Result.fail(entryResult.error ?? 'failed to record audit action')
    }

    return Result.ok(entryResult.value)
  }

  async recordComplianceEvent(
    input: RecordComplianceEventInput,
  ): Promise<Result<AuditLogEntry>> {
    const metadata = {
      ...input.metadata,
      regulation: input.regulation,
    }

    return this.recordAction({
      ...input,
      module: 'compliance',
      metadata,
    })
  }

  async listUserActions(
    userId: string,
    limit = 100,
  ): Promise<Result<AuditLogEntry[]>> {
    const idResult = this.parseId(userId, 'userId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid userId')
    }

    const entries = await this.domainService.fetchTimelineForActor(
      idResult.value,
      limit,
    )

    return Result.ok(entries)
  }

  async listEntityActions(
    entityId: string,
    limit = 100,
  ): Promise<Result<AuditLogEntry[]>> {
    const idResult = this.parseId(entityId, 'entityId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid entityId')
    }

    const entries = await this.domainService.fetchTimelineForTarget(
      idResult.value,
      limit,
    )

    return Result.ok(entries)
  }

  async listByCorrelation(
    correlationId: string,
  ): Promise<Result<AuditLogEntry[]>> {
    if (!correlationId || correlationId.trim().length === 0) {
      return Result.fail('correlationId is required')
    }

    const entries = await this.domainService.fetchCorrelation(correlationId)

    return Result.ok(entries)
  }

  private parseId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }

  private parseOptionalId(
    value: string | undefined,
    label: string,
  ): Result<UniqueEntityID | null> {
    if (!value) {
      return Result.ok(null)
    }

    const parsed = this.parseId(value, label)
    if (!parsed.isSuccess || !parsed.value) {
      return Result.fail(parsed.error ?? `${label} must be a valid UUID`)
    }

    return Result.ok(parsed.value)
  }
}
