import { useEffect, useRef, useState } from 'react'

type SwipeDirection = 'left' | 'right' | 'up' | 'down'

type SwipeHandlers = {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipe?: (direction: SwipeDirection) => void
}

type SwipeOptions = {
  threshold?: number // Minimum distance in pixels to register as a swipe
  preventDefaultTouchmoveEvent?: boolean
}

/**
 * Hook to handle swipe gestures on touch devices
 */
export const useSwipe = (
  handlers: SwipeHandlers,
  options: SwipeOptions = {},
): React.RefObject<HTMLElement> => {
  const { threshold = 50, preventDefaultTouchmoveEvent = false } = options
  const elementRef = useRef<HTMLElement>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      setTouchStart({ x: touch.clientX, y: touch.clientY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX < threshold && absDeltaY < threshold) {
        setTouchStart(null)
        return
      }

      let direction: SwipeDirection

      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? 'right' : 'left'
        if (direction === 'left' && handlers.onSwipeLeft) {
          handlers.onSwipeLeft()
        } else if (direction === 'right' && handlers.onSwipeRight) {
          handlers.onSwipeRight()
        }
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
        if (direction === 'up' && handlers.onSwipeUp) {
          handlers.onSwipeUp()
        } else if (direction === 'down' && handlers.onSwipeDown) {
          handlers.onSwipeDown()
        }
      }

      if (handlers.onSwipe) {
        handlers.onSwipe(direction)
      }

      setTouchStart(null)
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [touchStart, handlers, threshold, preventDefaultTouchmoveEvent])

  return elementRef as React.RefObject<HTMLElement>
}

/**
 * Hook to handle long press gestures
 */
export const useLongPress = (
  callback: () => void,
  options: { delay?: number } = {},
): {
  onMouseDown: () => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
} => {
  const { delay = 500 } = options
  const timeoutRef = useRef<number | null>(null)

  const start = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(callback, delay)
  }

  const cancel = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
  }
}

/**
 * Hook to detect pinch zoom gestures
 */
export const usePinchZoom = (
  onZoom: (scale: number) => void,
): React.RefObject<HTMLElement> => {
  const elementRef = useRef<HTMLElement>(null)
  const initialDistanceRef = useRef<number | null>(null)
  const currentScaleRef = useRef<number>(1)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const getDistance = (touches: TouchList) => {
      const touch1 = touches[0]
      const touch2 = touches[1]
      const dx = touch2.clientX - touch1.clientX
      const dy = touch2.clientY - touch1.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        initialDistanceRef.current = getDistance(e.touches)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistanceRef.current) {
        e.preventDefault()
        const currentDistance = getDistance(e.touches)
        const scale = currentDistance / initialDistanceRef.current
        currentScaleRef.current = scale
        onZoom(scale)
      }
    }

    const handleTouchEnd = () => {
      initialDistanceRef.current = null
      currentScaleRef.current = 1
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onZoom])

  return elementRef as React.RefObject<HTMLElement>
}
