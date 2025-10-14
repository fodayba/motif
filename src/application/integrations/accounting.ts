import type { CurrencyCode } from '@domain/shared'
import type { IntegrationHealth, IntegrationOperationResult } from './types'

export type ExternalAccountingSystem = {
  id: string
  name: string
  capabilities: Array<'job-costing' | 'general-ledger' | 'invoicing' | 'payments'>
  environments: Array<'sandbox' | 'production'>
}

export type JobCostingSnapshot = {
  projectId: string
  syncedAt: Date
  actualCost: number
  committedCost: number
  revenueRecognized?: number
  currency: CurrencyCode
  sourceSystem: string
}

export type AccountingInvoicePayload = {
  invoiceId: string
  projectId: string
  customerId: string
  amount: number
  currency: CurrencyCode
  issuedOn: Date
  dueOn: Date
  retentionPercent?: number
  lineItems: Array<{
    lineId: string
    description: string
    quantity: number
    unitCost: number
    costCode?: string
  }>
}

export interface AccountingIntegrationClient {
  listSupportedSystems(): Promise<ExternalAccountingSystem[]>
  fetchJobCosting(projectId: string): Promise<JobCostingSnapshot | null>
  pushInvoice(payload: AccountingInvoicePayload): Promise<IntegrationOperationResult>
  checkHealth(): Promise<IntegrationHealth>
}
