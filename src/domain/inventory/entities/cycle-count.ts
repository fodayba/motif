import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { CycleCountStatus } from '../enums/cycle-count-status'
import { CYCLE_COUNT_STATUSES } from '../enums/cycle-count-status'

export type CycleCountItemProps = {
  itemId: UniqueEntityID
  itemName: string
  sku: string
  expectedQuantity: number
  countedQuantity?: number
  unit: string
  batchNumber?: string
  lotNumber?: string
  variance?: number
  variancePercentage?: number
  notes?: string
}

export type CycleCountProps = {
  countNumber: string
  status: CycleCountStatus
  locationId: UniqueEntityID
  countType: 'full' | 'partial' | 'abc-based' | 'spot-check'
  items: CycleCountItemProps[]
  scheduledDate: Date
  startedAt?: Date
  completedAt?: Date
  assignedToId: UniqueEntityID
  completedById?: UniqueEntityID
  accuracyPercentage?: number
  totalVarianceValue?: number
  requiresRecount: boolean
  recountReason?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class CycleCount extends AggregateRoot<CycleCountProps> {
  private constructor(props: CycleCountProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get countNumber(): string {
    return this.props.countNumber
  }

  get status(): CycleCountStatus {
    return this.props.status
  }

  get locationId(): UniqueEntityID {
    return this.props.locationId
  }

  get countType(): 'full' | 'partial' | 'abc-based' | 'spot-check' {
    return this.props.countType
  }

  get items(): CycleCountItemProps[] {
    return this.props.items
  }

  get scheduledDate(): Date {
    return this.props.scheduledDate
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt
  }

  get assignedToId(): UniqueEntityID {
    return this.props.assignedToId
  }

  get completedById(): UniqueEntityID | undefined {
    return this.props.completedById
  }

  get accuracyPercentage(): number | undefined {
    return this.props.accuracyPercentage
  }

  get totalVarianceValue(): number | undefined {
    return this.props.totalVarianceValue
  }

  get requiresRecount(): boolean {
    return this.props.requiresRecount
  }

  get recountReason(): string | undefined {
    return this.props.recountReason
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

  public static create(
    props: CycleCountProps,
    id?: UniqueEntityID,
  ): Result<CycleCount> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.countNumber, argumentName: 'countNumber' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.locationId, argumentName: 'locationId' },
      { argument: props.countType, argumentName: 'countType' },
      { argument: props.items, argumentName: 'items' },
      { argument: props.scheduledDate, argumentName: 'scheduledDate' },
      { argument: props.assignedToId, argumentName: 'assignedToId' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!CYCLE_COUNT_STATUSES.includes(props.status)) {
      return Result.fail('Invalid cycle count status')
    }

    if (props.items.length === 0) {
      return Result.fail('Cycle count must have at least one item')
    }

    return Result.ok(new CycleCount(props, id))
  }

  public start(): Result<void> {
    if (this.props.status !== 'scheduled') {
      return Result.fail<void>('Can only start scheduled cycle counts')
    }

    this.props.status = 'in-progress'
    this.props.startedAt = new Date()
    this.touch()
    return Result.ok<void>(undefined)
  }

  public recordCount(itemId: UniqueEntityID, countedQuantity: number, notes?: string): Result<void> {
    if (this.props.status !== 'in-progress') {
      return Result.fail<void>('Cycle count must be in progress')
    }

    const item = this.props.items.find(i => i.itemId.equals(itemId))
    if (!item) {
      return Result.fail<void>('Item not found in cycle count')
    }

    item.countedQuantity = countedQuantity
    item.variance = countedQuantity - item.expectedQuantity
    item.variancePercentage = item.expectedQuantity > 0 
      ? (item.variance / item.expectedQuantity) * 100 
      : 0
    if (notes) {
      item.notes = notes
    }

    this.touch()
    return Result.ok<void>(undefined)
  }

  public complete(completedById: UniqueEntityID): Result<void> {
    if (this.props.status !== 'in-progress') {
      return Result.fail<void>('Cycle count must be in progress to complete')
    }

    // Check if all items have been counted
    const uncountedItems = this.props.items.filter(i => i.countedQuantity === undefined)
    if (uncountedItems.length > 0) {
      return Result.fail<void>('All items must be counted before completing')
    }

    this.calculateAccuracy()
    
    this.props.status = 'completed'
    this.props.completedById = completedById
    this.props.completedAt = new Date()
    this.touch()
    return Result.ok<void>(undefined)
  }

  public flagForRecount(reason: string): Result<void> {
    if (this.props.status !== 'in-progress') {
      return Result.fail<void>('Can only flag in-progress counts for recount')
    }

    this.props.requiresRecount = true
    this.props.recountReason = reason
    this.props.status = 'requires-recount'
    this.touch()
    return Result.ok<void>(undefined)
  }

  public cancel(): Result<void> {
    if (this.props.status === 'completed') {
      return Result.fail<void>('Cannot cancel completed cycle count')
    }

    this.props.status = 'cancelled'
    this.touch()
    return Result.ok<void>(undefined)
  }

  private calculateAccuracy(): void {
    const totalItems = this.props.items.length
    const accurateItems = this.props.items.filter(i => 
      Math.abs(i.variancePercentage || 0) <= 2 // 2% tolerance
    ).length

    this.props.accuracyPercentage = (accurateItems / totalItems) * 100
  }

  public getItemsWithVariance(): CycleCountItemProps[] {
    return this.props.items.filter(i => 
      i.variance !== undefined && i.variance !== 0
    )
  }

  public getSignificantVariances(threshold: number = 5): CycleCountItemProps[] {
    return this.props.items.filter(i => 
      Math.abs(i.variancePercentage || 0) > threshold
    )
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
