import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'

export interface AuditLogEntryProps {
  actorId: UniqueEntityID
  targetId?: UniqueEntityID | null
  action: string
  module: string
  description?: string | null
  metadata?: Record<string, unknown>
  occurredAt: Date
  correlationId?: string | null
}

export class AuditLogEntry extends AggregateRoot<AuditLogEntryProps> {
  get actorId(): UniqueEntityID {
    return this.props.actorId
  }

  get targetId(): UniqueEntityID | null {
    return this.props.targetId ?? null
  }

  get action(): string {
    return this.props.action
  }

  get module(): string {
    return this.props.module
  }

  get description(): string | null {
    return this.props.description ?? null
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata
  }

  get occurredAt(): Date {
    return this.props.occurredAt
  }

  get correlationId(): string | null {
    return this.props.correlationId ?? null
  }

  public static create(props: AuditLogEntryProps, id?: UniqueEntityID): Result<AuditLogEntry> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.actorId, argumentName: 'actorId' },
      { argument: props.action, argumentName: 'action' },
      { argument: props.module, argumentName: 'module' },
      { argument: props.occurredAt, argumentName: 'occurredAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.action.trim().length === 0) {
      return Result.fail('action cannot be empty')
    }

    if (props.module.trim().length === 0) {
      return Result.fail('module cannot be empty')
    }

    return Result.ok(new AuditLogEntry({ ...props }, id))
  }
}
