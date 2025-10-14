import {
  AggregateRoot,
  Guard,
  Money,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { InventoryItemStatus } from '../enums/inventory-item-status'
import { INVENTORY_ITEM_STATUSES } from '../enums/inventory-item-status'
import type { ItemSku } from '../value-objects/item-sku'
import type { StockQuantity } from '../value-objects/stock-quantity'
import type { StorageLocation } from '../value-objects/storage-location'

export type InventoryItemProps = {
  sku: ItemSku
  name: string
  description?: string
  category: string
  status: InventoryItemStatus
  quantityOnHand: StockQuantity
  reorderPoint: number
  preferredVendorId?: UniqueEntityID
  unitCost: Money
  storageLocation: StorageLocation
  createdAt: Date
  updatedAt: Date
}

export class InventoryItem extends AggregateRoot<InventoryItemProps> {
  private constructor(props: InventoryItemProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get sku(): ItemSku {
    return this.props.sku
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get category(): string {
    return this.props.category
  }

  get status(): InventoryItemStatus {
    return this.props.status
  }

  get quantityOnHand(): StockQuantity {
    return this.props.quantityOnHand
  }

  get reorderPoint(): number {
    return this.props.reorderPoint
  }

  get preferredVendorId(): UniqueEntityID | undefined {
    return this.props.preferredVendorId
  }

  get unitCost(): Money {
    return this.props.unitCost
  }

  get storageLocation(): StorageLocation {
    return this.props.storageLocation
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(
    props: InventoryItemProps,
    id?: UniqueEntityID,
  ): Result<InventoryItem> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.sku, argumentName: 'sku' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.category, argumentName: 'category' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.quantityOnHand, argumentName: 'quantityOnHand' },
      { argument: props.unitCost, argumentName: 'unitCost' },
      { argument: props.storageLocation, argumentName: 'storageLocation' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!INVENTORY_ITEM_STATUSES.includes(props.status)) {
      return Result.fail('inventory status is invalid')
    }

    if (props.reorderPoint < 0) {
      return Result.fail('reorder point cannot be negative')
    }

    return Result.ok(
      new InventoryItem(
        {
          ...props,
          name: props.name.trim(),
          category: props.category.trim(),
          description: props.description?.trim(),
        },
        id,
      ),
    )
  }

  public updateQuantity(quantity: StockQuantity) {
    this.props.quantityOnHand = quantity
    this.touch()
  }

  public updateStatus(status: InventoryItemStatus) {
    if (!INVENTORY_ITEM_STATUSES.includes(status)) {
      throw new Error('inventory status is invalid')
    }

    this.props.status = status
    this.touch()
  }

  public setReorderPoint(point: number) {
    if (point < 0) {
      throw new Error('reorder point cannot be negative')
    }

    this.props.reorderPoint = point
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
