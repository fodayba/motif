export const TRANSFER_STATUSES = [
  'draft',
  'pending-approval',
  'approved',
  'in-transit',
  'received',
  'cancelled',
  'rejected',
] as const

export type TransferStatus = (typeof TRANSFER_STATUSES)[number]

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  'draft': 'Draft',
  'pending-approval': 'Pending Approval',
  'approved': 'Approved',
  'in-transit': 'In Transit',
  'received': 'Received',
  'cancelled': 'Cancelled',
  'rejected': 'Rejected',
}
