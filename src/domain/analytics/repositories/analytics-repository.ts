import type { MetricSnapshot } from '../entities/metric-snapshot'

export interface AnalyticsRepository {
  record(snapshot: MetricSnapshot): Promise<void>
  findLatest(metric: string, filters?: Record<string, string>): Promise<MetricSnapshot | null>
  listRange(metric: string, options: { from: Date; to: Date; filters?: Record<string, string> }): Promise<MetricSnapshot[]>
}
