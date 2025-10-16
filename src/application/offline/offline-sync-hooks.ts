import { useCallback, useMemo } from 'react'
import type { HydrateResourceOptions, HydratedResource, OfflineResourceConfig } from './offline-sync-service'
import { useOfflineSync } from '@app/providers/offline-provider'

export const useOfflineResource = <T,>(config: OfflineResourceConfig<T>) => {
  const { registerResource } = useOfflineSync()

  const resource = useMemo(() => registerResource(config), [registerResource, config])

  const hydrate = useCallback(
    (options?: HydrateResourceOptions) => resource.hydrate(options),
    [resource],
  )

  const getCached = useCallback(() => resource.getCached(), [resource])

  return {
    hydrate,
    getCached,
    invalidate: resource.invalidate,
  }
}

export const useHydratedResource = <T,>(
  key: string,
  hydrateFn: () => Promise<T>,
  options?: HydrateResourceOptions,
): Promise<HydratedResource<T>> => {
  const { hydrateResource } = useOfflineSync()
  return hydrateResource<T>(key, options ?? { force: false }).catch(async (error) => {
    if (error instanceof Error && error.message.includes('not registered')) {
      const resource: OfflineResourceConfig<T> = {
        key,
        fetcher: hydrateFn,
      }

      const registered = useOfflineSync().registerResource(resource)
      return registered.hydrate(options)
    }

    throw error
  })
}
