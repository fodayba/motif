import type { PropsWithChildren } from 'react'
import { EnvironmentContext, environment } from '@shared/config/environment'

export const EnvironmentProvider = ({ children }: PropsWithChildren) => {
  return (
    <EnvironmentContext.Provider value={environment}>
      {children}
    </EnvironmentContext.Provider>
  )
}
