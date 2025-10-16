export const DEPRECIATION_METHODS = [
  'STRAIGHT_LINE',
  'DECLINING_BALANCE',
  'USAGE_BASED',
  'SUM_OF_YEARS',
] as const

export type DepreciationMethod = (typeof DEPRECIATION_METHODS)[number]
