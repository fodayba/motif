export const TRANSFER_STATUSES = [
  'PENDING',
  'APPROVED',
  'IN_TRANSIT',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
] as const

export type TransferStatus = (typeof TRANSFER_STATUSES)[number]
