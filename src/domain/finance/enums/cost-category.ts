export const COST_CATEGORIES = [
  'labor',
  'materials',
  'equipment',
  'subcontractor',
  'general-conditions',
  'contingency',
  'other',
] as const

export type CostCategory = (typeof COST_CATEGORIES)[number]
