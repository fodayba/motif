import type { ReactNode } from 'react'
import { useModalContext } from './modal-context'
import type { ModalOptions } from './modal-context'

export const useModal = () => {
  const { openModal, closeModal, closeAll } = useModalContext()

  return {
    openModal,
    closeModal,
    closeAll,
  }
}

export const useModalHelpers = () => {
  const { openModal, closeModal } = useModalContext()

  return {
    openConfirmation: (content: ReactNode, options?: ModalOptions) =>
      openModal(content, { ...options, size: options?.size ?? 'sm', dismissible: false }),
    openSheet: (content: ReactNode, options?: ModalOptions) =>
      openModal(content, { ...options, size: options?.size ?? 'lg' }),
    closeModal,
  }
}

export type { ModalOptions }
