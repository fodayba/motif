import type { MouseEvent } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useToastContext } from './toast-context'
import './toast-layer.css'

const ensureContainer = () => {
  if (typeof document === 'undefined') {
    return null
  }

  const existing = document.getElementById('toast-layer')

  if (existing) {
    return existing
  }

  const element = document.createElement('div')
  element.id = 'toast-layer'
  document.body.appendChild(element)
  return element
}

export const ToastLayer = () => {
  const { toasts, dismissToast } = useToastContext()
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = ensureContainer()

    return () => {
      if (containerRef.current && containerRef.current.childElementCount === 0) {
        containerRef.current.remove()
        containerRef.current = null
      }
    }
  }, [])

  const handleDismiss = (id: string) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    dismissToast(id)
  }

  const portalContainer = containerRef.current

  const content = useMemo(() => {
    if (toasts.length === 0) {
      return null
    }

    return (
      <div className="toast-layer">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <div className="toast__content">
              <div className="toast__text">
                <strong className="toast__title">{toast.title}</strong>
                {toast.description ? <p className="toast__description">{toast.description}</p> : null}
              </div>
              {toast.action.label ? (
                <button
                  type="button"
                  className="toast__action"
                  onClick={(event) => {
                    toast.action.onClick()
                    event.stopPropagation()
                  }}
                >
                  {toast.action.label}
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Dismiss"
                className="toast__dismiss"
                onClick={handleDismiss(toast.id)}
              >
                <svg className="toast__dismiss-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3.2 3.2a.75.75 0 0 1 1.06 0L8 6.94l3.74-3.74a.75.75 0 1 1 1.06 1.06L9.06 8l3.74 3.74a.75.75 0 1 1-1.06 1.06L8 9.06l-3.74 3.74a.75.75 0 0 1-1.06-1.06L6.94 8 3.2 4.26a.75.75 0 0 1 0-1.06z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }, [toasts, dismissToast])

  if (!portalContainer || !content) {
    return null
  }

  return createPortal(content, portalContainer)
}
