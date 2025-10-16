export const MILESTONE_STATUSES = ['pending', 'achieved', 'missed'] as const

export type MilestoneStatus = typeof MILESTONE_STATUSES[number]
