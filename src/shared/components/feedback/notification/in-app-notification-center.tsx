import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { NotificationSnapshot } from './notification-types'
import './in-app-notification-center.css'

export type NotificationCenterProps = {
  title?: string
  emptyState?: ReactNode
  items: NotificationSnapshot[]
  isLoading?: boolean
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onAction?: (item: NotificationSnapshot) => void
}

const getToneClass = (priority: NotificationSnapshot['priority']) => {
  switch (priority) {
    case 'high':
      return 'notification-item--high'
    case 'low':
      return 'notification-item--low'
    case 'normal':
    default:
      return 'notification-item--normal'
  }
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const formatRelativeTime = (input: Date) => {
  const timestamp = input instanceof Date ? input.getTime() : new Date(input).getTime()

  if (Number.isNaN(timestamp)) {
    return ''
  }

  const diff = Date.now() - timestamp
  const abs = Math.abs(diff)

  if (abs < MINUTE_MS) {
    return 'just now'
  }

  if (abs < HOUR_MS) {
    const minutes = Math.round(abs / MINUTE_MS)
    return `${minutes}m ago`
  }

  if (abs < DAY_MS) {
    const hours = Math.round(abs / HOUR_MS)
    return `${hours}h ago`
  }

  const days = Math.round(abs / DAY_MS)
  return `${days}d ago`
}

const defaultEmpty = (
  <div className="notification-empty">
    <p>No notifications yet. You’re up to speed.</p>
  </div>
)

export const InAppNotificationCenter = ({
  title = 'Notifications',
  emptyState = defaultEmpty,
  items,
  isLoading = false,
  onMarkRead,
  onMarkAllRead,
  onAction,
}: NotificationCenterProps) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items],
  )

  const filtered = useMemo(() => {
    if (activeFilter === 'unread') {
      return items.filter((item) => !item.readAt)
    }

    return items
  }, [items, activeFilter])

  return (
    <div className="notification-center">
      <header className="notification-center__header">
        <div>
          <h2>{title}</h2>
          <p>{items.length} total · {unreadCount} unread</p>
        </div>
        <div className="notification-center__actions">
          <button
            type="button"
            className={`notification-filter ${activeFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`notification-filter ${activeFilter === 'unread' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread
          </button>
          {onMarkAllRead ? (
            <button type="button" className="notification-center__mark-all" onClick={onMarkAllRead}>
              Mark all read
            </button>
          ) : null}
        </div>
      </header>

      <div className="notification-center__list">
        {isLoading ? (
          <div className="notification-center__loading" role="status" aria-live="polite">
            <span className="notification-center__spinner" aria-hidden="true" />
            <p>Checking for updates…</p>
          </div>
        ) : filtered.length === 0 ? (
          emptyState
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`notification-item ${getToneClass(item.priority)} ${item.readAt ? 'is-read' : ''}`}
            >
              {(() => {
                const relativeTime = formatRelativeTime(item.createdAt)
                return (
                  <div className="notification-item__meta">
                    <span className="notification-item__channel">{item.channelLabel}</span>
                    <time dateTime={item.createdAt.toISOString()}>{relativeTime}</time>
                  </div>
                )
              })()}
              <div className="notification-item__body">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.tags.length > 0 ? (
                    <div className="notification-item__tags">
                      {item.tags.map((tag: string) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="notification-item__actions">
                  {onAction && item.actionLabel ? (
                    <button type="button" onClick={() => onAction(item)}>
                      {item.actionLabel}
                    </button>
                  ) : null}
                  {!item.readAt && onMarkRead ? (
                    <button type="button" onClick={() => onMarkRead(item.id)}>
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
