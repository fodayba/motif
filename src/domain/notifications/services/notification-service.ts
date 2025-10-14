import { Result, UniqueEntityID } from '../../shared'
import type { NotificationChannel } from '../value-objects/notification-channel'
import { Notification } from '../entities/notification'
import type { NotificationRepository } from '../repositories/notification-repository'

export interface NotificationRequest {
  recipientId: UniqueEntityID
  title: string
  body: string
  channel: NotificationChannel
  metadata?: Record<string, unknown>
  sendAt?: Date | null
}

export class NotificationService {
  private readonly repository: NotificationRepository

  constructor(repository: NotificationRepository) {
    this.repository = repository
  }

  async queueNotification(request: NotificationRequest): Promise<Result<Notification>> {
    const notificationResult = Notification.create({
      recipientId: request.recipientId,
      title: request.title,
      body: request.body,
      channel: request.channel,
      metadata: request.metadata,
      sendAt: request.sendAt ?? null,
      createdAt: new Date(),
      readAt: null,
    })

    if (!notificationResult.isSuccess || !notificationResult.value) {
      return Result.fail(notificationResult.error ?? 'Failed to create notification')
    }

    const notification = notificationResult.value
    await this.repository.save(notification)

    return Result.ok(notification)
  }

  async markAsRead(notification: Notification, readAt = new Date()): Promise<void> {
    notification.markRead(readAt)
    await this.repository.markRead(notification)
  }

  async listRecipientHistory(recipientId: UniqueEntityID, limit = 50): Promise<Notification[]> {
    return this.repository.listByRecipient(recipientId, { limit })
  }
}
