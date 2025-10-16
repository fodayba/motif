import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { StockMovementType } from '../enums/stock-movement-type'
import { STOCK_MOVEMENT_TYPES } from '../enums/stock-movement-type'

export type StockMovementProps = {
  itemId: UniqueEntityID
  type: StockMovementType
  quantity: number
  unit: string
  fromLocationId?: UniqueEntityID
  toLocationId?: UniqueEntityID
  batchNumber?: string
  lotNumber?: string
  referenceType?: 'purchase-order' | 'transfer' | 'requisition' | 'adjustment' | 'cycle-count'
  referenceId?: UniqueEntityID
  userId: UniqueEntityID
  notes?: string
  timestamp: Date
  createdAt: Date
}

export class StockMovement extends AggregateRoot<StockMovementProps> {
  private constructor(props: StockMovementProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get itemId(): UniqueEntityID {
    return this.props.itemId
  }

  get type(): StockMovementType {
    return this.props.type
  }

  get quantity(): number {
    return this.props.quantity
  }

  get unit(): string {
    return this.props.unit
  }

  get fromLocationId(): UniqueEntityID | undefined {
    return this.props.fromLocationId
  }

  get toLocationId(): UniqueEntityID | undefined {
    return this.props.toLocationId
  }

  get batchNumber(): string | undefined {
    return this.props.batchNumber
  }

  get lotNumber(): string | undefined {
    return this.props.lotNumber
  }

  get referenceType(): string | undefined {
    return this.props.referenceType
  }

  get referenceId(): UniqueEntityID | undefined {
    return this.props.referenceId
  }

  get userId(): UniqueEntityID {
    return this.props.userId
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get timestamp(): Date {
    return this.props.timestamp
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  public static create(
    props: StockMovementProps,
    id?: UniqueEntityID,
  ): Result<StockMovement> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.itemId, argumentName: 'itemId' },
      { argument: props.type, argumentName: 'type' },
      { argument: props.quantity, argumentName: 'quantity' },
      { argument: props.unit, argumentName: 'unit' },
      { argument: props.userId, argumentName: 'userId' },
      { argument: props.timestamp, argumentName: 'timestamp' },
      { argument: props.createdAt, argumentName: 'createdAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!STOCK_MOVEMENT_TYPES.includes(props.type)) {
      return Result.fail('Invalid stock movement type')
    }

    if (props.quantity === 0) {
      return Result.fail('Quantity cannot be zero')
    }

    return Result.ok(new StockMovement(props, id))
  }

  public isInbound(): boolean {
    return ['receipt', 'transfer-in', 'return', 'production'].includes(this.props.type)
  }

  public isOutbound(): boolean {
    return ['issue', 'transfer-out', 'consumption', 'write-off'].includes(this.props.type)
  }
}
