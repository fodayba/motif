export const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export type TaskPriority = typeof TASK_PRIORITIES[number]
