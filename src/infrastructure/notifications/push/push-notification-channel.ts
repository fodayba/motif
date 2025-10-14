import type { Notification } from '@domain/notifications'
import type { NotificationChannel } from '@domain/notifications'
import { FirebaseMessagingService } from '@infrastructure/firebase/messaging/firebase-messaging-service'
import type { NotificationChannelHandler } from '../types'

const extractData = (metadata?: Record<string, unknown>): Record<string, string> | undefined => {
  if (!metadata) {
    return undefined
  }

  const data: Record<string, string> = {}

  Object.entries(metadata).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      data[key] = String(value)
    }
  })

  return Object.keys(data).length > 0 ? data : undefined
}

export class PushNotificationChannel implements NotificationChannelHandler {
  private readonly messaging: FirebaseMessagingService

  constructor(messaging: FirebaseMessagingService) {
    this.messaging = messaging
  }

  supports(channel: NotificationChannel): boolean {
    return channel === 'push'
  }

  async send(notification: Notification): Promise<void> {
    const token = typeof notification.metadata?.token === 'string'
      ? notification.metadata?.token
      : undefined

    const topic = typeof notification.metadata?.topic === 'string'
      ? notification.metadata.topic
      : undefined

    if (!token && !topic) {
      throw new Error('push notification metadata must include a token or topic')
    }

    const data = extractData(notification.metadata)

    await this.messaging.sendNotification({
      token,
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data,
    })
  }
}
