import type {
  FinancialSummary,
  ProcurementSummary,
  SafetySummary,
  ScheduleSummary,
} from '@application/analytics'
import type { CurrencyCode } from '@domain/shared'
import type { MetricSnapshot } from '@domain/analytics'
import type { AnalyticsDataSource, MetricSnapshotStore } from '../types'

const FINANCIAL_METRICS = {
  budgetVariance: 'finance.budgetVariance',
  committedSpend: 'finance.committedSpend',
  actualSpend: 'finance.actualSpend',
  earnedValue: 'finance.earnedValue',
  costPerformanceIndex: 'finance.costPerformanceIndex',
  schedulePerformanceIndex: 'finance.schedulePerformanceIndex',
  cashFlowProjection: 'finance.cashFlowProjection',
} as const

const PROCUREMENT_METRICS = {
  openRequisitions: 'procurement.openRequisitions',
  openPurchaseOrders: 'procurement.openPurchaseOrders',
  averageCycleTimeDays: 'procurement.averageCycleTimeDays',
  expeditingRequests: 'procurement.expeditingRequests',
  supplierIssues: 'procurement.supplierIssues',
} as const

const SAFETY_METRICS = {
  totalIncidents: 'safety.totalIncidents',
  openIncidents: 'safety.openIncidents',
  lostTimeIncidents: 'safety.lostTimeIncidents',
  severityIndex: 'safety.severityIndex',
  complianceScore: 'safety.complianceScore',
} as const

const SCHEDULE_METRICS = {
  onTrackMilestones: 'schedule.onTrackMilestones',
  lateMilestones: 'schedule.lateMilestones',
  resourceConflicts: 'schedule.resourceConflicts',
  scheduleVarianceDays: 'schedule.scheduleVarianceDays',
  forecastCompletionDate: 'schedule.forecastCompletionDate',
} as const

type MetricMapping = Record<string, string>

type SnapshotRecord<TMapping extends MetricMapping> = {
  [Key in keyof TMapping]: MetricSnapshot | null
}

const toSnapshotArray = <TMapping extends MetricMapping>(
  mapping: SnapshotRecord<TMapping>,
): MetricSnapshot[] =>
  Object.values(mapping).filter((value): value is MetricSnapshot => value !== null)

export class MetricDrivenAnalyticsDataSource implements AnalyticsDataSource {
  private readonly store: MetricSnapshotStore
  private readonly defaultCurrency: CurrencyCode

  constructor(store: MetricSnapshotStore, defaultCurrency: CurrencyCode = 'USD') {
    this.store = store
    this.defaultCurrency = defaultCurrency
  }

  async fetchFinancialSummary(projectId: string): Promise<FinancialSummary | null> {
  const snapshots = await this.loadSnapshots(projectId, FINANCIAL_METRICS)
  if (!this.hasSnapshots(snapshots)) {
      return null
    }

    const orderedSnapshots = toSnapshotArray(snapshots)

    return {
      budgetVariance: this.asRequiredNumber(snapshots.budgetVariance),
      committedSpend: this.asRequiredNumber(snapshots.committedSpend),
      actualSpend: this.asRequiredNumber(snapshots.actualSpend),
      earnedValue: this.asRequiredNumber(snapshots.earnedValue),
      costPerformanceIndex: this.asOptionalNumber(snapshots.costPerformanceIndex),
      schedulePerformanceIndex: this.asOptionalNumber(snapshots.schedulePerformanceIndex),
      cashFlowProjection: this.asOptionalNumber(snapshots.cashFlowProjection),
      currency: this.resolveCurrency(orderedSnapshots),
      updatedAt: this.resolveUpdatedAt(orderedSnapshots),
    }
  }

  async fetchProcurementSummary(projectId: string): Promise<ProcurementSummary | null> {
  const snapshots = await this.loadSnapshots(projectId, PROCUREMENT_METRICS)
  if (!this.hasSnapshots(snapshots)) {
      return null
    }

    const orderedSnapshots = toSnapshotArray(snapshots)

    return {
      openRequisitions: this.asRequiredNumber(snapshots.openRequisitions),
      openPurchaseOrders: this.asRequiredNumber(snapshots.openPurchaseOrders),
      averageCycleTimeDays: this.asRequiredNumber(snapshots.averageCycleTimeDays),
      expeditingRequests: this.asRequiredNumber(snapshots.expeditingRequests),
      supplierIssues: this.asOptionalNumber(snapshots.supplierIssues),
      updatedAt: this.resolveUpdatedAt(orderedSnapshots),
    }
  }

  async fetchSafetySummary(projectId: string): Promise<SafetySummary | null> {
  const snapshots = await this.loadSnapshots(projectId, SAFETY_METRICS)
  if (!this.hasSnapshots(snapshots)) {
      return null
    }

    const orderedSnapshots = toSnapshotArray(snapshots)

    return {
      totalIncidents: this.asRequiredNumber(snapshots.totalIncidents),
      openIncidents: this.asRequiredNumber(snapshots.openIncidents),
      lostTimeIncidents: this.asRequiredNumber(snapshots.lostTimeIncidents),
      severityIndex: this.asRequiredNumber(snapshots.severityIndex),
      complianceScore: this.asOptionalNumber(snapshots.complianceScore),
      updatedAt: this.resolveUpdatedAt(orderedSnapshots),
    }
  }

  async fetchScheduleSummary(projectId: string): Promise<ScheduleSummary | null> {
  const snapshots = await this.loadSnapshots(projectId, SCHEDULE_METRICS)
  if (!this.hasSnapshots(snapshots)) {
      return null
    }

    const orderedSnapshots = toSnapshotArray(snapshots)

    return {
      onTrackMilestones: this.asRequiredNumber(snapshots.onTrackMilestones),
      lateMilestones: this.asRequiredNumber(snapshots.lateMilestones),
      resourceConflicts: this.asRequiredNumber(snapshots.resourceConflicts),
      scheduleVarianceDays: this.asRequiredNumber(snapshots.scheduleVarianceDays),
      forecastCompletionDate: this.asOptionalDate(snapshots.forecastCompletionDate),
      updatedAt: this.resolveUpdatedAt(orderedSnapshots),
    }
  }

  private async loadSnapshots<TMapping extends MetricMapping>(
    projectId: string,
    mapping: TMapping,
  ): Promise<SnapshotRecord<TMapping>> {
    const entries = await Promise.all(
      Object.entries(mapping).map(async ([key, metric]) => {
        const snapshot = await this.store.findLatest(metric, { projectId })
        return [key, snapshot] as const
      }),
    )

    return Object.fromEntries(entries) as SnapshotRecord<TMapping>
  }

  private hasSnapshots<TMapping extends MetricMapping>(record: SnapshotRecord<TMapping>): boolean {
    return Object.values(record).some((snapshot) => snapshot !== null)
  }

  private asRequiredNumber(snapshot: MetricSnapshot | null, fallback = 0): number {
    if (!snapshot || Number.isNaN(snapshot.value)) {
      return fallback
    }

    return snapshot.value
  }

  private asOptionalNumber(snapshot: MetricSnapshot | null): number | undefined {
    if (!snapshot || Number.isNaN(snapshot.value)) {
      return undefined
    }

    return snapshot.value
  }

  private asOptionalDate(snapshot: MetricSnapshot | null): Date | undefined {
    if (!snapshot) {
      return undefined
    }

    const { dimensions, value } = snapshot

    const isoCandidate = dimensions?.isoDate ?? dimensions?.date
    if (isoCandidate) {
      const parsedIso = new Date(isoCandidate)
      if (!Number.isNaN(parsedIso.getTime())) {
        return parsedIso
      }
    }

    const timestampCandidate = dimensions?.timestamp ?? dimensions?.timestampMs
    if (timestampCandidate) {
      const timestamp = Number(timestampCandidate)
      if (Number.isFinite(timestamp)) {
        const parsedTimestamp = new Date(timestamp)
        if (!Number.isNaN(parsedTimestamp.getTime())) {
          return parsedTimestamp
        }
      }
    }

    if (Number.isFinite(value)) {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }

    return undefined
  }

  private resolveCurrency(snapshots: MetricSnapshot[]): CurrencyCode {
    for (const snapshot of snapshots) {
      const code = snapshot.dimensions?.currency ?? snapshot.dimensions?.currencyCode
      if (code) {
        return code as CurrencyCode
      }
    }

    return this.defaultCurrency
  }

  private resolveUpdatedAt(snapshots: MetricSnapshot[]): Date {
    if (snapshots.length === 0) {
      return new Date()
    }

    const latest = snapshots.reduce((candidate, snapshot) => {
      if (candidate && candidate.capturedAt >= snapshot.capturedAt) {
        return candidate
      }

      return snapshot
    })

    return latest?.capturedAt ?? new Date()
  }
}
