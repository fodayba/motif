import type { Notification } from '@domain/notifications'
import type { NotificationChannel } from '@domain/notifications'

export type EmailMessage = {
  to: string
  subject: string
  html?: string
  text?: string
  metadata?: Record<string, unknown>
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id?: string }>
}

export type PushMessage = {
  token?: string
  topic?: string
  title: string
  body: string
  data?: Record<string, string>
}

export interface PushProvider {
  send(message: PushMessage): Promise<{ messageId: string }>
}

export interface InAppGateway {
  publish(notification: Notification): Promise<void>
}

export interface NotificationChannelHandler {
  supports(channel: NotificationChannel): boolean
  send(notification: Notification): Promise<void>
}

export type NotificationDispatchAttempt = {
  notificationId: string
  channel: NotificationChannel
  success: boolean
  error?: string
}
