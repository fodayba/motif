import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid/non-secure'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export type ToastOptions = {
  id?: string
  title?: string
  description?: string
  tone?: ToastTone
  durationMs?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export type Toast = Required<ToastOptions>

const DEFAULT_DURATION_MS = 6000

export type ToastContextValue = {
  toasts: Toast[]
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const buildToast = (options: ToastOptions): Toast => {
  return {
    id: options.id ?? nanoid(),
    title: options.title ?? 'Notification',
    description: options.description ?? '',
    tone: options.tone ?? 'info',
    durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
    action: options.action ?? { label: '', onClick: () => {} },
  }
}

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<Record<string, number>>({})

  const scheduleDismiss = useCallback((toast: Toast) => {
    if (!toast.durationMs || toast.durationMs === Infinity) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const timeout = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id))
      delete timeoutsRef.current[toast.id]
    }, toast.durationMs)

    timeoutsRef.current[toast.id] = timeout
  }, [])

  const clearTimeoutForToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current[id]
    if (timeout) {
      if (typeof window !== 'undefined') {
        window.clearTimeout(timeout)
      }
      delete timeoutsRef.current[id]
    }
  }, [])

  const showToast = useCallback((options: ToastOptions) => {
    const toast = buildToast(options)

    setToasts((current) => {
      const filtered = current.filter((item) => item.id !== toast.id)
      return [...filtered, toast]
    })

    scheduleDismiss(toast)

    return toast.id
  }, [scheduleDismiss])

  const dismissToast = useCallback((id: string) => {
    clearTimeoutForToast(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [clearTimeoutForToast])

  const clearToasts = useCallback(() => {
    if (typeof window !== 'undefined') {
      Object.values(timeoutsRef.current).forEach((timeout) => window.clearTimeout(timeout))
    }
    timeoutsRef.current = {}
    setToasts([])
  }, [])

  const value = useMemo<ToastContextValue>(() => {
    return {
      toasts,
      showToast,
      dismissToast,
      clearToasts,
    }
  }, [toasts, showToast, dismissToast, clearToasts])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export const useToastContext = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('ToastProvider is missing from the component tree')
  }

  return context
}
