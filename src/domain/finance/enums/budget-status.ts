export const BUDGET_STATUSES = [
  'draft',
  'approved',
  'in-review',
  'baseline',
  'closed',
] as const

export type BudgetStatus = (typeof BUDGET_STATUSES)[number]
