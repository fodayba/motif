import type { PropsWithChildren, ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { nanoid } from 'nanoid/non-secure'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export type ModalDescriptor = {
  id: string
  content: ReactNode
  size: ModalSize
  onDismiss?: () => void
  dismissible?: boolean
  ariaLabel?: string
}

export type ModalOptions = {
  id?: string
  size?: ModalSize
  onDismiss?: () => void
  dismissible?: boolean
  ariaLabel?: string
}

export type ModalContextValue = {
  modals: ModalDescriptor[]
  openModal: (content: ReactNode, options?: ModalOptions) => string
  closeModal: (id: string) => void
  closeAll: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export const ModalProvider = ({ children }: PropsWithChildren) => {
  const [modals, setModals] = useState<ModalDescriptor[]>([])

  const openModal = useCallback((content: ReactNode, options?: ModalOptions) => {
    const id = options?.id ?? nanoid()
    const descriptor: ModalDescriptor = {
      id,
      content,
      size: options?.size ?? 'md',
      onDismiss: options?.onDismiss,
      dismissible: options?.dismissible ?? true,
      ariaLabel: options?.ariaLabel,
    }

    setModals((current) => [...current.filter((modal) => modal.id !== id), descriptor])
    return id
  }, [])

  const closeModal = useCallback((id: string) => {
    setModals((current) => {
      const modal = current.find((item) => item.id === id)
      modal?.onDismiss?.()
      return current.filter((item) => item.id !== id)
    })
  }, [])

  const closeAll = useCallback(() => {
    setModals((current) => {
      current.forEach((modal) => modal.onDismiss?.())
      return []
    })
  }, [])

  const value = useMemo<ModalContextValue>(() => {
    return {
      modals,
      openModal,
      closeModal,
      closeAll,
    }
  }, [modals, openModal, closeModal, closeAll])

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export const useModalContext = () => {
  const context = useContext(ModalContext)

  if (!context) {
    throw new Error('ModalProvider is missing from the component tree')
  }

  return context
}
