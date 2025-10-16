import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import './mobile-drawer.css'

export type MobileDrawerProps = PropsWithChildren<{
  isOpen: boolean
  onClose: () => void
  title?: string
  position?: 'left' | 'right' | 'bottom'
}>

export const MobileDrawer = ({
  children,
  isOpen,
  onClose,
  title,
  position = 'left',
}: MobileDrawerProps) => {
  const handleBackdropClick = () => {
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div className="mobile-drawer-backdrop" onClick={handleBackdropClick} />
      <div className={`mobile-drawer mobile-drawer--${position}`}>
        <div className="mobile-drawer__header">
          {title ? <h2 className="mobile-drawer__title">{title}</h2> : null}
          <button
            type="button"
            className="mobile-drawer__close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>
        <div className="mobile-drawer__content">{children}</div>
      </div>
    </>
  )
}

export const useMobileDrawer = () => {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((prev) => !prev)

  return { isOpen, open, close, toggle }
}
