import type { Notification } from '@domain/notifications'
import type { NotificationChannel } from '@domain/notifications'
import type { InAppGateway, NotificationChannelHandler } from '../types'

export class InAppNotificationChannel implements NotificationChannelHandler {
  private readonly gateway?: InAppGateway

  constructor(gateway?: InAppGateway) {
    this.gateway = gateway
  }

  supports(channel: NotificationChannel): boolean {
    return channel === 'in-app'
  }

  async send(notification: Notification): Promise<void> {
    if (!this.gateway) {
      return
    }

    await this.gateway.publish(notification)
  }
}
