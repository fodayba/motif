import type { Notification } from '../entities/notification'
import type { UniqueEntityID } from '../../shared'

export interface NotificationRepository {
  save(notification: Notification): Promise<void>
  markRead(notification: Notification): Promise<void>
  listPendingByChannel(channel: Notification['channel'], options?: { until?: Date }): Promise<Notification[]>
  listByRecipient(recipientId: UniqueEntityID, options?: { limit?: number }): Promise<Notification[]>
}
