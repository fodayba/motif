import type { CurrencyCode } from '@domain/shared'

export type MoneyAmount = {
  amount: number
  currency: CurrencyCode
}

export type ResourceAssignment = {
  resourceId: string
  taskId: string
  allocationPercent: number
  start: Date
  finish: Date
}

export type ProjectTaskRecord = {
  id: string
  projectId: string
  name: string
  wbsCode?: string
  plannedStart: Date
  plannedFinish: Date
  actualStart?: Date
  actualFinish?: Date
  percentComplete: number
  baselineCost: MoneyAmount
  actualCost?: MoneyAmount
  baselineLaborHours: number
  actualLaborHours?: number
  resourceAssignments: ResourceAssignment[]
}

export type ResourceCapacity = {
  resourceId: string
  maxAllocationPercent: number
}

export type EarnedValueMetrics = {
  projectId: string
  asOf: Date
  currency: CurrencyCode
  plannedValue: number
  earnedValue: number
  actualCost: number
  scheduleVariance: number
  costVariance: number
  cpi: number | null
  spi: number | null
  estimateAtCompletion: number | null
  varianceAtCompletion: number | null
}

export type ResourceConflict = {
  resourceId: string
  conflictStart: Date
  conflictEnd: Date
  totalAllocationPercent: number
  capacityPercent: number
  assignments: Array<{
    taskId: string
    taskName: string
    allocationPercent: number
    start: Date
    finish: Date
  }>
}
