import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './dropdown-menu.css'

type DropdownMenuProps = {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}

export const DropdownMenu = ({ trigger, children, align = 'right' }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="dropdown-menu" ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </button>
      {isOpen && (
        <div className={`dropdown-menu__content dropdown-menu__content--${align}`}>
          {children}
        </div>
      )}
    </div>
  )
}

type DropdownMenuItemProps = {
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger'
}

export const DropdownMenuItem = ({ icon, children, onClick, variant = 'default' }: DropdownMenuItemProps) => {
  return (
    <button
      type="button"
      className={`dropdown-menu__item dropdown-menu__item--${variant}`}
      onClick={onClick}
    >
      {icon && <span className="dropdown-menu__item-icon">{icon}</span>}
      <span className="dropdown-menu__item-label">{children}</span>
    </button>
  )
}

export const DropdownMenuSeparator = () => {
  return <div className="dropdown-menu__separator" />
}
