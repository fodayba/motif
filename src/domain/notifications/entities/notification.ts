import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { NotificationChannel } from '../value-objects/notification-channel'

export interface NotificationProps {
  recipientId: UniqueEntityID
  title: string
  body: string
  channel: NotificationChannel
  metadata?: Record<string, unknown>
  sendAt?: Date | null
  createdAt: Date
  readAt?: Date | null
}

export class Notification extends AggregateRoot<NotificationProps> {
  get recipientId(): UniqueEntityID {
    return this.props.recipientId
  }

  get title(): string {
    return this.props.title
  }

  get body(): string {
    return this.props.body
  }

  get channel(): NotificationChannel {
    return this.props.channel
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata
  }

  get sendAt(): Date | null {
    return this.props.sendAt ?? null
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get readAt(): Date | null {
    return this.props.readAt ?? null
  }

  markRead(readAt: Date): void {
    this.props.readAt = readAt
  }

  public static create(props: NotificationProps, id?: UniqueEntityID): Result<Notification> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.recipientId, argumentName: 'recipientId' },
      { argument: props.title, argumentName: 'title' },
      { argument: props.body, argumentName: 'body' },
      { argument: props.channel, argumentName: 'channel' },
      { argument: props.createdAt, argumentName: 'createdAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.title.trim().length === 0) {
      return Result.fail('title cannot be empty')
    }

    if (props.body.trim().length === 0) {
      return Result.fail('body cannot be empty')
    }

    return Result.ok(new Notification({ ...props }, id))
  }
}
