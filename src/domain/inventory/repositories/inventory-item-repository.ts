import type { UniqueEntityID } from '../../shared'
import type { InventoryItem } from '../entities/inventory-item'
import type { ItemSku } from '../value-objects/item-sku'

export interface InventoryItemRepository {
  findById(id: UniqueEntityID): Promise<InventoryItem | null>
  findBySku(sku: ItemSku): Promise<InventoryItem | null>
  listBySite(siteId: string): Promise<InventoryItem[]>
  save(item: InventoryItem): Promise<void>
  delete(item: InventoryItem): Promise<void>
}
