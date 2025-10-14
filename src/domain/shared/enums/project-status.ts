export const PROJECT_STATUSES = [
  'planning',
  'active',
  'on-hold',
  'completed',
  'closed',
  'cancelled',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]
