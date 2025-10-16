import { useToastContext } from './toast-context'
import type { ToastOptions } from './toast-context'

export const useToast = () => {
  const { showToast, dismissToast, clearToasts } = useToastContext()

  return {
    showToast,
    dismissToast,
    clearToasts,
  }
}

export const useToastHelpers = () => {
  const { showToast } = useToastContext()

  return {
    notifySuccess: (title: string, description?: string) =>
      showToast({ title, description, tone: 'success' }),
    notifyError: (title: string, description?: string) =>
      showToast({ title, description, tone: 'danger', durationMs: 8000 }),
    notifyWarning: (title: string, description?: string) =>
      showToast({ title, description, tone: 'warning' }),
    notifyInfo: (title: string, description?: string) =>
      showToast({ title, description, tone: 'info' }),
  }
}

export type { ToastOptions }
