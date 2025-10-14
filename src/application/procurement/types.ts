import type { CurrencyCode } from '@domain/shared'

export type RequisitionStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'cancelled'

export type RequisitionItemInput = {
  itemId?: string
  itemCode?: string
  itemName: string
  description?: string
  quantity: number
  unitOfMeasure: string
  requiredBy?: Date
  category?: string
  unitCost?: { amount: number; currency: CurrencyCode }
}

export type SourcingSuggestion = {
  vendorId?: string
  recommendedTransferQuantity?: number
  notes?: string
}

export type AvailabilitySnapshot = {
  locationId: string
  locationName: string
  availableQuantity: number
  deficitQuantity: number
  alternativeSites: Array<{
    locationId: string
    locationName: string
    availableQuantity: number
  }>
  notes?: string
}

export type RequisitionItemRecord = {
  id: string
  itemId?: string
  itemCode?: string
  itemName: string
  description?: string
  quantity: number
  unitOfMeasure: string
  requiredBy?: Date
  category?: string
  unitCost?: { amount: number; currency: CurrencyCode }
  availability?: AvailabilitySnapshot
  suggestion?: SourcingSuggestion | null
}

export type PurchaseRequisitionRecord = {
  id: string
  requisitionNumber: string
  projectId: string
  requesterId: string
  deliveryLocationId: string
  deliveryLocationName: string
  justification?: string
  status: RequisitionStatus
  currency: CurrencyCode
  items: RequisitionItemRecord[]
  sourcingRecommendations: RequisitionItemRecord['suggestion'][]
  autoTransferRecommended: boolean
  createdAt: Date
  updatedAt: Date
  availabilityVerifiedAt?: Date
  interSiteReviewNotes?: string
}

export type VendorMatch = {
  vendorId: string
  score: number
  capabilities: string[]
}
