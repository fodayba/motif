import { UniqueEntityID, Money, GeoCoordinate, type CurrencyCode } from '@domain/shared'
import {
  Equipment,
  type EquipmentRepository,
  AssetNumber,
  GPSLocation,
  OperatingHours,
  UtilizationRate,
  type EquipmentCategory,
  type EquipmentStatus,
  type DepreciationMethod,
} from '@domain/equipment'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type EquipmentDocument = FirestoreDocument<{
  assetNumber: string
  name: string
  category: EquipmentCategory
  status: EquipmentStatus
  description?: string

  // Specifications
  manufacturer?: string
  model?: string
  serialNumber?: string
  year?: number

  // Identification
  qrCode?: string
  rfidTag?: string
  barcode?: string

  // Location & Tracking
  currentLocation?: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number
    address?: string
    timestamp: string
  }
  homeLocation?: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number
    address?: string
    timestamp: string
  }

  // Assignment
  currentProjectId?: string
  currentSiteId?: string
  assignedToUserId?: string
  assignmentDate?: string
  expectedReturnDate?: string

  // Operating Metrics
  totalOperatingHours: number
  utilizationRate?: number
  lastUsedDate?: string

  // Maintenance
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  maintenanceIntervalHours?: number
  maintenanceIntervalDays?: number

  // Financial
  acquisitionDate: string
  acquisitionCostAmount: number
  acquisitionCostCurrency: string
  currentValueAmount: number
  currentValueCurrency: string
  depreciationMethod: DepreciationMethod

  // Lifecycle
  warrantyExpiryDate?: string
  insuranceExpiryDate?: string

  // Metadata
  createdAt: string
  updatedAt: string
}>

export class FirebaseEquipmentRepository
  extends FirestoreRepository<Equipment>
  implements EquipmentRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'equipment')
  }

  async findByAssetNumber(assetNumber: AssetNumber): Promise<Equipment | null> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'assetNumber', op: '==', value: assetNumber.value },
      { field: 'assetNumber', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)
    return results[0] ?? null
  }

  async findByStatus(status: EquipmentStatus): Promise<Equipment[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'status', op: '==', value: status },
    ]

    return this.list(constraints)
  }

  async findByCategory(category: EquipmentCategory): Promise<Equipment[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'category', op: '==', value: category },
    ]

    return this.list(constraints)
  }

  async findByProject(projectId: string): Promise<Equipment[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'currentProjectId', op: '==', value: projectId },
    ]

    return this.list(constraints)
  }

  async findBySite(siteId: string): Promise<Equipment[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'currentSiteId', op: '==', value: siteId },
    ]

    return this.list(constraints)
  }

  async findAvailable(): Promise<Equipment[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'status', op: '==', value: 'AVAILABLE' },
    ]

    return this.list(constraints)
  }

  async findNeedingMaintenance(): Promise<Equipment[]> {
    const now = new Date()
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'nextMaintenanceDate', op: '<=', value: now.toISOString() },
    ]

    return this.list(constraints)
  }

  async findAll(): Promise<Equipment[]> {
    return this.list()
  }

  protected toPersistence(equipment: Equipment): EquipmentDocument {
    const doc: EquipmentDocument = {
      assetNumber: equipment.assetNumber.value,
      name: equipment.name,
      category: equipment.category,
      status: equipment.status,
      description: equipment.description,

      manufacturer: equipment.manufacturer,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      year: equipment.year,

      qrCode: equipment.qrCode,
      rfidTag: equipment.rfidTag,
      barcode: equipment.barcode,

      currentLocation: equipment.currentLocation
        ? {
            latitude: equipment.currentLocation.coordinate.latitude,
            longitude: equipment.currentLocation.coordinate.longitude,
            accuracy: equipment.currentLocation.accuracy,
            altitude: equipment.currentLocation.altitude,
            address: equipment.currentLocation.address,
            timestamp: equipment.currentLocation.timestamp.toISOString(),
          }
        : undefined,

      homeLocation: equipment.homeLocation
        ? {
            latitude: equipment.homeLocation.coordinate.latitude,
            longitude: equipment.homeLocation.coordinate.longitude,
            accuracy: equipment.homeLocation.accuracy,
            altitude: equipment.homeLocation.altitude,
            address: equipment.homeLocation.address,
            timestamp: equipment.homeLocation.timestamp.toISOString(),
          }
        : undefined,

      currentProjectId: equipment.currentProjectId?.toString(),
      currentSiteId: equipment.currentSiteId?.toString(),
      assignedToUserId: equipment.assignedToUserId?.toString(),
      assignmentDate: equipment.assignmentDate?.toISOString(),
      expectedReturnDate: equipment.expectedReturnDate?.toISOString(),

      totalOperatingHours: equipment.totalOperatingHours.hours,
      utilizationRate: equipment.utilizationRate?.rate,
      lastUsedDate: equipment.lastUsedDate?.toISOString(),

      lastMaintenanceDate: equipment.lastMaintenanceDate?.toISOString(),
      nextMaintenanceDate: equipment.nextMaintenanceDate?.toISOString(),
      maintenanceIntervalHours: equipment.maintenanceIntervalHours,
      maintenanceIntervalDays: equipment.maintenanceIntervalDays,

      acquisitionDate: equipment.acquisitionDate.toISOString(),
      acquisitionCostAmount: equipment.acquisitionCost.amount,
      acquisitionCostCurrency: equipment.acquisitionCost.currency,
      currentValueAmount: equipment.currentValue.amount,
      currentValueCurrency: equipment.currentValue.currency,
      depreciationMethod: equipment.depreciationMethod,

      warrantyExpiryDate: equipment.warrantyExpiryDate?.toISOString(),
      insuranceExpiryDate: equipment.insuranceExpiryDate?.toISOString(),

      createdAt: equipment.createdAt.toISOString(),
      updatedAt: equipment.updatedAt.toISOString(),
    }

    return doc
  }

  protected toDomain(document: EquipmentDocument & { id: string }): Equipment | null {
    const assetNumberResult = AssetNumber.create(document.assetNumber)
    if (!assetNumberResult.isSuccess) {
      console.error('Failed to create AssetNumber:', assetNumberResult.error)
      return null
    }

    const operatingHoursResult = OperatingHours.create(document.totalOperatingHours)
    if (!operatingHoursResult.isSuccess) {
      console.error('Failed to create OperatingHours:', operatingHoursResult.error)
      return null
    }

    const acquisitionCostResult = Money.create(
      document.acquisitionCostAmount,
      document.acquisitionCostCurrency as CurrencyCode,
    )
    if (!acquisitionCostResult.isSuccess) {
      console.error('Failed to create acquisition cost:', acquisitionCostResult.error)
      return null
    }

    const currentValueResult = Money.create(
      document.currentValueAmount,
      document.currentValueCurrency as CurrencyCode,
    )
    if (!currentValueResult.isSuccess) {
      console.error('Failed to create current value:', currentValueResult.error)
      return null
    }

    let currentLocation: GPSLocation | undefined
    if (document.currentLocation) {
      const coordResult = GeoCoordinate.create(
        document.currentLocation.latitude,
        document.currentLocation.longitude,
      )
      if (coordResult.isSuccess && coordResult.value) {
        const locationResult = GPSLocation.create({
          coordinate: coordResult.value,
          accuracy: document.currentLocation.accuracy,
          altitude: document.currentLocation.altitude,
          address: document.currentLocation.address,
          timestamp: new Date(document.currentLocation.timestamp),
        })
        if (locationResult.isSuccess && locationResult.value) {
          currentLocation = locationResult.value
        }
      }
    }

    let homeLocation: GPSLocation | undefined
    if (document.homeLocation) {
      const coordResult = GeoCoordinate.create(
        document.homeLocation.latitude,
        document.homeLocation.longitude,
      )
      if (coordResult.isSuccess && coordResult.value) {
        const locationResult = GPSLocation.create({
          coordinate: coordResult.value,
          accuracy: document.homeLocation.accuracy,
          altitude: document.homeLocation.altitude,
          address: document.homeLocation.address,
          timestamp: new Date(document.homeLocation.timestamp),
        })
        if (locationResult.isSuccess && locationResult.value) {
          homeLocation = locationResult.value
        }
      }
    }

    let utilizationRate: UtilizationRate | undefined
    if (document.utilizationRate !== undefined) {
      const utilizationResult = UtilizationRate.create(document.utilizationRate)
      if (utilizationResult.isSuccess && utilizationResult.value) {
        utilizationRate = utilizationResult.value
      }
    }

    const equipmentResult = Equipment.create(
      {
        assetNumber: assetNumberResult.value!,
        name: document.name,
        category: document.category,
        status: document.status,
        description: document.description,

        manufacturer: document.manufacturer,
        model: document.model,
        serialNumber: document.serialNumber,
        year: document.year,

        qrCode: document.qrCode,
        rfidTag: document.rfidTag,
        barcode: document.barcode,

        currentLocation,
        homeLocation,

        currentProjectId: document.currentProjectId
          ? new UniqueEntityID(document.currentProjectId)
          : undefined,
        currentSiteId: document.currentSiteId
          ? new UniqueEntityID(document.currentSiteId)
          : undefined,
        assignedToUserId: document.assignedToUserId
          ? new UniqueEntityID(document.assignedToUserId)
          : undefined,
        assignmentDate: document.assignmentDate ? new Date(document.assignmentDate) : undefined,
        expectedReturnDate: document.expectedReturnDate
          ? new Date(document.expectedReturnDate)
          : undefined,

        totalOperatingHours: operatingHoursResult.value!,
        utilizationRate,
        lastUsedDate: document.lastUsedDate ? new Date(document.lastUsedDate) : undefined,

        lastMaintenanceDate: document.lastMaintenanceDate
          ? new Date(document.lastMaintenanceDate)
          : undefined,
        nextMaintenanceDate: document.nextMaintenanceDate
          ? new Date(document.nextMaintenanceDate)
          : undefined,
        maintenanceIntervalHours: document.maintenanceIntervalHours,
        maintenanceIntervalDays: document.maintenanceIntervalDays,

        acquisitionDate: new Date(document.acquisitionDate),
        acquisitionCost: acquisitionCostResult.value!,
        currentValue: currentValueResult.value!,
        depreciationMethod: document.depreciationMethod,

        warrantyExpiryDate: document.warrantyExpiryDate
          ? new Date(document.warrantyExpiryDate)
          : undefined,
        insuranceExpiryDate: document.insuranceExpiryDate
          ? new Date(document.insuranceExpiryDate)
          : undefined,

        createdAt: new Date(document.createdAt),
        updatedAt: new Date(document.updatedAt),
      },
      new UniqueEntityID(document.id),
    )

    if (!equipmentResult.isSuccess) {
      console.error('Failed to create Equipment:', equipmentResult.error)
      return null
    }

    return equipmentResult.value ?? null
  }

  protected obtainId(equipment: Equipment): UniqueEntityID {
    return equipment.id
  }
}
