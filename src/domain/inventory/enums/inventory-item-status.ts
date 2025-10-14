export const INVENTORY_ITEM_STATUSES = [
  'active',
  'inactive',
  'reserved',
  'pending-inspection',
  'quarantined',
] as const

export type InventoryItemStatus = (typeof INVENTORY_ITEM_STATUSES)[number]
