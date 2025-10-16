import {
  IndexedDbOfflineCache,
  IndexedDbOfflineMutationQueue,
  type OfflineCache,
  type OfflineCacheRecord,
  type OfflineCacheSetOptions,
  type OfflineMutation,
  type OfflineMutationQueue,
} from '@infrastructure/persistence/offline'

export type OfflineResourceConfig<T> = {
  key: string
  fetcher: () => Promise<T>
  cacheOptions?: OfflineCacheSetOptions
}

export type HydrateResourceOptions = {
  force?: boolean
}

export type HydratedResource<T> = {
  data: T | undefined
  fromCache: boolean
  isStale: boolean
  updatedAt: number | null
}

export type OfflineMutationRequest = {
  channel: string
  payload: unknown
  headers?: Record<string, string>
  metadata?: Record<string, unknown>
}

export type OfflineMutationHandler = (mutation: OfflineMutation) => Promise<void>

export type OfflineSyncStatus = {
  isOnline: boolean
  queueSize: number
  lastSyncAt: number | null
}

const defaultNow = () => Date.now()

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const isNavigatorOnline = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine

export class OfflineSyncService {
  private readonly cache: OfflineCache
  private readonly queue: OfflineMutationQueue
  private readonly now: () => number
  private readonly resources = new Map<string, OfflineResourceConfig<unknown>>()
  private readonly mutationHandlers = new Map<string, OfflineMutationHandler>()
  private readonly subscribers = new Set<(status: OfflineSyncStatus) => void>()
  private status: OfflineSyncStatus = {
    isOnline: isNavigatorOnline(),
    queueSize: 0,
    lastSyncAt: null,
  }

  constructor(params?: {
    cache?: OfflineCache
    queue?: OfflineMutationQueue
    now?: () => number
  }) {
    this.cache = params?.cache ?? new IndexedDbOfflineCache()
    this.queue = params?.queue ?? new IndexedDbOfflineMutationQueue()
    this.now = params?.now ?? defaultNow
  }

  getStatus() {
    return this.status
  }

  subscribe(listener: (status: OfflineSyncStatus) => void) {
    this.subscribers.add(listener)
    listener(this.status)

    return () => {
      this.subscribers.delete(listener)
    }
  }

  registerResource<T>(config: OfflineResourceConfig<T>) {
    this.resources.set(config.key, config as OfflineResourceConfig<unknown>)

    return {
      hydrate: (options?: HydrateResourceOptions) => this.hydrateResource<T>(config.key, options),
      getCached: () => this.getCachedResource<T>(config.key),
      invalidate: () => this.cache.invalidate(config.key),
    }
  }

  registerMutationHandler(channel: string, handler: OfflineMutationHandler) {
    this.mutationHandlers.set(channel, handler)

    return () => {
      this.mutationHandlers.delete(channel)
    }
  }

  async hydrateResource<T>(key: string, options?: HydrateResourceOptions): Promise<HydratedResource<T>> {
    const resource = this.resources.get(key) as OfflineResourceConfig<T> | undefined

    if (!resource) {
      throw new Error(`Offline resource with key "${key}" is not registered`)
    }

    const cached = options?.force ? null : await this.getCachedResource<T>(key)

    const needsRefresh =
      options?.force ||
      !cached ||
      (typeof cached.expiresAt === 'number' && cached.expiresAt <= this.now())

    if (!needsRefresh && cached) {
      return {
        data: cached.data,
        fromCache: true,
        isStale: false,
        updatedAt: cached.updatedAt,
      }
    }

    if (!isNavigatorOnline()) {
      return {
        data: cached?.data,
        fromCache: true,
        isStale: true,
        updatedAt: cached?.updatedAt ?? null,
      }
    }

    try {
      const data = await resource.fetcher()
      await this.cache.set(key, data, resource.cacheOptions)
      this.updateStatus({ lastSyncAt: this.now() })

      return {
        data,
        fromCache: false,
        isStale: false,
        updatedAt: this.now(),
      }
    } catch (error) {
      if (cached) {
        return {
          data: cached.data,
          fromCache: true,
          isStale: true,
          updatedAt: cached.updatedAt,
        }
      }

      throw error
    }
  }

  async getCachedResource<T>(key: string): Promise<OfflineCacheRecord<T> | null> {
    return this.cache.get<T>(key)
  }

  async queueMutation(request: OfflineMutationRequest) {
    const mutation: OfflineMutation = {
      id: generateId(),
      channel: request.channel,
      payload: request.payload,
      headers: request.headers,
      metadata: request.metadata,
      createdAt: this.now(),
      attempts: 0,
    }

    await this.queue.enqueue(mutation)
    await this.refreshQueueSize()

    if (isNavigatorOnline()) {
      await this.flushMutations(request.channel)
    }
  }

  async flushMutations(targetChannel?: string) {
    const mutations = await this.queue.peekAll()
    const pending = targetChannel
      ? mutations.filter((mutation) => mutation.channel === targetChannel)
      : mutations

    if (pending.length === 0) {
      return
    }

    let processedAtLeastOne = false

    for (const mutation of pending) {
      const handler = this.mutationHandlers.get(mutation.channel)

      if (!handler) {
        // no handler registered yet, skip but keep queued
        continue
      }

      try {
        await handler(mutation)
        await this.queue.remove(mutation.id)
        processedAtLeastOne = true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown offline sync error'
        const updated: OfflineMutation = {
          ...mutation,
          attempts: mutation.attempts + 1,
          lastError: message,
        }

        await this.queue.update(updated)
      }
    }

    if (processedAtLeastOne) {
      this.updateStatus({ lastSyncAt: this.now() })
    }

    await this.refreshQueueSize()
  }

  async clearCache() {
    await this.cache.clear()
  }

  async clearMutations(channel?: string) {
    if (channel) {
      await this.queue.clearChannel(channel)
    } else {
      const mutations = await this.queue.peekAll()
      await Promise.all(mutations.map((mutation) => this.queue.remove(mutation.id)))
    }

    await this.refreshQueueSize()
  }

  handleNetworkStatusChange(isOnline: boolean) {
    this.updateStatus({ isOnline })
    if (isOnline) {
      void this.flushMutations()
    }
  }

  private updateStatus(patch: Partial<OfflineSyncStatus>) {
    this.status = {
      ...this.status,
      ...patch,
    }

    for (const listener of this.subscribers) {
      listener(this.status)
    }
  }

  private async refreshQueueSize() {
    const size = await this.queue.size()
    this.updateStatus({ queueSize: size })
  }
}
