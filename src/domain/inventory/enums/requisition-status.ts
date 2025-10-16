export const REQUISITION_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'partially-fulfilled',
  'fulfilled',
  'cancelled',
  'rejected',
] as const

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number]

export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
  'draft': 'Draft',
  'submitted': 'Submitted',
  'approved': 'Approved',
  'partially-fulfilled': 'Partially Fulfilled',
  'fulfilled': 'Fulfilled',
  'cancelled': 'Cancelled',
  'rejected': 'Rejected',
}
