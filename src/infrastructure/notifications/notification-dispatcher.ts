import type {
  Notification,
  NotificationChannel,
  NotificationRepository,
} from '@domain/notifications'
import type {
  NotificationChannelHandler,
  NotificationDispatchAttempt,
} from './types'

const DEFAULT_CHANNELS: NotificationChannel[] = ['email', 'push', 'in-app']

export class NotificationDispatcher {
  private readonly repository: NotificationRepository
  private readonly handlers: NotificationChannelHandler[]

  constructor(repository: NotificationRepository, handlers: NotificationChannelHandler[]) {
    this.repository = repository
    this.handlers = handlers
  }

  async dispatchPending(channel: NotificationChannel, until = new Date()): Promise<NotificationDispatchAttempt[]> {
    const notifications = await this.repository.listPendingByChannel(channel, { until })

    if (notifications.length === 0) {
      return []
    }

    const handler = this.resolveHandler(channel)
    if (!handler) {
      return notifications.map((notification) => ({
        notificationId: notification.id.toString(),
        channel,
        success: false,
        error: `no handler registered for channel ${channel}`,
      }))
    }

    const attempts: NotificationDispatchAttempt[] = []

    for (const notification of notifications) {
      attempts.push(await this.sendWithHandler(handler, notification, channel))
    }

    return attempts
  }

  async dispatchAll(until = new Date()): Promise<NotificationDispatchAttempt[]> {
    const channels = this.handlers.length > 0
      ? this.handlers.reduce<NotificationChannel[]>((acc, handler) => {
        for (const channel of DEFAULT_CHANNELS) {
          if (handler.supports(channel) && !acc.includes(channel)) {
            acc.push(channel)
          }
        }
        return acc
      }, [])
      : DEFAULT_CHANNELS

    const results: NotificationDispatchAttempt[] = []

    for (const channel of channels) {
      const pending = await this.dispatchPending(channel, until)
      results.push(...pending)
    }

    return results
  }

  private resolveHandler(channel: NotificationChannel): NotificationChannelHandler | undefined {
    return this.handlers.find((handler) => handler.supports(channel))
  }

  private async sendWithHandler(
    handler: NotificationChannelHandler,
    notification: Notification,
    channel: NotificationChannel,
  ): Promise<NotificationDispatchAttempt> {
    try {
      await handler.send(notification)
      return {
        notificationId: notification.id.toString(),
        channel,
        success: true,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      return {
        notificationId: notification.id.toString(),
        channel,
        success: false,
        error: message,
      }
    }
  }
}
