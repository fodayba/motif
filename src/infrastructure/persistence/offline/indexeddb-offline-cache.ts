import { indexedDbSupported, STORE, withStore } from './indexeddb-helpers'
import type { OfflineCache, OfflineCacheRecord, OfflineCacheSetOptions } from './offline-cache'

type CacheEntry = {
  key: string
  data: unknown
  updatedAt: number
  expiresAt?: number | null
  metadata?: Record<string, unknown>
  tags: string[]
}

class InMemoryOfflineCache implements OfflineCache {
  private readonly store = new Map<string, CacheEntry>()

  async get<T = unknown>(key: string): Promise<OfflineCacheRecord<T> | null> {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    if (this.isExpired(entry)) {
      this.store.delete(key)
      return null
    }

    return this.toRecord<T>(entry)
  }

  async set<T = unknown>(key: string, data: T, options?: OfflineCacheSetOptions): Promise<void> {
    const now = Date.now()
    const entry: CacheEntry = {
      key,
      data,
      updatedAt: now,
      expiresAt: options?.ttlMs ? now + options.ttlMs : null,
      metadata: options?.metadata,
      tags: options?.tags ?? [],
    }

    this.store.set(key, entry)
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key)
  }

  async invalidateByTag(tag: string): Promise<void> {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key)
      }
    }
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  private isExpired(entry: CacheEntry) {
    return typeof entry.expiresAt === 'number' && entry.expiresAt <= Date.now()
  }

  private toRecord<T>(entry: CacheEntry): OfflineCacheRecord<T> {
    return {
      data: entry.data as T,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
      metadata: entry.metadata,
      tags: entry.tags,
    }
  }
}

export class IndexedDbOfflineCache implements OfflineCache {
  private readonly fallback = new InMemoryOfflineCache()

  async get<T = unknown>(key: string): Promise<OfflineCacheRecord<T> | null> {
    if (!indexedDbSupported()) {
      return this.fallback.get<T>(key)
    }

    try {
      const entry = await withStore<CacheEntry | undefined>(STORE.CACHE, 'readonly', (store) => {
        return new Promise<CacheEntry | undefined>((resolve, reject) => {
          const request = store.get(key)
          request.onsuccess = () => resolve(request.result as CacheEntry | undefined)
          request.onerror = () => reject(request.error ?? new Error('Failed to read cache entry'))
        })
      })

      if (!entry) {
        return null
      }

      if (this.isExpired(entry)) {
        await this.invalidate(key)
        return null
      }

      return this.toRecord<T>(entry)
    } catch (error) {
      console.warn('[offline-cache] Falling back to memory cache', error)
      return this.fallback.get<T>(key)
    }
  }

  async set<T = unknown>(key: string, data: T, options?: OfflineCacheSetOptions): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.set(key, data, options)
      return
    }

    const now = Date.now()
    const entry: CacheEntry = {
      key,
      data,
      updatedAt: now,
      expiresAt: options?.ttlMs ? now + options.ttlMs : null,
      metadata: options?.metadata,
      tags: options?.tags ?? [],
    }

    try {
      await withStore<void>(STORE.CACHE, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(entry)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error ?? new Error('Failed to store cache entry'))
        })
      })
    } catch (error) {
      console.warn('[offline-cache] Failed to persist entry, using memory cache', error)
      await this.fallback.set(key, data, options)
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.invalidate(key)
      return
    }

    try {
      await withStore<void>(STORE.CACHE, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(key)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error ?? new Error('Failed to delete cache entry'))
        })
      })
    } catch (error) {
      console.warn('[offline-cache] Failed to delete entry, falling back to memory cache', error)
      await this.fallback.invalidate(key)
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.invalidateByTag(tag)
      return
    }

    try {
      const entries = await withStore<CacheEntry[]>(STORE.CACHE, 'readonly', (store) => {
        return new Promise<CacheEntry[]>((resolve, reject) => {
          const request = store.getAll()
          request.onsuccess = () => resolve((request.result as CacheEntry[]) ?? [])
          request.onerror = () => reject(request.error ?? new Error('Failed to list cache entries'))
        })
      })

      const taggedKeys = entries.filter((entry) => entry.tags.includes(tag)).map((entry) => entry.key)

      if (taggedKeys.length === 0) {
        return
      }

      await withStore<void>(STORE.CACHE, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          let remaining = taggedKeys.length
          if (remaining === 0) {
            resolve()
            return
          }

          taggedKeys.forEach((key) => {
            const request = store.delete(key)
            request.onerror = () => reject(request.error ?? new Error('Failed to delete cache entry by tag'))
            request.onsuccess = () => {
              remaining -= 1
              if (remaining === 0) {
                resolve()
              }
            }
          })
        })
      })
    } catch (error) {
      console.warn('[offline-cache] Failed to invalidate by tag, using memory cache', error)
      await this.fallback.invalidateByTag(tag)
    }
  }

  async clear(): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.clear()
      return
    }

    try {
      await withStore<void>(STORE.CACHE, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.clear()
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error ?? new Error('Failed to clear cache store'))
        })
      })
    } catch (error) {
      console.warn('[offline-cache] Failed to clear cache store, using memory cache', error)
      await this.fallback.clear()
    }
  }

  private isExpired(entry: CacheEntry) {
    return typeof entry.expiresAt === 'number' && entry.expiresAt <= Date.now()
  }

  private toRecord<T>(entry: CacheEntry): OfflineCacheRecord<T> {
    return {
      data: entry.data as T,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
      metadata: entry.metadata,
      tags: entry.tags,
    }
  }
}
