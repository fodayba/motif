import {
  type AccountingIntegrationClient,
  type AccountingInvoicePayload,
  type ExternalAccountingSystem,
  type IntegrationHealth,
  type IntegrationOperationResult,
  type JobCostingSnapshot,
} from '@application/integrations'
import type { CurrencyCode } from '@domain/shared'

const DEFAULT_SYSTEMS: ExternalAccountingSystem[] = [
  {
    id: 'quickbooks-online',
    name: 'QuickBooks Online',
    capabilities: ['job-costing', 'general-ledger', 'invoicing'],
    environments: ['sandbox', 'production'],
  },
  {
    id: 'sage-300',
    name: 'Sage 300 CRE',
    capabilities: ['job-costing', 'general-ledger'],
    environments: ['production'],
  },
  {
    id: 'sap-construction',
    name: 'SAP for Construction',
    capabilities: ['job-costing', 'general-ledger', 'invoicing', 'payments'],
    environments: ['production'],
  },
]

type JobCostingSeed = {
  projectId: string
  actualCost: number
  committedCost: number
  revenueRecognized?: number
  currency?: CurrencyCode
  sourceSystem?: string
}

export class MockAccountingIntegrationClient implements AccountingIntegrationClient {
  private readonly systems: ExternalAccountingSystem[]
  private readonly jobCostingData: Map<string, JobCostingSnapshot>
  private readonly invoiceLog: AccountingInvoicePayload[] = []

  constructor(seedData: JobCostingSeed[] = [], systems: ExternalAccountingSystem[] = DEFAULT_SYSTEMS) {
    this.systems = systems
    this.jobCostingData = new Map(
      seedData.map((seed) => [
        seed.projectId,
        {
          projectId: seed.projectId,
          syncedAt: new Date(Date.now() - 1000 * 60 * 15),
          actualCost: seed.actualCost,
          committedCost: seed.committedCost,
          revenueRecognized: seed.revenueRecognized,
          currency: seed.currency ?? 'USD',
          sourceSystem: seed.sourceSystem ?? systems[0]?.id ?? 'mock-system',
        },
      ]),
    )
  }

  async listSupportedSystems(): Promise<ExternalAccountingSystem[]> {
    return [...this.systems]
  }

  async fetchJobCosting(projectId: string): Promise<JobCostingSnapshot | null> {
    const snapshot = this.jobCostingData.get(projectId)

    if (!snapshot) {
      return null
    }

    return {
      ...snapshot,
      syncedAt: new Date(),
    }
  }

  async pushInvoice(payload: AccountingInvoicePayload): Promise<IntegrationOperationResult> {
    this.invoiceLog.push(payload)

    return {
      success: true,
      message: `Invoice ${payload.invoiceId} accepted by ${this.jobCostingData.get(payload.projectId)?.sourceSystem ?? 'mock-system'}`,
      referenceId: `mock-${payload.invoiceId}`,
      metadata: {
        processedAt: new Date().toISOString(),
        lineCount: payload.lineItems.length,
      },
    }
  }

  async checkHealth(): Promise<IntegrationHealth> {
    return {
      service: 'mock-accounting-integration',
      status: 'operational',
      checkedAt: new Date(),
      message: 'Mock accounting API responding normally',
    }
  }

  getSubmittedInvoices(): AccountingInvoicePayload[] {
    return [...this.invoiceLog]
  }
}
