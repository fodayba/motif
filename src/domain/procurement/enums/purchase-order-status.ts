export const PURCHASE_ORDER_STATUSES = [
  'draft',
  'pending-approval',
  'approved',
  'partially-received',
  'received',
  'closed',
  'cancelled',
] as const

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number]
