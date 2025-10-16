export const MAINTENANCE_TYPES = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'EMERGENCY'] as const

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]
