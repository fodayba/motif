import { useEffect, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import './pull-to-refresh.css'

export type PullToRefreshProps = PropsWithChildren<{
  onRefresh: () => Promise<void>
  threshold?: number
  disabled?: boolean
}>

export const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || startY.current === 0) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      if (distance > 0 && container.scrollTop === 0) {
        setPullDistance(Math.min(distance, threshold * 1.5))
        if (distance > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
      startY.current = 0
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [disabled, isRefreshing, onRefresh, pullDistance, threshold])

  const progress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = progress >= 1

  return (
    <div ref={containerRef} className="pull-to-refresh">
      <div
        className="pull-to-refresh__indicator"
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          opacity: progress,
        }}
      >
        <div
          className={`pull-to-refresh__spinner ${isRefreshing ? 'pull-to-refresh__spinner--active' : ''}`}
          style={{
            transform: `rotate(${progress * 360}deg)`,
          }}
        >
          {isRefreshing ? '⟳' : shouldTrigger ? '↓' : '↓'}
        </div>
        <span className="pull-to-refresh__text">
          {isRefreshing ? 'Refreshing...' : shouldTrigger ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      <div
        className="pull-to-refresh__content"
        style={{
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
