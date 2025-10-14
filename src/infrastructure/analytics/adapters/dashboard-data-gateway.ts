import type {
  AnalyticsDataGateway,
  ExecutiveDashboard,
  FinancialSummary,
  ProcurementSummary,
  SafetySummary,
  ScheduleSummary,
} from '@application/analytics'
import type { AnalyticsDataSource } from '../types'

export class DashboardDataGateway implements AnalyticsDataGateway {
  private readonly source: AnalyticsDataSource

  constructor(source: AnalyticsDataSource) {
    this.source = source
  }

  async fetchFinancialSummary(projectId: string): Promise<FinancialSummary | null> {
    return this.source.fetchFinancialSummary(projectId)
  }

  async fetchProcurementSummary(projectId: string): Promise<ProcurementSummary | null> {
    return this.source.fetchProcurementSummary(projectId)
  }

  async fetchSafetySummary(projectId: string): Promise<SafetySummary | null> {
    return this.source.fetchSafetySummary(projectId)
  }

  async fetchScheduleSummary(projectId: string): Promise<ScheduleSummary | null> {
    return this.source.fetchScheduleSummary(projectId)
  }

  async fetchProjectPulse(_projectId: string): Promise<ExecutiveDashboard['projectPulse']> {
    // Downstream services can extend this gateway to enrich project pulse data.
    return []
  }

  async suggestRisks(_dashboard: Omit<ExecutiveDashboard, 'topRisks'>) {
    // Placeholder for ML/analytics integration; default to empty suggestions.
    return []
  }
}
