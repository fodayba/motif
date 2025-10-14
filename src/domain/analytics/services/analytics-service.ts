import { Result } from '../../shared'
import { MetricSnapshot } from '../entities/metric-snapshot'
import type { AnalyticsRepository } from '../repositories/analytics-repository'

export interface CaptureMetricProps {
  metric: string
  value: number
  dimensions?: Record<string, string>
  capturedAt?: Date
  comparedTo?: number | null
}

export class AnalyticsService {
  private readonly repository: AnalyticsRepository

  constructor(repository: AnalyticsRepository) {
    this.repository = repository
  }

  async captureMetric(props: CaptureMetricProps): Promise<Result<MetricSnapshot>> {
    const snapshotResult = MetricSnapshot.create({
      metric: props.metric,
      value: props.value,
      dimensions: props.dimensions,
      capturedAt: props.capturedAt ?? new Date(),
      comparedTo: props.comparedTo ?? null,
    })

    if (!snapshotResult.isSuccess || !snapshotResult.value) {
      return Result.fail(snapshotResult.error ?? 'Failed to capture metric')
    }

    const snapshot = snapshotResult.value
    await this.repository.record(snapshot)

    return Result.ok(snapshot)
  }

  async getLatest(metric: string, filters?: Record<string, string>): Promise<MetricSnapshot | null> {
    return this.repository.findLatest(metric, filters)
  }

  async getTrend(metric: string, from: Date, to: Date, filters?: Record<string, string>): Promise<MetricSnapshot[]> {
    return this.repository.listRange(metric, { from, to, filters })
  }
}
