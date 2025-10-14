export const PERMISSIONS = [
  'projects.read',
  'projects.manage',
  'inventory.read',
  'inventory.manage',
  'procurement.read',
  'procurement.manage',
  'finance.read',
  'finance.manage',
  'quality.read',
  'quality.manage',
  'users.manage',
  'settings.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]
