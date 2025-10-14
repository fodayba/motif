import {
  CorrectiveAction,
  IncidentLocation,
  SafetyIncident,
  type IncidentSeverity,
  type IncidentStatus,
  type SafetyIncidentRepository,
} from '@domain/quality'
import { GeoCoordinate, Result, UniqueEntityID, Validation } from '@domain/shared'
import { Guard } from '@domain/shared/core'
import type {
  AddCorrectiveActionInput,
  CompleteCorrectiveActionInput,
  ComplianceSnapshot,
  FollowUpNoteInput,
  IncidentFilterOptions,
  IncidentRecord,
  ReportIncidentInput,
  UpdateIncidentStatusInput,
  CorrectiveActionRecord,
} from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export class QualityService {
  private readonly repository: SafetyIncidentRepository

  constructor(repository: SafetyIncidentRepository) {
    this.repository = repository
  }

  async reportIncident(input: ReportIncidentInput): Promise<Result<IncidentRecord>> {
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const reporterIdResult = this.parseUniqueId(input.reporterId, 'reporterId')
    if (!reporterIdResult.isSuccess || !reporterIdResult.value) {
      return Result.fail(reporterIdResult.error ?? 'invalid reporterId')
    }

    const occurredValidation = Validation.dateNotInFuture(input.occurredAt, 'occurredAt')
    if (!occurredValidation.isSuccess) {
      return Result.fail(occurredValidation.error ?? 'occurredAt invalid')
    }

    const locationResult = this.createLocation(input.location)
    if (!locationResult.isSuccess || !locationResult.value) {
      return Result.fail(locationResult.error ?? 'location invalid')
    }

    const now = new Date()

    const incidentResult = SafetyIncident.create({
      projectId: projectIdResult.value,
      reporterId: reporterIdResult.value,
      status: 'reported',
      severity: input.severity,
      title: input.title,
      description: input.description,
      location: locationResult.value,
      occurredAt: input.occurredAt,
      reportedAt: now,
      correctiveActions: [],
      followUpNotes: input.followUpNotes,
      createdAt: now,
      updatedAt: now,
    })

    if (!incidentResult.isSuccess || !incidentResult.value) {
      return Result.fail(incidentResult.error ?? 'failed to create incident')
    }

    const incident = incidentResult.value
    await this.repository.save(incident)

    return Result.ok(this.mapIncidentToRecord(incident))
  }

  async updateIncidentStatus(
    input: UpdateIncidentStatusInput,
  ): Promise<Result<IncidentRecord>> {
    const incidentResult = await this.loadIncident(input.incidentId)
    if (!incidentResult.isSuccess || !incidentResult.value) {
      return Result.fail(incidentResult.error ?? 'incident not found')
    }

    const incident = incidentResult.value

    if (input.status === 'escalated') {
      incident.escalate()
    } else {
      incident.updateStatus(input.status)
    }

    await this.repository.save(incident)

    return Result.ok(this.mapIncidentToRecord(incident))
  }

  async addCorrectiveAction(
    input: AddCorrectiveActionInput,
  ): Promise<Result<IncidentRecord>> {
    const incidentResult = await this.loadIncident(input.incidentId)
    if (!incidentResult.isSuccess || !incidentResult.value) {
      return Result.fail(incidentResult.error ?? 'incident not found')
    }

    const incident = incidentResult.value

    const ownerIdResult = this.parseUniqueId(input.ownerId, 'ownerId')
    if (!ownerIdResult.isSuccess || !ownerIdResult.value) {
      return Result.fail(ownerIdResult.error ?? 'invalid ownerId')
    }

    const guardResult = Guard.againstEmptyString(input.description, 'description')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (input.dueDate.getTime() < incident.reportedAt.getTime()) {
      return Result.fail('dueDate cannot be earlier than the incident report date')
    }

    const actionResult = CorrectiveAction.create({
      description: input.description,
      ownerId: ownerIdResult.value,
      dueDate: input.dueDate,
    })

    if (!actionResult.isSuccess || !actionResult.value) {
      return Result.fail(actionResult.error ?? 'failed to create corrective action')
    }

    incident.addCorrectiveAction(actionResult.value)
    await this.repository.save(incident)

    return Result.ok(this.mapIncidentToRecord(incident))
  }

  async completeCorrectiveAction(
    input: CompleteCorrectiveActionInput,
  ): Promise<Result<IncidentRecord>> {
    const incidentResult = await this.loadIncident(input.incidentId)
    if (!incidentResult.isSuccess || !incidentResult.value) {
      return Result.fail(incidentResult.error ?? 'incident not found')
    }

    const incident = incidentResult.value
    const action = incident.correctiveActions.find((candidate) =>
      candidate.actionId.toString() === input.actionId,
    )

    if (!action) {
      return Result.fail('corrective action not found')
    }

    if (input.completedAt && input.completedAt.getTime() < incident.reportedAt.getTime()) {
      return Result.fail('completedAt cannot be before the incident was reported')
    }

    const actionResult = CorrectiveAction.create({
      actionId: action.actionId,
      description: action.description,
      ownerId: action.ownerId,
      dueDate: action.dueDate,
      completedAt: input.completedAt ?? new Date(),
    })

    if (!actionResult.isSuccess || !actionResult.value) {
      return Result.fail(actionResult.error ?? 'failed to complete corrective action')
    }

    const updateResult = incident.updateCorrectiveAction(actionResult.value)
    if (!updateResult.isSuccess) {
      return Result.fail(updateResult.error ?? 'failed to update corrective action')
    }

    await this.repository.save(incident)

    return Result.ok(this.mapIncidentToRecord(incident))
  }

  async addFollowUpNote(input: FollowUpNoteInput): Promise<Result<IncidentRecord>> {
    const incidentResult = await this.loadIncident(input.incidentId)
    if (!incidentResult.isSuccess || !incidentResult.value) {
      return Result.fail(incidentResult.error ?? 'incident not found')
    }

    const incident = incidentResult.value

    try {
      incident.addFollowUp(input.note)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'failed to add follow-up'
      return Result.fail(message)
    }

    await this.repository.save(incident)

    return Result.ok(this.mapIncidentToRecord(incident))
  }

  async listIncidents(
    projectId: string,
    filters?: IncidentFilterOptions,
  ): Promise<Result<IncidentRecord[]>> {
    const projectIdResult = this.parseUniqueId(projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const incidents = await this.repository.listByProject(projectIdResult.value)

    const filtered = incidents.filter((incident) => {
      if (filters?.severities && filters.severities.length > 0) {
        if (!filters.severities.includes(incident.severity)) {
          return false
        }
      }

      if (filters?.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(incident.status)) {
          return false
        }
      }

      if (filters?.onlyWithOpenActions) {
        const hasOpen = incident.correctiveActions.some((action) => !action.completedAt)
        if (!hasOpen) {
          return false
        }
      }

      return true
    })

    const records = filtered
      .map((incident) => this.mapIncidentToRecord(incident))
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime())

    return Result.ok(records)
  }

  async getComplianceSnapshot(projectId: string): Promise<Result<ComplianceSnapshot>> {
    const projectIdResult = this.parseUniqueId(projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const incidents = await this.repository.listByProject(projectIdResult.value)

    if (incidents.length === 0) {
      return Result.ok({
        projectId,
        totalIncidents: 0,
        openIncidents: 0,
        escalatedIncidents: 0,
        highRiskIncidents: 0,
        overdueCorrectiveActions: 0,
        severityDistribution: [],
        statusDistribution: [],
        monthlyTrend: [],
      })
    }

    const totalIncidents = incidents.length
    const openIncidents = incidents.filter((incident) => incident.status !== 'closed').length
    const escalatedIncidents = incidents.filter((incident) => incident.status === 'escalated').length
    const highRiskIncidents = incidents.filter((incident) =>
      incident.severity === 'high' || incident.severity === 'critical'
    ).length

    let overdueCorrectiveActions = 0
    let totalCloseDays = 0
    let closedCount = 0

    const severityCounts = new Map<IncidentSeverity, number>()
    const statusCounts = new Map<IncidentStatus, number>()
    const monthlyCounts = new Map<string, number>()

    incidents.forEach((incident) => {
      severityCounts.set(
        incident.severity,
        (severityCounts.get(incident.severity) ?? 0) + 1,
      )

      statusCounts.set(incident.status, (statusCounts.get(incident.status) ?? 0) + 1)

      const monthKey = this.formatMonth(incident.reportedAt)
      monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1)

      incident.correctiveActions.forEach((action) => {
        if (!action.completedAt && action.dueDate.getTime() < Date.now()) {
          overdueCorrectiveActions += 1
        }
      })

      if (incident.closedAt) {
        closedCount += 1
        totalCloseDays += this.calculateDaysBetween(incident.reportedAt, incident.closedAt)
      }
    })

    const averageTimeToCloseDays = closedCount > 0
      ? totalCloseDays / closedCount
      : undefined

    const severityDistribution = Array.from(severityCounts.entries()).map((entry) => ({
      severity: entry[0],
      count: entry[1],
    }))

    const statusDistribution = Array.from(statusCounts.entries()).map((entry) => ({
      status: entry[0],
      count: entry[1],
    }))

    const monthlyTrend = Array.from(monthlyCounts.entries())
      .map((entry) => ({ month: entry[0], count: entry[1] }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return Result.ok({
      projectId,
      totalIncidents,
      openIncidents,
      escalatedIncidents,
      highRiskIncidents,
      overdueCorrectiveActions,
      averageTimeToCloseDays,
      severityDistribution,
      statusDistribution,
      monthlyTrend,
    })
  }

  private async loadIncident(incidentId: string): Promise<Result<SafetyIncident>> {
    const incidentIdResult = this.parseUniqueId(incidentId, 'incidentId')
    if (!incidentIdResult.isSuccess || !incidentIdResult.value) {
      return Result.fail(incidentIdResult.error ?? 'invalid incidentId')
    }

    const incident = await this.repository.findById(incidentIdResult.value)
    if (!incident) {
      return Result.fail('incident not found')
    }

    return Result.ok(incident)
  }

  private createLocation(input: ReportIncidentInput['location']): Result<IncidentLocation> {
    if (input.coordinate) {
      const coordinateResult = GeoCoordinate.create(
        input.coordinate.latitude,
        input.coordinate.longitude,
      )

      if (!coordinateResult.isSuccess || !coordinateResult.value) {
        return Result.fail(coordinateResult.error ?? 'coordinate invalid')
      }

      const locationResult = IncidentLocation.create({
        siteName: input.siteName,
        area: input.area,
        coordinate: coordinateResult.value,
      })

      return locationResult
    }

    return IncidentLocation.create({
      siteName: input.siteName,
      area: input.area,
    })
  }

  private mapIncidentToRecord(incident: SafetyIncident): IncidentRecord {
    const correctiveActions = incident.correctiveActions.map((action) => this.mapCorrectiveAction(action))
    const openActionCount = correctiveActions.filter((action) => !action.completedAt).length
    const referenceDate = incident.closedAt ?? new Date()
    const daysOpen = this.calculateDaysBetween(incident.reportedAt, referenceDate)

    return {
      id: incident.id.toString(),
      projectId: incident.projectId.toString(),
      reporterId: incident.reporterId.toString(),
      status: incident.status,
      severity: incident.severity,
      title: incident.title,
      description: incident.description,
      location: {
        siteName: incident.location.siteName,
        area: incident.location.area,
        coordinate: incident.location.coordinate
          ? {
            latitude: incident.location.coordinate.latitude,
            longitude: incident.location.coordinate.longitude,
          }
          : undefined,
      },
      occurredAt: incident.occurredAt,
      reportedAt: incident.reportedAt,
      closedAt: incident.closedAt,
      followUpNotes: incident.followUpNotes,
      correctiveActions,
      openActionCount,
      daysOpen,
    }
  }

  private mapCorrectiveAction(action: CorrectiveAction): CorrectiveActionRecord {
    const isOverdue = !action.completedAt && action.dueDate.getTime() < Date.now()

    return {
      id: action.actionId.toString(),
      description: action.description,
      ownerId: action.ownerId.toString(),
      dueDate: action.dueDate,
      completedAt: action.completedAt,
      isOverdue,
    }
  }

  private parseUniqueId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }

  private formatMonth(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  }

  private calculateDaysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime()
    return Math.max(Math.ceil(diff / MS_PER_DAY), 0)
  }
}
