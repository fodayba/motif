import {
  AggregateRoot,
  Guard,
  Money,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { CostCategory } from '../enums/cost-category'
import type { CostCode } from '../value-objects/cost-code'

export type JobCostRecordProps = {
  projectId: UniqueEntityID
  budgetId: UniqueEntityID
  costCode: CostCode
  category: CostCategory
  description: string
  phase?: string
  task?: string
  resourceType?: string // labor, material, equipment, subcontractor
  resourceId?: UniqueEntityID
  transactionDate: Date
  plannedAmount: Money
  committedAmount: Money
  actualAmount: Money
  invoiceId?: UniqueEntityID
  purchaseOrderId?: UniqueEntityID
  approved: boolean
  approvedBy?: string
  approvedAt?: Date
  notes?: string
  tags?: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export class JobCostRecord extends AggregateRoot<JobCostRecordProps> {
  private constructor(props: JobCostRecordProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get budgetId(): UniqueEntityID {
    return this.props.budgetId
  }

  get costCode(): CostCode {
    return this.props.costCode
  }

  get category(): CostCategory {
    return this.props.category
  }

  get description(): string {
    return this.props.description
  }

  get phase(): string | undefined {
    return this.props.phase
  }

  get task(): string | undefined {
    return this.props.task
  }

  get resourceType(): string | undefined {
    return this.props.resourceType
  }

  get resourceId(): UniqueEntityID | undefined {
    return this.props.resourceId
  }

  get transactionDate(): Date {
    return this.props.transactionDate
  }

  get plannedAmount(): Money {
    return this.props.plannedAmount
  }

  get committedAmount(): Money {
    return this.props.committedAmount
  }

  get actualAmount(): Money {
    return this.props.actualAmount
  }

  get invoiceId(): UniqueEntityID | undefined {
    return this.props.invoiceId
  }

  get purchaseOrderId(): UniqueEntityID | undefined {
    return this.props.purchaseOrderId
  }

  get approved(): boolean {
    return this.props.approved
  }

  get approvedBy(): string | undefined {
    return this.props.approvedBy
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get tags(): string[] {
    return this.props.tags || []
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
  get variance(): Money {
    const amount = this.props.plannedAmount.amount - this.props.actualAmount.amount
    const moneyResult = Money.create(amount, this.props.plannedAmount.currency)
    if (!moneyResult.isSuccess) {
      throw new Error('Failed to create variance money')
    }
    return moneyResult.value!
  }

  get variancePercent(): number {
    if (this.props.plannedAmount.amount === 0) {
      return 0
    }
    return ((this.props.plannedAmount.amount - this.props.actualAmount.amount) / this.props.plannedAmount.amount) * 100
  }

  get isOverBudget(): boolean {
    return this.props.actualAmount.amount > this.props.plannedAmount.amount
  }

  // Factory method
  public static create(
    props: JobCostRecordProps,
    id?: UniqueEntityID,
  ): Result<JobCostRecord> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.budgetId, argumentName: 'budgetId' },
      { argument: props.costCode, argumentName: 'costCode' },
      { argument: props.category, argumentName: 'category' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.transactionDate, argumentName: 'transactionDate' },
      { argument: props.plannedAmount, argumentName: 'plannedAmount' },
      { argument: props.committedAmount, argumentName: 'committedAmount' },
      { argument: props.actualAmount, argumentName: 'actualAmount' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    // Validate amounts are in the same currency
    if (
      props.plannedAmount.currency !== props.committedAmount.currency ||
      props.plannedAmount.currency !== props.actualAmount.currency
    ) {
      return Result.fail('All money amounts must be in the same currency')
    }

    // Validate description
    if (props.description.trim().length < 3) {
      return Result.fail('Description must be at least 3 characters')
    }

    return Result.ok(new JobCostRecord(props, id))
  }

  // Methods
  public approve(approvedBy: string): Result<void> {
    if (this.props.approved) {
      return Result.fail('Job cost record is already approved')
    }

    this.props.approved = true
    this.props.approvedBy = approvedBy
    this.props.approvedAt = new Date()
    this.touch()

    return Result.ok(undefined)
  }

  public updateActualAmount(actualAmount: Money): Result<void> {
    if (actualAmount.currency !== this.props.plannedAmount.currency) {
      return Result.fail('Actual amount currency must match planned amount currency')
    }

    this.props.actualAmount = actualAmount
    this.touch()

    return Result.ok(undefined)
  }

  public updateCommittedAmount(committedAmount: Money): Result<void> {
    if (committedAmount.currency !== this.props.plannedAmount.currency) {
      return Result.fail('Committed amount currency must match planned amount currency')
    }

    this.props.committedAmount = committedAmount
    this.touch()

    return Result.ok(undefined)
  }

  public addNote(note: string): void {
    if (this.props.notes) {
      this.props.notes += `\n${note}`
    } else {
      this.props.notes = note
    }
    this.touch()
  }

  public addTag(tag: string): void {
    if (!this.props.tags) {
      this.props.tags = []
    }
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag)
      this.touch()
    }
  }

  public removeTag(tag: string): void {
    if (this.props.tags) {
      this.props.tags = this.props.tags.filter(t => t !== tag)
      this.touch()
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}
