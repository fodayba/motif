import {
  AnalyticsService as DomainAnalyticsService,
  type AnalyticsRepository,
} from '@domain/analytics'
import { Result } from '@domain/shared'
import type { MetricSnapshot } from '@domain/analytics'
import type { AnalyticsDataGateway } from './data-gateway'
import {
  type ExecutiveDashboard,
  type ForecastOptions,
  type ForecastPoint,
  type MetricInput,
  type MetricRecord,
  type TrendPoint,
  mapSnapshotToRecord,
} from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export class AnalyticsService {
  private readonly analytics: DomainAnalyticsService
  private readonly gateway: AnalyticsDataGateway

  constructor(repository: AnalyticsRepository, gateway: AnalyticsDataGateway) {
    this.analytics = new DomainAnalyticsService(repository)
    this.gateway = gateway
  }

  async recordMetricSet(metrics: MetricInput[]): Promise<Result<MetricRecord[]>> {
    if (metrics.length === 0) {
      return Result.fail('metrics cannot be empty')
    }

    const snapshots: MetricSnapshot[] = []

    for (const metric of metrics) {
      const snapshotResult = await this.analytics.captureMetric({
        metric: metric.metric,
        value: metric.value,
        capturedAt: metric.capturedAt,
        comparedTo: metric.comparedTo ?? null,
        dimensions: metric.dimensions,
      })

      if (!snapshotResult.isSuccess || !snapshotResult.value) {
        return Result.fail(snapshotResult.error ?? 'failed to capture metric')
      }

      snapshots.push(snapshotResult.value)
    }

    return Result.ok(snapshots.map(mapSnapshotToRecord))
  }

  async calculateTrend(
    metric: string,
    windowDays: number,
    filters?: Record<string, string>,
  ): Promise<Result<TrendPoint[]>> {
    if (windowDays <= 0) {
      return Result.fail('windowDays must be greater than zero')
    }

    const now = new Date()
    const from = new Date(now.getTime() - windowDays * MS_PER_DAY)
    const snapshots = await this.analytics.getTrend(metric, from, now, filters)

    if (snapshots.length === 0) {
      return Result.ok([])
    }

    const sorted = [...snapshots].sort(
      (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime(),
    )

    const trend: TrendPoint[] = []

    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index]
      const previous = index > 0 ? sorted[index - 1] : undefined
      const delta = previous ? current.value - previous.value : undefined
      const percentageChange = previous && previous.value !== 0
        ? (delta! / previous.value) * 100
        : undefined

      trend.push({
        timestamp: current.capturedAt,
        value: current.value,
        delta,
        percentageChange,
      })
    }

    return Result.ok(trend)
  }

  async forecastMetric(
    metric: string,
    options: ForecastOptions,
  ): Promise<Result<ForecastPoint[]>> {
    if (options.horizonDays <= 0) {
      return Result.fail('horizonDays must be greater than zero')
    }

    const sampleSize = options.sampleSize ?? 6
    if (sampleSize < 2) {
      return Result.fail('sampleSize must be at least 2')
    }

    const now = new Date()
    const from = new Date(now.getTime() - sampleSize * MS_PER_DAY * 2)
    const snapshots = await this.analytics.getTrend(metric, from, now, options.filters)

    if (snapshots.length < 2) {
      return Result.fail('not enough data points to forecast metric')
    }

    const normalized = this.normalizeSnapshots(snapshots.slice(-sampleSize))
    const regression = this.computeLinearRegression(normalized)

    if (!regression) {
      return Result.fail('unable to calculate regression for metric')
    }

    const lastPoint = normalized[normalized.length - 1]
    const variance = this.calculateResidualVariance(normalized, regression)
    const stdDeviation = Math.sqrt(variance)

    const forecast: ForecastPoint[] = []

    for (let day = 1; day <= options.horizonDays; day += 1) {
      const x = lastPoint.x + day
      const projectedValue = regression.intercept + regression.slope * x
      const deviation = stdDeviation * Math.sqrt(day)

      forecast.push({
        timestamp: new Date(lastPoint.timestamp.getTime() + day * MS_PER_DAY),
        projectedValue,
        lowerBound: projectedValue - deviation,
        upperBound: projectedValue + deviation,
      })
    }

    return Result.ok(forecast)
  }

  async generateExecutiveDashboard(projectId: string): Promise<Result<ExecutiveDashboard>> {
    const [financialRaw, procurementRaw, safetyRaw, scheduleRaw, projectPulse] = await Promise.all([
      this.gateway.fetchFinancialSummary(projectId),
      this.gateway.fetchProcurementSummary(projectId),
      this.gateway.fetchSafetySummary(projectId),
      this.gateway.fetchScheduleSummary(projectId),
      this.gateway.fetchProjectPulse(projectId),
    ])

    const financial = financialRaw ?? undefined
    const procurement = procurementRaw ?? undefined
    const safety = safetyRaw ?? undefined
    const schedule = scheduleRaw ?? undefined

    const dashboardBase: Omit<ExecutiveDashboard, 'topRisks'> = {
      projectId,
      generatedAt: new Date(),
      financial,
      procurement,
      safety,
      schedule,
      projectPulse,
      kpis: this.buildKpis(financial, procurement, safety, schedule),
    }

    const topRisks = await this.deriveRisks(dashboardBase)

    return Result.ok({
      ...dashboardBase,
      topRisks,
    })
  }

  async compareAgainstTarget(
    metric: string,
    target: number,
    windowDays: number,
    filters?: Record<string, string>,
  ): Promise<Result<{
    metric: string
    latestValue?: number
    target: number
    variance?: number
    trend?: 'above' | 'on-track' | 'below'
  }>> {
    const trendResult = await this.calculateTrend(metric, windowDays, filters)
    if (!trendResult.isSuccess || !trendResult.value) {
      return Result.fail(trendResult.error ?? 'failed to calculate trend')
    }

    const points = trendResult.value
    if (points.length === 0) {
      return Result.ok({ metric, target })
    }

    const latest = points[points.length - 1]
    const variance = latest.value - target
    let trend: 'above' | 'on-track' | 'below' = 'on-track'

    if (variance > target * 0.05) {
      trend = 'above'
    } else if (variance < target * -0.05) {
      trend = 'below'
    }

    return Result.ok({
      metric,
      latestValue: latest.value,
      target,
      variance,
      trend,
    })
  }

  private normalizeSnapshots(snapshots: MetricSnapshot[]): Array<{
    x: number
    y: number
    timestamp: Date
  }> {
    const sorted = [...snapshots].sort(
      (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime(),
    )
    const baseline = sorted[0]?.capturedAt.getTime() ?? Date.now()

    return sorted.map((snapshot) => ({
      x: (snapshot.capturedAt.getTime() - baseline) / MS_PER_DAY,
      y: snapshot.value,
      timestamp: snapshot.capturedAt,
    }))
  }

  private computeLinearRegression(points: Array<{ x: number; y: number }>):
  | { slope: number; intercept: number }
  | null {
    const n = points.length
    if (n < 2) {
      return null
    }

    const sumX = points.reduce((acc, point) => acc + point.x, 0)
    const sumY = points.reduce((acc, point) => acc + point.y, 0)
    const sumXY = points.reduce((acc, point) => acc + point.x * point.y, 0)
    const sumX2 = points.reduce((acc, point) => acc + point.x * point.x, 0)

    const denominator = n * sumX2 - sumX * sumX
    if (denominator === 0) {
      return null
    }

    const slope = (n * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  private calculateResidualVariance(
    points: Array<{ x: number; y: number }>,
    regression: { slope: number; intercept: number },
  ): number {
    if (points.length <= 2) {
      return 0
    }

    const residuals = points.map((point) => {
      const predicted = regression.intercept + regression.slope * point.x
      return point.y - predicted
    })

    const sumSquares = residuals.reduce((acc, value) => acc + value * value, 0)
    return sumSquares / (points.length - 2)
  }

  private buildKpis(
    financial?: ExecutiveDashboard['financial'],
    procurement?: ExecutiveDashboard['procurement'],
    safety?: ExecutiveDashboard['safety'],
    schedule?: ExecutiveDashboard['schedule'],
  ): ExecutiveDashboard['kpis'] {
    const kpis: ExecutiveDashboard['kpis'] = []

    if (financial) {
      kpis.push({
        name: 'Budget Variance',
        value: financial.budgetVariance,
        target: 0,
        trend: financial.budgetVariance <= 0 ? 'steady' : 'up',
        units: financial.currency,
      })

      if (financial.costPerformanceIndex !== undefined) {
        kpis.push({
          name: 'Cost Performance Index',
          value: financial.costPerformanceIndex,
          target: 1,
          trend: financial.costPerformanceIndex >= 1 ? 'up' : 'down',
        })
      }
    }

    if (procurement) {
      kpis.push({
        name: 'Procurement Cycle Time',
        value: procurement.averageCycleTimeDays,
        target: 10,
        trend: procurement.averageCycleTimeDays <= 10 ? 'steady' : 'up',
        units: 'days',
      })
    }

    if (safety) {
      kpis.push({
        name: 'Safety Severity Index',
        value: safety.severityIndex,
        target: 1,
        trend: safety.severityIndex <= 1 ? 'steady' : 'up',
      })
    }

    if (schedule) {
      kpis.push({
        name: 'Schedule Variance',
        value: schedule.scheduleVarianceDays,
        target: 0,
        trend: schedule.scheduleVarianceDays <= 0 ? 'steady' : 'up',
        units: 'days',
      })
    }

    return kpis
  }

  private async deriveRisks(
    dashboard: Omit<ExecutiveDashboard, 'topRisks'>,
  ): Promise<ExecutiveDashboard['topRisks']> {
    if (this.gateway.suggestRisks) {
      const suggestions = await this.gateway.suggestRisks(dashboard)
      if (suggestions.length > 0) {
        return suggestions
      }
    }

    const risks: ExecutiveDashboard['topRisks'] = []

    const { financial, procurement, safety, schedule } = dashboard

    if (financial && financial.budgetVariance > 0) {
      risks.push({
        category: 'financial',
        description: `Budget variance of ${financial.budgetVariance.toFixed(2)} ${financial.currency} over baseline`,
        severity: financial.budgetVariance > financial.actualSpend * 0.05 ? 'high' : 'medium',
      })
    }

    if (procurement && procurement.averageCycleTimeDays > 12) {
      risks.push({
        category: 'procurement',
        description: 'Procurement cycle times exceed thresholds, review bottlenecks',
        severity: procurement.averageCycleTimeDays > 18 ? 'high' : 'medium',
      })
    }

    if (safety && safety.severityIndex > 1) {
      risks.push({
        category: 'safety',
        description: 'Elevated safety severity index, ensure corrective actions close on time',
        severity: safety.severityIndex > 2 ? 'high' : 'medium',
      })
    }

    if (schedule && schedule.lateMilestones > 0) {
      risks.push({
        category: 'schedule',
        description: `${schedule.lateMilestones} milestones behind schedule`,
        severity: schedule.lateMilestones > 3 ? 'high' : 'medium',
      })
    }

    return risks.slice(0, 4)
  }
}
