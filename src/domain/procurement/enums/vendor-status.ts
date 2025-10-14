export const VENDOR_STATUSES = [
  'active',
  'onboarding',
  'suspended',
  'blacklisted',
] as const

export type VendorStatus = (typeof VENDOR_STATUSES)[number]
