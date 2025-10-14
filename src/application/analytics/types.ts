import type { MetricSnapshot } from '@domain/analytics'
import type { CurrencyCode } from '@domain/shared'

export type MetricInput = {
  metric: string
  value: number
  capturedAt?: Date
  comparedTo?: number | null
  dimensions?: Record<string, string>
}

export type MetricRecord = {
  metric: string
  value: number
  capturedAt: Date
  comparedTo?: number | null
  dimensions?: Record<string, string>
}

export type TrendPoint = {
  timestamp: Date
  value: number
  delta?: number
  percentageChange?: number
}

export type ForecastOptions = {
  horizonDays: number
  sampleSize?: number
  filters?: Record<string, string>
}

export type ForecastPoint = {
  timestamp: Date
  projectedValue: number
  lowerBound: number
  upperBound: number
}

export type FinancialSummary = {
  budgetVariance: number
  committedSpend: number
  actualSpend: number
  earnedValue: number
  costPerformanceIndex?: number
  schedulePerformanceIndex?: number
  cashFlowProjection?: number
  currency: CurrencyCode
  updatedAt: Date
}

export type ProcurementSummary = {
  openRequisitions: number
  openPurchaseOrders: number
  averageCycleTimeDays: number
  expeditingRequests: number
  supplierIssues?: number
  updatedAt: Date
}

export type SafetySummary = {
  totalIncidents: number
  openIncidents: number
  lostTimeIncidents: number
  severityIndex: number
  complianceScore?: number
  updatedAt: Date
}

export type ScheduleSummary = {
  onTrackMilestones: number
  lateMilestones: number
  resourceConflicts: number
  scheduleVarianceDays: number
  forecastCompletionDate?: Date
  updatedAt: Date
}

export type ProjectPulse = {
  projectId: string
  projectName: string
  health: 'green' | 'yellow' | 'red'
  updatedAt: Date
  notes?: string
}

export type ExecutiveDashboard = {
  projectId: string
  generatedAt: Date
  financial?: FinancialSummary
  procurement?: ProcurementSummary
  safety?: SafetySummary
  schedule?: ScheduleSummary
  projectPulse: ProjectPulse[]
  kpis: Array<{
    name: string
    value: number
    target?: number
    trend?: 'up' | 'down' | 'steady'
    units?: string
  }>
  topRisks: Array<{
    category: 'financial' | 'procurement' | 'safety' | 'schedule'
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export const mapSnapshotToRecord = (snapshot: MetricSnapshot): MetricRecord => ({
  metric: snapshot.metric,
  value: snapshot.value,
  capturedAt: snapshot.capturedAt,
  comparedTo: snapshot.comparedTo ?? undefined,
  dimensions: snapshot.dimensions,
})
