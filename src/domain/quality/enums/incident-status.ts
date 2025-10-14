export const INCIDENT_STATUSES = [
  'reported',
  'investigating',
  'mitigated',
  'closed',
  'escalated',
] as const

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]
