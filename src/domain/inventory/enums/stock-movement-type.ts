export const STOCK_MOVEMENT_TYPES = [
  'receipt',
  'issue',
  'transfer-out',
  'transfer-in',
  'adjustment',
  'cycle-count',
  'return',
  'write-off',
  'consumption',
  'production',
] as const

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  'receipt': 'Receipt',
  'issue': 'Issue',
  'transfer-out': 'Transfer Out',
  'transfer-in': 'Transfer In',
  'adjustment': 'Adjustment',
  'cycle-count': 'Cycle Count',
  'return': 'Return',
  'write-off': 'Write-Off',
  'consumption': 'Consumption',
  'production': 'Production',
}
