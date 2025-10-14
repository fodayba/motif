import type { IncidentSeverity, IncidentStatus } from '@domain/quality'

export type CoordinateInput = {
  latitude: number
  longitude: number
}

export type IncidentLocationInput = {
  siteName: string
  area?: string
  coordinate?: CoordinateInput
}

export type ReportIncidentInput = {
  projectId: string
  reporterId: string
  severity: IncidentSeverity
  title: string
  description: string
  occurredAt: Date
  location: IncidentLocationInput
  followUpNotes?: string
}

export type UpdateIncidentStatusInput = {
  incidentId: string
  status: IncidentStatus
}

export type AddCorrectiveActionInput = {
  incidentId: string
  description: string
  ownerId: string
  dueDate: Date
}

export type CompleteCorrectiveActionInput = {
  incidentId: string
  actionId: string
  completedAt?: Date
}

export type FollowUpNoteInput = {
  incidentId: string
  note: string
}

export type IncidentFilterOptions = {
  severities?: IncidentSeverity[]
  statuses?: IncidentStatus[]
  onlyWithOpenActions?: boolean
}

export type CorrectiveActionRecord = {
  id: string
  description: string
  ownerId: string
  dueDate: Date
  completedAt?: Date
  isOverdue: boolean
}

export type IncidentRecord = {
  id: string
  projectId: string
  reporterId: string
  status: IncidentStatus
  severity: IncidentSeverity
  title: string
  description: string
  location: {
    siteName: string
    area?: string
    coordinate?: CoordinateInput
  }
  occurredAt: Date
  reportedAt: Date
  closedAt?: Date
  followUpNotes?: string
  correctiveActions: CorrectiveActionRecord[]
  openActionCount: number
  daysOpen: number
}

export type ComplianceSnapshot = {
  projectId: string
  totalIncidents: number
  openIncidents: number
  escalatedIncidents: number
  highRiskIncidents: number
  overdueCorrectiveActions: number
  averageTimeToCloseDays?: number
  severityDistribution: Array<{ severity: IncidentSeverity; count: number }>
  statusDistribution: Array<{ status: IncidentStatus; count: number }>
  monthlyTrend: Array<{ month: string; count: number }>
}
