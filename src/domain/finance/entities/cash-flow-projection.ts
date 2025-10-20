import type { CurrencyCode } from '../../shared'
import {
  AggregateRoot,
  Guard,
  Money,
  Result,
  UniqueEntityID,
} from '../../shared'

export type CashFlowScenario = 'best-case' | 'expected' | 'worst-case'

export type CashFlowWeekData = {
  weekNumber: number
  weekStartDate: Date
  weekEndDate: Date
  inflowsAR: Money // Accounts Receivable collections
  inflowsOther: Money // Other cash inflows
  outflowsAP: Money // Accounts Payable payments
  outflowsPayroll: Money // Payroll expenses
  outflowsOther: Money // Other cash outflows
  netCashFlow: Money // Inflows - Outflows
  endingBalance: Money // Beginning + Net Cash Flow
}

export type CashFlowProjectionProps = {
  projectId?: UniqueEntityID
  name: string
  description?: string
  scenario: CashFlowScenario
  currency: string
  startDate: Date
  endDate: Date // 13 weeks from start
  openingBalance: Money
  weeks: CashFlowWeekData[]
  assumptions?: string[]
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export class CashFlowProjection extends AggregateRoot<CashFlowProjectionProps> {
  private constructor(props: CashFlowProjectionProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get projectId(): UniqueEntityID | undefined {
    return this.props.projectId
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get scenario(): CashFlowScenario {
    return this.props.scenario
  }

  get currency(): string {
    return this.props.currency
  }

  get startDate(): Date {
    return this.props.startDate
  }

  get endDate(): Date {
    return this.props.endDate
  }

  get openingBalance(): Money {
    return this.props.openingBalance
  }

  get weeks(): CashFlowWeekData[] {
    return [...this.props.weeks]
  }

  get assumptions(): string[] {
    return this.props.assumptions || []
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get createdBy(): string {
    return this.props.createdBy
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Computed properties
  get totalInflows(): Money {
    const total = this.props.weeks.reduce((sum, week) => {
      return sum + week.inflowsAR.amount + week.inflowsOther.amount
    }, 0)

    const result = Money.create(total, this.props.currency as CurrencyCode)
    if (!result.isSuccess) {
      throw new Error('Failed to create total inflows money')
    }
    return result.value!
  }

  get totalOutflows(): Money {
    const total = this.props.weeks.reduce((sum, week) => {
      return sum + week.outflowsAP.amount + week.outflowsPayroll.amount + week.outflowsOther.amount
    }, 0)

    const result = Money.create(total, this.props.currency as CurrencyCode)
    if (!result.isSuccess) {
      throw new Error('Failed to create total outflows money')
    }
    return result.value!
  }

  get totalNetCashFlow(): Money {
    const total = this.props.weeks.reduce((sum, week) => {
      return sum + week.netCashFlow.amount
    }, 0)

    const result = Money.create(total, this.props.currency as CurrencyCode)
    if (!result.isSuccess) {
      throw new Error('Failed to create total net cash flow money')
    }
    return result.value!
  }

  get finalBalance(): Money {
    if (this.props.weeks.length === 0) {
      return this.props.openingBalance
    }
    return this.props.weeks[this.props.weeks.length - 1].endingBalance
  }

  get lowestBalance(): Money {
    if (this.props.weeks.length === 0) {
      return this.props.openingBalance
    }

    const lowest = this.props.weeks.reduce((min, week) => {
      return week.endingBalance.amount < min.amount ? week.endingBalance : min
    }, this.props.weeks[0].endingBalance)

    return lowest
  }

  get weeksWithNegativeBalance(): number {
    return this.props.weeks.filter(week => week.endingBalance.amount < 0).length
  }

  get isCashFlowPositive(): boolean {
    return this.totalNetCashFlow.amount > 0
  }

  // Factory method
  public static create(
    props: CashFlowProjectionProps,
    id?: UniqueEntityID,
  ): Result<CashFlowProjection> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.scenario, argumentName: 'scenario' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.startDate, argumentName: 'startDate' },
      { argument: props.endDate, argumentName: 'endDate' },
      { argument: props.openingBalance, argumentName: 'openingBalance' },
      { argument: props.weeks, argumentName: 'weeks' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    // Validate scenario
    const validScenarios: CashFlowScenario[] = ['best-case', 'expected', 'worst-case']
    if (!validScenarios.includes(props.scenario)) {
      return Result.fail('Invalid cash flow scenario')
    }

    // Validate date range (must be ~13 weeks)
    const daysDiff = Math.floor((props.endDate.getTime() - props.startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff < 84 || daysDiff > 98) { // 12-14 weeks (allowing some flexibility)
      return Result.fail('Cash flow projection must span approximately 13 weeks (84-98 days)')
    }

    // Validate weeks count
    if (props.weeks.length !== 13) {
      return Result.fail('Cash flow projection must contain exactly 13 weeks of data')
    }

    // Validate all amounts are in the same currency
    for (const week of props.weeks) {
      if (
        week.inflowsAR.currency !== props.currency ||
        week.inflowsOther.currency !== props.currency ||
        week.outflowsAP.currency !== props.currency ||
        week.outflowsPayroll.currency !== props.currency ||
        week.outflowsOther.currency !== props.currency ||
        week.netCashFlow.currency !== props.currency ||
        week.endingBalance.currency !== props.currency
      ) {
        return Result.fail(`All money amounts must be in ${props.currency}`)
      }
    }

    return Result.ok(new CashFlowProjection(props, id))
  }

  // Methods
  public updateWeekData(weekNumber: number, weekData: CashFlowWeekData): Result<void> {
    const weekIndex = this.props.weeks.findIndex(w => w.weekNumber === weekNumber)
    if (weekIndex === -1) {
      return Result.fail(`Week ${weekNumber} not found`)
    }

    // Validate currency
    if (
      weekData.inflowsAR.currency !== this.props.currency ||
      weekData.inflowsOther.currency !== this.props.currency ||
      weekData.outflowsAP.currency !== this.props.currency ||
      weekData.outflowsPayroll.currency !== this.props.currency ||
      weekData.outflowsOther.currency !== this.props.currency ||
      weekData.netCashFlow.currency !== this.props.currency ||
      weekData.endingBalance.currency !== this.props.currency
    ) {
      return Result.fail(`All money amounts must be in ${this.props.currency}`)
    }

    this.props.weeks[weekIndex] = weekData
    this.touch()

    return Result.ok(undefined)
  }

  public addAssumption(assumption: string): void {
    if (!this.props.assumptions) {
      this.props.assumptions = []
    }
    this.props.assumptions.push(assumption)
    this.touch()
  }

  public removeAssumption(assumption: string): void {
    if (this.props.assumptions) {
      this.props.assumptions = this.props.assumptions.filter(a => a !== assumption)
      this.touch()
    }
  }

  public addNote(note: string): void {
    if (this.props.notes) {
      this.props.notes += `\n${note}`
    } else {
      this.props.notes = note
    }
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}
