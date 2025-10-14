import type { MetricSnapshot } from '@domain/analytics'
import type { AnalyticsRepository } from '@domain/analytics'
import type { MetricSnapshotStore } from '../types'

export class MetricSnapshotStoreAdapter implements MetricSnapshotStore {
  private readonly repository: AnalyticsRepository

  constructor(repository: AnalyticsRepository) {
    this.repository = repository
  }

  async save(snapshot: MetricSnapshot): Promise<void> {
    await this.repository.record(snapshot)
  }

  async findLatest(metric: string, filters?: Record<string, string>): Promise<MetricSnapshot | null> {
    return this.repository.findLatest(metric, filters)
  }

  async listRange(
    metric: string,
    options: { from: Date; to: Date; filters?: Record<string, string> },
  ): Promise<MetricSnapshot[]> {
    return this.repository.listRange(metric, options)
  }
}
