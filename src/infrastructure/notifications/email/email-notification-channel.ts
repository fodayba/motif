import type { Notification } from '@domain/notifications'
import type { NotificationChannel } from '@domain/notifications'
import type { EmailProvider, NotificationChannelHandler } from '../types'

const EMAIL_METADATA_KEYS = ['email', 'to']

const extractEmail = (notification: Notification): string | undefined => {
  if (!notification.metadata) {
    return undefined
  }

  for (const key of EMAIL_METADATA_KEYS) {
    const value = notification.metadata[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return undefined
}

export class EmailNotificationChannel implements NotificationChannelHandler {
  private readonly provider: EmailProvider

  constructor(provider: EmailProvider) {
    this.provider = provider
  }

  supports(channel: NotificationChannel): boolean {
    return channel === 'email'
  }

  async send(notification: Notification): Promise<void> {
    const email = extractEmail(notification)

    if (!email) {
      throw new Error('notification metadata must include an email address for email delivery')
    }

    const textBody = notification.body
    const htmlBody = typeof notification.metadata?.html === 'string'
      ? notification.metadata.html
      : undefined

    await this.provider.send({
      to: email,
      subject: notification.title,
      text: textBody,
      html: htmlBody,
      metadata: notification.metadata,
    })
  }
}
