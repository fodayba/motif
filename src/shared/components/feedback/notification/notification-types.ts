export type NotificationPriority = 'low' | 'normal' | 'high'

export type NotificationChannelDisplay = {
  id: string
  label: string
  icon?: string
}

export type NotificationSnapshot = {
  id: string
  title: string
  description: string
  createdAt: Date
  channelId: string
  channelLabel: string
  priority: NotificationPriority
  readAt?: Date
  tags: string[]
  actionLabel?: string
}

export type NotificationDraft = {
  id?: string
  title: string
  description: string
  channelId: string
  channelLabel: string
  priority?: NotificationPriority
  tags?: string[]
  actionLabel?: string
  createdAt?: Date
  readAt?: Date
}

export type NotificationFilter = 'all' | 'unread'

export type NotificationMutations = {
  markRead?: (id: string) => Promise<void>
  markAllRead?: () => Promise<void>
  actOnNotification?: (id: string) => Promise<void>
}
