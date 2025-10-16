export const CHANGE_ORDER_STATUSES = [
  'draft',
  'submitted',
  'under-review',
  'approved',
  'rejected',
  'cancelled',
] as const

export type ChangeOrderStatus = typeof CHANGE_ORDER_STATUSES[number]
