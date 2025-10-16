export type OfflineCacheRecord<T = unknown> = {
  data: T
  updatedAt: number
  expiresAt?: number | null
  metadata?: Record<string, unknown>
  tags: string[]
}

export type OfflineCacheSetOptions = {
  ttlMs?: number
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface OfflineCache {
  get<T = unknown>(key: string): Promise<OfflineCacheRecord<T> | null>
  set<T = unknown>(key: string, data: T, options?: OfflineCacheSetOptions): Promise<void>
  invalidate(key: string): Promise<void>
  invalidateByTag(tag: string): Promise<void>
  clear(): Promise<void>
}
