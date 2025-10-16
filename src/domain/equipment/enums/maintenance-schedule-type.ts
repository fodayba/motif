export const MAINTENANCE_SCHEDULE_TYPES = ['HOURS', 'MILEAGE', 'CALENDAR', 'CONDITION_BASED'] as const

export type MaintenanceScheduleType = (typeof MAINTENANCE_SCHEDULE_TYPES)[number]
