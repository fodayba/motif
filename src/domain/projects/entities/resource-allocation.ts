import { Entity, Guard, Money, Result, UniqueEntityID } from '../../shared'
import { RESOURCE_TYPES, type ResourceType } from '../enums/resource-type'

export type ResourceAllocationProps = {
  projectId: UniqueEntityID
  taskId: UniqueEntityID
  resourceId: UniqueEntityID
  resourceType: ResourceType
  resourceName: string
  allocationPercent: number // 0-100, represents % of resource capacity
  startDate: Date
  finishDate: Date
  estimatedCost: Money
  actualCost?: Money
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class ResourceAllocation extends Entity<ResourceAllocationProps> {
  private constructor(props: ResourceAllocationProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get taskId(): UniqueEntityID {
    return this.props.taskId
  }

  get resourceId(): UniqueEntityID {
    return this.props.resourceId
  }

  get resourceType(): ResourceType {
    return this.props.resourceType
  }

  get resourceName(): string {
    return this.props.resourceName
  }

  get allocationPercent(): number {
    return this.props.allocationPercent
  }

  get startDate(): Date {
    return this.props.startDate
  }

  get finishDate(): Date {
    return this.props.finishDate
  }

  get estimatedCost(): Money {
    return this.props.estimatedCost
  }

  get actualCost(): Money | undefined {
    return this.props.actualCost
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Computed properties
  get duration(): number {
    const diff = this.finishDate.getTime() - this.startDate.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  get isOverallocated(): boolean {
    return this.allocationPercent > 100
  }

  get isActive(): boolean {
    const now = new Date()
    return this.startDate <= now && this.finishDate >= now
  }

  get costVariance(): number {
    if (!this.actualCost || this.estimatedCost.currency !== this.actualCost.currency) {
      return 0
    }
    return this.estimatedCost.amount - this.actualCost.amount
  }

  // Business Logic Methods

  public adjustAllocation(newPercent: number): Result<ResourceAllocation> {
    if (newPercent < 0 || newPercent > 200) {
      return Result.fail('allocation percent must be between 0 and 200')
    }

    this.props.allocationPercent = newPercent
    this.touch()
    return Result.ok(this)
  }

  public reschedule(newStartDate: Date, newFinishDate: Date): Result<ResourceAllocation> {
    if (newStartDate >= newFinishDate) {
      return Result.fail('start date must be before finish date')
    }

    this.props.startDate = newStartDate
    this.props.finishDate = newFinishDate
    this.touch()
    return Result.ok(this)
  }

  public updateActualCost(cost: Money): Result<ResourceAllocation> {
    if (cost.amount < 0) {
      return Result.fail('cost cannot be negative')
    }

    if (cost.currency !== this.estimatedCost.currency) {
      return Result.fail('actual cost currency must match estimated cost currency')
    }

    this.props.actualCost = cost
    this.touch()
    return Result.ok(this)
  }

  public addNotes(notes: string): Result<ResourceAllocation> {
    this.props.notes = notes.trim()
    this.touch()
    return Result.ok(this)
  }

  public overlaps(other: ResourceAllocation): boolean {
    // Check if this allocation overlaps with another
    return this.startDate <= other.finishDate && this.finishDate >= other.startDate
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(
    props: ResourceAllocationProps,
    id?: UniqueEntityID,
  ): Result<ResourceAllocation> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.taskId, argumentName: 'taskId' },
      { argument: props.resourceId, argumentName: 'resourceId' },
      { argument: props.resourceType, argumentName: 'resourceType' },
      { argument: props.resourceName, argumentName: 'resourceName' },
      { argument: props.allocationPercent, argumentName: 'allocationPercent' },
      { argument: props.startDate, argumentName: 'startDate' },
      { argument: props.finishDate, argumentName: 'finishDate' },
      { argument: props.estimatedCost, argumentName: 'estimatedCost' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!RESOURCE_TYPES.includes(props.resourceType)) {
      return Result.fail('resource type is invalid')
    }

    if (props.allocationPercent < 0 || props.allocationPercent > 200) {
      return Result.fail('allocation percent must be between 0 and 200')
    }

    if (props.startDate >= props.finishDate) {
      return Result.fail('start date must be before finish date')
    }

    if (props.estimatedCost.amount < 0) {
      return Result.fail('estimated cost cannot be negative')
    }

    const trimmedName = props.resourceName.trim()
    if (trimmedName.length === 0) {
      return Result.fail('resource name cannot be empty')
    }

    return Result.ok(
      new ResourceAllocation(
        {
          ...props,
          resourceName: trimmedName,
          notes: props.notes?.trim(),
        },
        id,
      ),
    )
  }
}
