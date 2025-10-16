export const EQUIPMENT_CATEGORIES = [
  'HEAVY_MACHINERY',
  'LIGHT_EQUIPMENT',
  'VEHICLE',
  'TOOL',
  'SAFETY_EQUIPMENT',
  'OTHER',
] as const

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number]
