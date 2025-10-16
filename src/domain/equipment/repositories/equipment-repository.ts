import type { UniqueEntityID } from '../../shared'
import type { Equipment } from '../entities/equipment'
import type { EquipmentCategory } from '../enums/equipment-category'
import type { EquipmentStatus } from '../enums/equipment-status'
import type { AssetNumber } from '../value-objects/asset-number'

export interface EquipmentRepository {
  findById(id: UniqueEntityID): Promise<Equipment | null>
  findByAssetNumber(assetNumber: AssetNumber): Promise<Equipment | null>
  findByCategory(category: EquipmentCategory): Promise<Equipment[]>
  findByStatus(status: EquipmentStatus): Promise<Equipment[]>
  findByProject(projectId: string): Promise<Equipment[]>
  findBySite(siteId: string): Promise<Equipment[]>
  findAll(): Promise<Equipment[]>
  findAvailable(): Promise<Equipment[]>
  findNeedingMaintenance(): Promise<Equipment[]>
  save(equipment: Equipment): Promise<void>
  delete(equipment: Equipment): Promise<void>
}
