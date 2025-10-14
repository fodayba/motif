export const UNITS_OF_MEASURE = [
  'EA',
  'KG',
  'LB',
  'L',
  'GAL',
  'FT',
  'M',
  'SQFT',
  'SQM',
  'HRS',
] as const

export type UnitOfMeasure = (typeof UNITS_OF_MEASURE)[number]
