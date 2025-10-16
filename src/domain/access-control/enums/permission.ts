export const PERMISSIONS = [
  'projects.read',
  'projects.manage',
  'equipment.read',
  'equipment.manage',
  'inventory.read',
  'inventory.manage',
  'procurement.read',
  'procurement.manage',
  'finance.read',
  'finance.manage',
  'quality.read',
  'quality.manage',
  'safety.read',
  'safety.manage',
  'analytics.read',
  'analytics.manage',
  'documents.read',
  'documents.manage',
  'users.manage',
  'settings.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]
