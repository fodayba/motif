import type { PropsWithChildren } from 'react'
import { AccessControlProvider } from './access-control-provider'
import { AuthProvider } from './auth-provider'
import { EnvironmentProvider } from './environment-provider'
import { ThemeProvider } from './theme-provider'

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <EnvironmentProvider>
      <ThemeProvider>
        <AuthProvider>
          <AccessControlProvider>{children}</AccessControlProvider>
        </AuthProvider>
      </ThemeProvider>
    </EnvironmentProvider>
  )
}
