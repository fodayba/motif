import type {
  ExecutiveDashboard,
  FinancialSummary,
  ProcurementSummary,
  ProjectPulse,
  SafetySummary,
  ScheduleSummary,
} from './types'

export interface AnalyticsDataGateway {
  fetchFinancialSummary(projectId: string): Promise<FinancialSummary | null>
  fetchProcurementSummary(projectId: string): Promise<ProcurementSummary | null>
  fetchSafetySummary(projectId: string): Promise<SafetySummary | null>
  fetchScheduleSummary(projectId: string): Promise<ScheduleSummary | null>
  fetchProjectPulse(projectId: string): Promise<ProjectPulse[]>
  suggestRisks?(dashboard: Omit<ExecutiveDashboard, 'topRisks'>): Promise<
    Array<{
      category: 'financial' | 'procurement' | 'safety' | 'schedule'
      description: string
      severity: 'low' | 'medium' | 'high'
    }>
  >
}
