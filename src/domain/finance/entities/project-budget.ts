import {
  AggregateRoot,
  Guard,
  Money,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { BudgetStatus } from '../enums/budget-status'
import { BUDGET_STATUSES } from '../enums/budget-status'
import type { BudgetLine } from '../value-objects/budget-line'

export type ProjectBudgetProps = {
  projectId: UniqueEntityID
  version: number
  status: BudgetStatus
  currency: string
  lines: BudgetLine[]
  baselineTotal?: Money
  createdAt: Date
  updatedAt: Date
}

export class ProjectBudget extends AggregateRoot<ProjectBudgetProps> {
  private constructor(props: ProjectBudgetProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get version(): number {
    return this.props.version
  }

  get status(): BudgetStatus {
    return this.props.status
  }

  get currency(): string {
    return this.props.currency
  }

  get lines(): BudgetLine[] {
    return [...this.props.lines]
  }

  get baselineTotal(): Money | undefined {
    return this.props.baselineTotal
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get plannedTotal(): number {
    return this.props.lines.reduce((sum, line) => sum + line.planned.amount, 0)
  }

  get committedTotal(): number {
    return this.props.lines.reduce((sum, line) => sum + line.committed.amount, 0)
  }

  get actualTotal(): number {
    return this.props.lines.reduce((sum, line) => sum + line.actual.amount, 0)
  }

  public static create(props: ProjectBudgetProps, id?: UniqueEntityID): Result<ProjectBudget> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.version, argumentName: 'version' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.lines, argumentName: 'lines' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!BUDGET_STATUSES.includes(props.status)) {
      return Result.fail('budget status is invalid')
    }

    if (props.version < 1) {
      return Result.fail('budget version must be at least 1')
    }

    if (props.lines.length === 0) {
      return Result.fail('budget must contain at least one line')
    }

    const currency = props.currency.toUpperCase()

    return Result.ok(
      new ProjectBudget(
        {
          ...props,
          currency,
          lines: props.lines,
        },
        id,
      ),
    )
  }

  public addLine(line: BudgetLine) {
    this.props.lines = [...this.props.lines, line]
    this.touch()
  }

  public removeLine(lineId: string) {
    this.props.lines = this.props.lines.filter((line) => line.lineId !== lineId)
    this.touch()
  }

  public replaceLine(updatedLine: BudgetLine) {
    const index = this.props.lines.findIndex(
      (line) => line.lineId === updatedLine.lineId,
    )

    if (index === -1) {
      throw new Error('budget line not found')
    }

    const nextLines = [...this.props.lines]
    nextLines[index] = updatedLine
    this.props.lines = nextLines
    this.touch()
  }

  public approveBaseline(total: Money) {
    if (total.currency !== this.currency) {
      throw new Error('baseline total currency mismatch')
    }

    this.props.baselineTotal = total
    this.props.status = 'baseline'
    this.touch()
  }

  public updateStatus(status: BudgetStatus) {
    if (!BUDGET_STATUSES.includes(status)) {
      throw new Error('budget status is invalid')
    }

    this.props.status = status
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
