import type {
  FinancialSummary,
  ProcurementSummary,
  SafetySummary,
  ScheduleSummary,
} from '@application/analytics'
import type { AnalyticsDataSource } from '../types'

type CacheEntry<T> = {
  value: T | null
  expiresAt: number
}

const now = () => Date.now()

export class CachedAnalyticsDataSource implements AnalyticsDataSource {
  private readonly source: AnalyticsDataSource
  private readonly ttlMs: number
  private readonly cache: Map<string, CacheEntry<unknown>> = new Map()

  constructor(source: AnalyticsDataSource, ttlMs = 60_000) {
    this.source = source
    this.ttlMs = ttlMs
  }

  async fetchFinancialSummary(projectId: string): Promise<FinancialSummary | null> {
    return this.getOrLoad(`financial:${projectId}`, () =>
      this.source.fetchFinancialSummary(projectId),
    )
  }

  async fetchProcurementSummary(projectId: string): Promise<ProcurementSummary | null> {
    return this.getOrLoad(`procurement:${projectId}`, () =>
      this.source.fetchProcurementSummary(projectId),
    )
  }

  async fetchSafetySummary(projectId: string): Promise<SafetySummary | null> {
    return this.getOrLoad(`safety:${projectId}`, () =>
      this.source.fetchSafetySummary(projectId),
    )
  }

  async fetchScheduleSummary(projectId: string): Promise<ScheduleSummary | null> {
    return this.getOrLoad(`schedule:${projectId}`, () =>
      this.source.fetchScheduleSummary(projectId),
    )
  }

  private async getOrLoad<T>(key: string, loader: () => Promise<T | null>): Promise<T | null> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined

    if (cached && cached.expiresAt > now()) {
      return cached.value
    }

    const value = await loader()
    this.cache.set(key, {
      value,
      expiresAt: now() + this.ttlMs,
    })

    return value
  }
}
