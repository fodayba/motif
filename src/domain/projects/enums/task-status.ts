export const TASK_STATUSES = [
  'not-started',
  'in-progress',
  'completed',
  'on-hold',
  'cancelled',
  'delayed',
] as const

export type TaskStatus = typeof TASK_STATUSES[number]
