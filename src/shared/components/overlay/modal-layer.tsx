import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ModalDescriptor } from './modal-context'
import { useModalContext } from './modal-context'
import './modal-layer.css'

const ensureContainer = () => {
  if (typeof document === 'undefined') {
    return null
  }

  const existing = document.getElementById('modal-layer')
  if (existing) {
    return existing
  }

  const element = document.createElement('div')
  element.id = 'modal-layer'
  document.body.appendChild(element)
  return element
}

const preventScroll = () => {
  if (typeof document === 'undefined') {
    return
  }

  const { body } = document
  const previous = body.style.overflow
  body.style.overflow = 'hidden'

  return () => {
    body.style.overflow = previous
  }
}

const sizeClass = (size: ModalDescriptor['size']) => {
  switch (size) {
    case 'sm':
      return 'modal__dialog--sm'
    case 'lg':
      return 'modal__dialog--lg'
    case 'xl':
      return 'modal__dialog--xl'
    case 'md':
    default:
      return 'modal__dialog--md'
  }
}

export const ModalLayer = () => {
  const { modals, closeModal } = useModalContext()
  const containerRef = useRef<HTMLElement | null>(null)
  const restoreScrollRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    containerRef.current = ensureContainer()

    return () => {
      if (containerRef.current && containerRef.current.childElementCount === 0) {
        containerRef.current.remove()
        containerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (modals.length === 0) {
      restoreScrollRef.current?.()
      restoreScrollRef.current = null
      return
    }

    if (!restoreScrollRef.current) {
      restoreScrollRef.current = preventScroll() ?? null
    }

    return () => {
      restoreScrollRef.current?.()
      restoreScrollRef.current = null
    }
  }, [modals.length])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modals.length > 0) {
        const topModal = modals[modals.length - 1]
        if (topModal.dismissible !== false) {
          closeModal(topModal.id)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [modals, closeModal])

  const handleBackdropClick = (modal: ModalDescriptor) => {
    if (modal.dismissible === false) {
      return
    }

    closeModal(modal.id)
  }

  const portalContainer = containerRef.current

  const content = useMemo(() => {
    if (modals.length === 0) {
      return null
    }

    return (
      <div className="modal-layer">
        {modals.map((modal) => (
          <div key={modal.id} className="modal" role="presentation">
            <div
              className="modal__backdrop"
              aria-hidden="true"
              onClick={() => handleBackdropClick(modal)}
            />
            <div
              className={`modal__dialog ${sizeClass(modal.size)}`}
              role="dialog"
              aria-modal="true"
              aria-label={modal.ariaLabel}
            >
              <div className="modal__content">{modal.content}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }, [modals])

  if (!portalContainer || !content) {
    return null
  }

  return createPortal(content, portalContainer)
}
