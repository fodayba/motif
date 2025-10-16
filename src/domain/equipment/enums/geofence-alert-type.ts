export const GEOFENCE_ALERT_TYPES = ['ENTRY', 'EXIT', 'BREACH', 'UNAUTHORIZED_MOVEMENT'] as const

export type GeofenceAlertType = (typeof GEOFENCE_ALERT_TYPES)[number]
