import type {
  FinancialSummary,
  ProcurementSummary,
  SafetySummary,
  ScheduleSummary,
} from '@application/analytics'
import type { AnalyticsDataSource } from '../types'

const resolveFirst = async <T>(factories: Array<() => Promise<T | null>>): Promise<T | null> => {
  for (const factory of factories) {
    try {
      const result = await factory()
      if (result) {
        return result
      }
    } catch {
      // ignore and continue to next source
    }
  }

  return null
}

export class CompositeAnalyticsDataSource implements AnalyticsDataSource {
  private readonly sources: AnalyticsDataSource[]

  constructor(sources: AnalyticsDataSource[]) {
    this.sources = sources
  }

  async fetchFinancialSummary(projectId: string): Promise<FinancialSummary | null> {
    return resolveFirst(
      this.sources.map((source) => () => source.fetchFinancialSummary(projectId)),
    )
  }

  async fetchProcurementSummary(projectId: string): Promise<ProcurementSummary | null> {
    return resolveFirst(
      this.sources.map((source) => () => source.fetchProcurementSummary(projectId)),
    )
  }

  async fetchSafetySummary(projectId: string): Promise<SafetySummary | null> {
    return resolveFirst(this.sources.map((source) => () => source.fetchSafetySummary(projectId)))
  }

  async fetchScheduleSummary(projectId: string): Promise<ScheduleSummary | null> {
    return resolveFirst(
      this.sources.map((source) => () => source.fetchScheduleSummary(projectId)),
    )
  }
}
