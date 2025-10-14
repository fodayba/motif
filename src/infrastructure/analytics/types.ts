import type {
  FinancialSummary,
  ProcurementSummary,
  SafetySummary,
  ScheduleSummary,
} from '@application/analytics'
import type { MetricSnapshot } from '@domain/analytics'

export type DashboardDataSources = {
  financial: FinancialSummary | null
  procurement: ProcurementSummary | null
  safety: SafetySummary | null
  schedule: ScheduleSummary | null
}

export interface AnalyticsDataSource {
  fetchFinancialSummary(projectId: string): Promise<FinancialSummary | null>
  fetchProcurementSummary(projectId: string): Promise<ProcurementSummary | null>
  fetchSafetySummary(projectId: string): Promise<SafetySummary | null>
  fetchScheduleSummary(projectId: string): Promise<ScheduleSummary | null>
}

export interface MetricSnapshotStore {
  save(snapshot: MetricSnapshot): Promise<void>
  findLatest(metric: string, filters?: Record<string, string>): Promise<MetricSnapshot | null>
  listRange(metric: string, options: { from: Date; to: Date; filters?: Record<string, string> }): Promise<MetricSnapshot[]>
}

export interface KPIThresholds {
  metric: string
  target?: number
  warning?: number
  critical?: number
  direction?: 'above' | 'below'
}
