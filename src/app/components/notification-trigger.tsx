import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import { useNotificationCenter } from '@app/providers/notification-provider'
import './notification-trigger.css'

export const NotificationTrigger = () => {
  const { unreadCount, toggleCenter, isCenterOpen, isHydrating } = useNotificationCenter()

  const badgeLabel = useMemo(() => {
    if (unreadCount <= 0) {
      return ''
    }

    if (unreadCount > 99) {
      return '99+'
    }

    return String(unreadCount)
  }, [unreadCount])

  const showBadge = isHydrating || unreadCount > 0
  const badgeClassName = [
    'notification-trigger__badge',
    isCenterOpen ? 'is-active' : '',
    isHydrating && unreadCount === 0 ? 'is-syncing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={`notification-trigger ${isCenterOpen ? 'is-open' : ''}`}
      aria-expanded={isCenterOpen}
      aria-label="Open notification center"
      title="Notifications"
      onClick={toggleCenter}
    >
      <Bell className="notification-trigger__icon" size={20} strokeWidth={1.5} />
      {showBadge ? (
        <span className={badgeClassName} aria-live="polite" aria-atomic="true">
          {badgeLabel}
        </span>
      ) : null}
    </button>
  )
}
