export const CYCLE_COUNT_STATUSES = [
  'scheduled',
  'in-progress',
  'completed',
  'cancelled',
  'requires-recount',
] as const

export type CycleCountStatus = (typeof CYCLE_COUNT_STATUSES)[number]

export const CYCLE_COUNT_STATUS_LABELS: Record<CycleCountStatus, string> = {
  'scheduled': 'Scheduled',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'requires-recount': 'Requires Recount',
}
