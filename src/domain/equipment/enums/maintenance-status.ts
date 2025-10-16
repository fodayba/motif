export const MAINTENANCE_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE',
] as const

export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]
