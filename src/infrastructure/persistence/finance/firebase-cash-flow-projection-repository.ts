import { UniqueEntityID, Money, type CurrencyCode } from '@domain/shared'
import { CashFlowProjection, type CashFlowProjectionRepository, type CashFlowScenario, type CashFlowWeekData } from '@domain/finance'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type CashFlowWeekDocument = {
  weekNumber: number
  weekStartDate: string
  weekEndDate: string
  inflowsAR: { amount: number; currency: string }
  inflowsOther: { amount: number; currency: string }
  outflowsAP: { amount: number; currency: string }
  outflowsPayroll: { amount: number; currency: string }
  outflowsOther: { amount: number; currency: string }
  netCashFlow: { amount: number; currency: string }
  endingBalance: { amount: number; currency: string }
}

type CashFlowProjectionDocument = FirestoreDocument<{
  projectId?: string
  name: string
  description?: string
  scenario: CashFlowScenario
  currency: string
  startDate: string
  endDate: string
  openingBalance: { amount: number; currency: string }
  weeks: CashFlowWeekDocument[]
  assumptions?: string[]
  notes?: string
  hasNegativeCashFlow: boolean // Denormalized for efficient querying
  createdBy: string
  createdAt: string
  updatedAt: string
}>

/**
 * Firebase implementation of CashFlowProjectionRepository
 * Manages 13-week rolling cash flow projections in Firestore
 */
export class FirebaseCashFlowProjectionRepository
  extends FirestoreRepository<CashFlowProjection>
  implements CashFlowProjectionRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'cash_flow_projections')
  }

  // save() and findById() are inherited from FirestoreRepository base class

  async findByProject(projectId: UniqueEntityID): Promise<CashFlowProjection[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'startDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findByScenario(
    projectId: UniqueEntityID,
    scenario: CashFlowScenario
  ): Promise<CashFlowProjection[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'scenario', op: '==', value: scenario },
      { field: 'startDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findLatest(projectId: UniqueEntityID): Promise<CashFlowProjection | null> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId.toString() },
      { field: 'startDate', op: 'orderBy', direction: 'desc' },
      { field: 'startDate', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)
    return results[0] ?? null
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<CashFlowProjection[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'startDate', op: '>=', value: startDate.toISOString() },
      { field: 'startDate', op: '<=', value: endDate.toISOString() },
      { field: 'startDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findWithNegativeCashFlow(): Promise<CashFlowProjection[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'hasNegativeCashFlow', op: '==', value: true },
      { field: 'startDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async findCompanyWide(): Promise<CashFlowProjection[]> {
    // Company-wide projections don't have a projectId
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: null },
      { field: 'startDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  // delete() is inherited from FirestoreRepository base class

  protected obtainId(entity: CashFlowProjection): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(projection: CashFlowProjection): CashFlowProjectionDocument {
    // Convert week data to document format
    const weeksDoc: CashFlowWeekDocument[] = projection.weeks.map((week) => ({
      weekNumber: week.weekNumber,
      weekStartDate: week.weekStartDate.toISOString(),
      weekEndDate: week.weekEndDate.toISOString(),
      inflowsAR: {
        amount: week.inflowsAR.amount,
        currency: week.inflowsAR.currency,
      },
      inflowsOther: {
        amount: week.inflowsOther.amount,
        currency: week.inflowsOther.currency,
      },
      outflowsAP: {
        amount: week.outflowsAP.amount,
        currency: week.outflowsAP.currency,
      },
      outflowsPayroll: {
        amount: week.outflowsPayroll.amount,
        currency: week.outflowsPayroll.currency,
      },
      outflowsOther: {
        amount: week.outflowsOther.amount,
        currency: week.outflowsOther.currency,
      },
      netCashFlow: {
        amount: week.netCashFlow.amount,
        currency: week.netCashFlow.currency,
      },
      endingBalance: {
        amount: week.endingBalance.amount,
        currency: week.endingBalance.currency,
      },
    }))

    return {
      projectId: projection.projectId?.toString(),
      name: projection.name,
      description: projection.description,
      scenario: projection.scenario,
      currency: projection.currency,
      startDate: projection.startDate.toISOString(),
      endDate: projection.endDate.toISOString(),
      openingBalance: {
        amount: projection.openingBalance.amount,
        currency: projection.openingBalance.currency,
      },
      weeks: weeksDoc,
      assumptions: projection.assumptions,
      notes: projection.notes,
      hasNegativeCashFlow: projection.weeksWithNegativeBalance > 0, // Denormalized
      createdBy: projection.createdBy,
      createdAt: projection.createdAt.toISOString(),
      updatedAt: projection.updatedAt.toISOString(),
    }
  }

  protected toDomain(doc: CashFlowProjectionDocument & { id: string }): CashFlowProjection | null {
    try {
      // Reconstruct week data
      const weeks: CashFlowWeekData[] = doc.weeks.map((weekDoc) => ({
        weekNumber: weekDoc.weekNumber,
        weekStartDate: new Date(weekDoc.weekStartDate),
        weekEndDate: new Date(weekDoc.weekEndDate),
        inflowsAR: Money.create(
          weekDoc.inflowsAR.amount,
          weekDoc.inflowsAR.currency as CurrencyCode
        ).value!,
        inflowsOther: Money.create(
          weekDoc.inflowsOther.amount,
          weekDoc.inflowsOther.currency as CurrencyCode
        ).value!,
        outflowsAP: Money.create(
          weekDoc.outflowsAP.amount,
          weekDoc.outflowsAP.currency as CurrencyCode
        ).value!,
        outflowsPayroll: Money.create(
          weekDoc.outflowsPayroll.amount,
          weekDoc.outflowsPayroll.currency as CurrencyCode
        ).value!,
        outflowsOther: Money.create(
          weekDoc.outflowsOther.amount,
          weekDoc.outflowsOther.currency as CurrencyCode
        ).value!,
        netCashFlow: Money.create(
          weekDoc.netCashFlow.amount,
          weekDoc.netCashFlow.currency as CurrencyCode
        ).value!,
        endingBalance: Money.create(
          weekDoc.endingBalance.amount,
          weekDoc.endingBalance.currency as CurrencyCode
        ).value!,
      }))

      const result = CashFlowProjection.create(
        {
          projectId: doc.projectId ? new UniqueEntityID(doc.projectId) : undefined,
          name: doc.name,
          description: doc.description,
          scenario: doc.scenario,
          currency: doc.currency,
          startDate: new Date(doc.startDate),
          endDate: new Date(doc.endDate),
          openingBalance: Money.create(
            doc.openingBalance.amount,
            doc.openingBalance.currency as CurrencyCode
          ).value!,
          weeks,
          assumptions: doc.assumptions,
          notes: doc.notes,
          createdBy: doc.createdBy,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        },
        new UniqueEntityID(doc.id),
      )

      return result.isSuccess ? result.value! : null
    } catch (error) {
      console.error('Failed to reconstruct CashFlowProjection:', error)
      return null
    }
  }
}
