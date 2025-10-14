import { Guard, Money, Result, UniqueEntityID, ValueObject } from '../../shared'

type PurchaseOrderItemProps = {
  lineId: UniqueEntityID
  referenceId: UniqueEntityID
  description: string
  quantity: number
  unitOfMeasure: string
  unitCost: Money
  expectedDate?: Date
}

export class PurchaseOrderItem extends ValueObject<PurchaseOrderItemProps> {
  private constructor(props: PurchaseOrderItemProps) {
    super(props)
  }

  get lineId(): UniqueEntityID {
    return this.props.lineId
  }

  get referenceId(): UniqueEntityID {
    return this.props.referenceId
  }

  get description(): string {
    return this.props.description
  }

  get quantity(): number {
    return this.props.quantity
  }

  get unitOfMeasure(): string {
    return this.props.unitOfMeasure
  }

  get unitCost(): Money {
    return this.props.unitCost
  }

  get expectedDate(): Date | undefined {
    return this.props.expectedDate
  }

  get lineTotal(): number {
    return this.props.unitCost.amount * this.props.quantity
  }

  public static create(
    props: Omit<PurchaseOrderItemProps, 'lineId'> & { lineId?: UniqueEntityID },
  ): Result<PurchaseOrderItem> {
    const id = props.lineId ?? new UniqueEntityID()

    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.referenceId, argumentName: 'referenceId' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.quantity, argumentName: 'quantity' },
      { argument: props.unitOfMeasure, argumentName: 'unitOfMeasure' },
      { argument: props.unitCost, argumentName: 'unitCost' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.quantity <= 0) {
      return Result.fail('quantity must be greater than zero')
    }

    return Result.ok(
      new PurchaseOrderItem({
        lineId: id,
        referenceId: props.referenceId,
        description: props.description.trim(),
        quantity: props.quantity,
        unitOfMeasure: props.unitOfMeasure,
        unitCost: props.unitCost,
        expectedDate: props.expectedDate,
      }),
    )
  }
}
