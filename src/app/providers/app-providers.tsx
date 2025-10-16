import type { PropsWithChildren } from 'react'
import { AccessControlProvider } from './access-control-provider'
import { AuthProvider } from './auth-provider'
import { EnvironmentProvider } from './environment-provider'
import { NotificationCenterProvider } from './notification-provider'
import { OfflineProvider } from './offline-provider'
import { ThemeProvider } from './theme-provider'
import { ToastLayer, ToastProvider } from '@shared/components/feedback'
import { ModalLayer, ModalProvider } from '@shared/components/overlay'

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <EnvironmentProvider>
      <ThemeProvider>
        <OfflineProvider>
          <ModalProvider>
            <ToastProvider>
              <NotificationCenterProvider>
                <AuthProvider>
                  <AccessControlProvider>{children}</AccessControlProvider>
                </AuthProvider>
              </NotificationCenterProvider>
              <ToastLayer />
            </ToastProvider>
            <ModalLayer />
          </ModalProvider>
        </OfflineProvider>
      </ThemeProvider>
    </EnvironmentProvider>
  )
}
