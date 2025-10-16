export const EQUIPMENT_STATUSES = [
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'REPAIR',
  'OUT_OF_SERVICE',
  'RETIRED',
] as const

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number]
