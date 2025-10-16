import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  OfflineSyncService,
  type HydrateResourceOptions,
  type HydratedResource,
  type OfflineMutationHandler,
  type OfflineMutationRequest,
  type OfflineResourceConfig,
  type OfflineSyncStatus,
} from '@application/offline/offline-sync-service'
import type { OfflineCacheRecord } from '@infrastructure/persistence/offline'

export type OfflineSyncContextValue = {
  status: OfflineSyncStatus
  registerResource: <T>(config: OfflineResourceConfig<T>) => {
    hydrate: (options?: HydrateResourceOptions) => Promise<HydratedResource<T>>
    getCached: () => Promise<OfflineCacheRecord<T> | null>
    invalidate: () => Promise<void>
  }
  registerMutationHandler: (channel: string, handler: OfflineMutationHandler) => () => void
  queueMutation: (request: OfflineMutationRequest) => Promise<void>
  hydrateResource: <T>(key: string, options?: HydrateResourceOptions) => Promise<HydratedResource<T>>
}

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null)

export const OfflineProvider = ({ children }: PropsWithChildren) => {
  const [service] = useState(() => new OfflineSyncService())
  const [status, setStatus] = useState<OfflineSyncStatus>(() => service.getStatus())

  useEffect(() => service.subscribe(setStatus), [service])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleOnline = () => service.handleNetworkStatusChange(true)
    const handleOffline = () => service.handleNetworkStatusChange(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [service])

  const value = useMemo<OfflineSyncContextValue>(() => {
    return {
      status,
      registerResource: <T,>(config: OfflineResourceConfig<T>) => service.registerResource(config),
      registerMutationHandler: (channel: string, handler: OfflineMutationHandler) =>
        service.registerMutationHandler(channel, handler),
      queueMutation: (request: OfflineMutationRequest) => service.queueMutation(request),
      hydrateResource: <T,>(key: string, options?: HydrateResourceOptions) =>
        service.hydrateResource<T>(key, options),
    }
  }, [service, status])

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>
}

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext)

  if (!context) {
    throw new Error('OfflineProvider is missing from the component tree')
  }

  return context
}

export const useOfflineStatus = () => {
  return useOfflineSync().status
}
