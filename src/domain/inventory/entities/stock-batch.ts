import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { BatchNumber } from '../value-objects/batch-number'
import type { LotNumber } from '../value-objects/lot-number'

export type StockBatchProps = {
  itemId: UniqueEntityID
  batchNumber: BatchNumber
  lotNumber?: LotNumber
  quantityAvailable: number
  quantityAllocated: number
  unit: string
  manufacturingDate?: Date
  expirationDate?: Date
  receivedDate: Date
  supplierId?: UniqueEntityID
  certificateNumber?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class StockBatch extends AggregateRoot<StockBatchProps> {
  private constructor(props: StockBatchProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get itemId(): UniqueEntityID {
    return this.props.itemId
  }

  get batchNumber(): BatchNumber {
    return this.props.batchNumber
  }

  get lotNumber(): LotNumber | undefined {
    return this.props.lotNumber
  }

  get quantityAvailable(): number {
    return this.props.quantityAvailable
  }

  get quantityAllocated(): number {
    return this.props.quantityAllocated
  }

  get unit(): string {
    return this.props.unit
  }

  get manufacturingDate(): Date | undefined {
    return this.props.manufacturingDate
  }

  get expirationDate(): Date | undefined {
    return this.props.expirationDate
  }

  get receivedDate(): Date {
    return this.props.receivedDate
  }

  get supplierId(): UniqueEntityID | undefined {
    return this.props.supplierId
  }

  get certificateNumber(): string | undefined {
    return this.props.certificateNumber
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
    props: StockBatchProps,
    id?: UniqueEntityID,
  ): Result<StockBatch> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.itemId, argumentName: 'itemId' },
      { argument: props.batchNumber, argumentName: 'batchNumber' },
      { argument: props.quantityAvailable, argumentName: 'quantityAvailable' },
      { argument: props.quantityAllocated, argumentName: 'quantityAllocated' },
      { argument: props.receivedDate, argumentName: 'receivedDate' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.expirationDate && props.expirationDate < new Date()) {
      return Result.fail('Cannot create batch with expired expiration date')
    }

    if (props.manufacturingDate && props.expirationDate) {
      if (props.manufacturingDate > props.expirationDate) {
        return Result.fail('Manufacturing date cannot be after expiration date')
      }
    }

    return Result.ok(new StockBatch(props, id))
  }

  public allocate(quantity: number): Result<void> {
    if (quantity < 0) {
      return Result.fail<void>('Quantity cannot be negative')
    }

    const newAllocated = this.props.quantityAllocated + quantity
    const available = this.props.quantityAvailable

    if (newAllocated > available) {
      return Result.fail<void>('Cannot allocate more than available quantity')
    }

    this.props.quantityAllocated = newAllocated
    this.touch()
    return Result.ok<void>(undefined)
  }

  public releaseAllocation(quantity: number): Result<void> {
    if (quantity < 0) {
      return Result.fail<void>('Quantity cannot be negative')
    }

    const newAllocated = this.props.quantityAllocated - quantity

    if (newAllocated < 0) {
      return Result.fail<void>('Cannot release more than allocated quantity')
    }

    this.props.quantityAllocated = newAllocated
    this.touch()
    return Result.ok<void>(undefined)
  }

  public consume(quantity: number): Result<void> {
    if (quantity < 0) {
      return Result.fail<void>('Quantity cannot be negative')
    }

    const newAvailable = this.props.quantityAvailable - quantity

    if (newAvailable < 0) {
      return Result.fail<void>('Insufficient quantity available')
    }

    this.props.quantityAvailable = newAvailable
    this.props.quantityAllocated = Math.max(0, this.props.quantityAllocated - quantity)
    this.touch()
    return Result.ok<void>(undefined)
  }

  public isExpired(): boolean {
    if (!this.props.expirationDate) {
      return false
    }
    return this.props.expirationDate < new Date()
  }

  public isExpiringSoon(daysThreshold: number = 30): boolean {
    if (!this.props.expirationDate) {
      return false
    }
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)
    return this.props.expirationDate < thresholdDate && !this.isExpired()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
