import { Result, UniqueEntityID, Money, GeoCoordinate } from '@domain/shared'
import {
  Equipment,
  type EquipmentRepository,
  type EquipmentCategory,
  type EquipmentStatus,
  type DepreciationMethod,
  AssetNumber,
  GPSLocation,
  OperatingHours,
} from '@domain/equipment'

/**
 * Equipment Application Service
 * Orchestrates equipment management use cases
 */

// ============================================================================
// Input Types
// ============================================================================

export type CreateEquipmentInput = {
  assetNumber: string
  name: string
  category: EquipmentCategory
  description?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  year?: number
  qrCode?: string
  rfidTag?: string
  barcode?: string
  acquisitionDate: Date
  acquisitionCost: number
  depreciationMethod: DepreciationMethod
  salvageValue?: number
  warrantyExpiryDate?: Date
  insuranceExpiryDate?: Date
}

export type UpdateEquipmentInput = {
  equipmentId: string
  name?: string
  description?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  year?: number
  qrCode?: string
  rfidTag?: string
  barcode?: string
}

export type AssignEquipmentInput = {
  equipmentId: string
  projectId: string
  siteId?: string
  userId?: string
  expectedReturnDate?: Date
}

export type ReleaseEquipmentInput = {
  equipmentId: string
}

export type UpdateLocationInput = {
  equipmentId: string
  location: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number
    address?: string
  }
}

export type AddOperatingHoursInput = {
  equipmentId: string
  hours: number
}

export type ScheduleMaintenanceInput = {
  equipmentId: string
  intervalHours?: number
  intervalMileage?: number
  intervalDays?: number
  nextMaintenanceDate?: Date
}

export type CompleteMaintenanceInput = {
  equipmentId: string
  maintenanceDate: Date
  cost?: number
  notes?: string
}

export type RetireEquipmentInput = {
  equipmentId: string
  retirementDate: Date
  reason?: string
  disposalValue?: number
}

// ============================================================================
// Output Types
// ============================================================================

export type EquipmentDTO = {
  id: string
  assetNumber: string
  name: string
  category: EquipmentCategory
  status: EquipmentStatus
  description?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  year?: number
  qrCode?: string
  rfidTag?: string
  barcode?: string
  currentLocation?: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number
    timestamp: Date
    address?: string
  }
  homeLocation?: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number
    timestamp: Date
    address?: string
  }
  currentProjectId?: string
  currentSiteId?: string
  assignedToUserId?: string
  assignmentDate?: Date
  expectedReturnDate?: Date
  totalOperatingHours: number
  utilizationRate?: number
  lastUsedDate?: Date
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  maintenanceIntervalHours?: number
  maintenanceIntervalMileage?: number
  maintenanceIntervalDays?: number
  acquisitionDate: Date
  acquisitionCost: number
  currentValue?: number
  depreciationMethod: DepreciationMethod
  depreciationRate?: number
  salvageValue?: number
  warrantyExpiryDate?: Date
  insuranceExpiryDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type EquipmentSummary = {
  id: string
  assetNumber: string
  name: string
  category: EquipmentCategory
  status: EquipmentStatus
  currentProjectId?: string
  utilizationRate?: number
  nextMaintenanceDate?: Date
}

export type EquipmentUtilizationReport = {
  equipmentId: string
  assetNumber: string
  name: string
  totalHoursUsed: number
  averageHoursPerDay: number
  utilizationRate: number
  idleTimeHours: number
  costPerHour: number
  lastUsedDate?: Date
}

export type MaintenanceDueReport = {
  equipmentId: string
  assetNumber: string
  name: string
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  isOverdue: boolean
  daysOverdue?: number
}

// ============================================================================
// Equipment Service
// ============================================================================

export class EquipmentService {
  private readonly equipmentRepo: EquipmentRepository

  constructor(equipmentRepo: EquipmentRepository) {
    this.equipmentRepo = equipmentRepo
  }

  /**
   * Create new equipment
   */
  async createEquipment(input: CreateEquipmentInput): Promise<Result<EquipmentDTO>> {
    try {
      // Create AssetNumber value object
      const assetNumberResult = AssetNumber.create(input.assetNumber)
      if (!assetNumberResult.isSuccess) {
        return Result.fail(assetNumberResult.error ?? 'Invalid asset number')
      }

      // Create OperatingHours (starting at 0)
      const operatingHours = OperatingHours.zero()

      // Create Money values
      const acquisitionCost = Money.create(input.acquisitionCost, 'USD')
      if (!acquisitionCost.isSuccess) {
        return Result.fail(acquisitionCost.error ?? 'Invalid acquisition cost')
      }

      const salvageValue = input.salvageValue
        ? Money.create(input.salvageValue, 'USD')
        : Money.create(0, 'USD')
      if (!salvageValue.isSuccess) {
        return Result.fail(salvageValue.error ?? 'Invalid salvage value')
      }

      // Create Equipment entity
      const equipmentResult = Equipment.create({
        assetNumber: assetNumberResult.value!,
        name: input.name,
        category: input.category,
        status: 'AVAILABLE',
        description: input.description,
        manufacturer: input.manufacturer,
        model: input.model,
        serialNumber: input.serialNumber,
        year: input.year,
        qrCode: input.qrCode,
        rfidTag: input.rfidTag,
        barcode: input.barcode,
        totalOperatingHours: operatingHours,
        acquisitionDate: input.acquisitionDate,
        acquisitionCost: acquisitionCost.value!,
        currentValue: acquisitionCost.value!,
        depreciationMethod: input.depreciationMethod,
        salvageValue: salvageValue.value!,
        warrantyExpiryDate: input.warrantyExpiryDate,
        insuranceExpiryDate: input.insuranceExpiryDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (!equipmentResult.isSuccess) {
        return Result.fail(equipmentResult.error ?? 'Failed to create equipment')
      }

      // Save to repository
      await this.equipmentRepo.save(equipmentResult.value!)

      return Result.ok(this.toDTO(equipmentResult.value!))
    } catch (error) {
      return Result.fail(`Failed to create equipment: ${error}`)
    }
  }

  /**
   * Get equipment by ID
   */
  async getEquipmentById(equipmentId: string): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }
      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to get equipment: ${error}`)
    }
  }

  /**
   * Get equipment by asset number
   */
  async getEquipmentByAssetNumber(assetNumber: string): Promise<Result<EquipmentDTO>> {
    try {
      const assetNumberResult = AssetNumber.create(assetNumber)
      if (!assetNumberResult.isSuccess) {
        return Result.fail(assetNumberResult.error ?? 'Invalid asset number')
      }

      const equipment = await this.equipmentRepo.findByAssetNumber(assetNumberResult.value!)
      if (!equipment) {
        return Result.fail('Equipment not found')
      }
      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to get equipment: ${error}`)
    }
  }

  /**
   * List all equipment with optional filters
   */
  async listEquipment(filters?: {
    category?: EquipmentCategory
    status?: EquipmentStatus
    projectId?: string
    siteId?: string
  }): Promise<Result<EquipmentSummary[]>> {
    try {
      let equipmentList: Equipment[]

      if (filters?.projectId) {
        equipmentList = await this.equipmentRepo.findByProject(filters.projectId)
      } else if (filters?.siteId) {
        equipmentList = await this.equipmentRepo.findBySite(filters.siteId)
      } else if (filters?.category) {
        equipmentList = await this.equipmentRepo.findByCategory(filters.category)
      } else if (filters?.status) {
        equipmentList = await this.equipmentRepo.findByStatus(filters.status)
      } else {
        equipmentList = await this.equipmentRepo.findAll()
      }

      // Apply additional filters if multiple are provided
      if (filters) {
        equipmentList = equipmentList.filter((equipment) => {
          if (filters.category && equipment.category !== filters.category) return false
          if (filters.status && equipment.status !== filters.status) return false
          if (filters.projectId && equipment.currentProjectId?.toString() !== filters.projectId) return false
          if (filters.siteId && equipment.currentSiteId?.toString() !== filters.siteId) return false
          return true
        })
      }

      const summaries = equipmentList.map((equipment) => this.toSummary(equipment))
      return Result.ok(summaries)
    } catch (error) {
      return Result.fail(`Failed to list equipment: ${error}`)
    }
  }

  /**
   * Update equipment information
   */
  async updateEquipment(_input: UpdateEquipmentInput): Promise<Result<EquipmentDTO>> {
    try {
      // TODO: Load equipment
      // TODO: Update fields
      // TODO: Validate changes
      // TODO: Save to repository
      // TODO: Return updated DTO

      return Result.fail('Not implemented yet')
    } catch (error) {
      return Result.fail(`Failed to update equipment: ${error}`)
    }
  }

  /**
   * Assign equipment to project/site/user
   */
  async assignEquipment(input: AssignEquipmentInput): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const assignResult = equipment.assignToProject(
        new UniqueEntityID(input.projectId),
        input.siteId ? new UniqueEntityID(input.siteId) : undefined,
        input.userId ? new UniqueEntityID(input.userId) : undefined,
        input.expectedReturnDate,
      )

      if (!assignResult.isSuccess) {
        return Result.fail(assignResult.error ?? 'Failed to assign equipment')
      }

      await this.equipmentRepo.save(equipment)
      // TODO: Emit domain event for GPS tracking to start

      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to assign equipment: ${error}`)
    }
  }

  /**
   * Release equipment from assignment
   */
  async releaseEquipment(input: ReleaseEquipmentInput): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const releaseResult = equipment.releaseFromProject()
      if (!releaseResult.isSuccess) {
        return Result.fail(releaseResult.error ?? 'Failed to release equipment')
      }

      await this.equipmentRepo.save(equipment)

      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to release equipment: ${error}`)
    }
  }

  /**
   * Update equipment GPS location
   */
  async updateLocation(input: UpdateLocationInput): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      // Create GeoCoordinate
      const coordinateResult = GeoCoordinate.create(input.location.latitude, input.location.longitude)
      if (!coordinateResult.isSuccess) {
        return Result.fail(coordinateResult.error ?? 'Invalid GPS coordinates')
      }

      // Create GPSLocation
      const locationResult = GPSLocation.create({
        coordinate: coordinateResult.value!,
        accuracy: input.location.accuracy,
        altitude: input.location.altitude,
        timestamp: new Date(),
        address: input.location.address,
      })

      if (!locationResult.isSuccess) {
        return Result.fail(locationResult.error ?? 'Invalid GPS location')
      }

      equipment.updateLocation(locationResult.value!)

      // TODO: Check geofence violations
      // TODO: Save location history

      await this.equipmentRepo.save(equipment)

      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to update location: ${error}`)
    }
  }

  /**
   * Add operating hours to equipment
   */
  async addOperatingHours(input: AddOperatingHoursInput): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const hoursResult = OperatingHours.create(input.hours)
      if (!hoursResult.isSuccess) {
        return Result.fail(hoursResult.error ?? 'Invalid operating hours')
      }

      const addResult = equipment.addOperatingHours(hoursResult.value!)
      if (!addResult.isSuccess) {
        return Result.fail(addResult.error ?? 'Failed to add operating hours')
      }

      await this.equipmentRepo.save(equipment)

      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to add operating hours: ${error}`)
    }
  }

  /**
   * Schedule maintenance for equipment
   */
  async scheduleMaintenance(input: ScheduleMaintenanceInput): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      if (input.nextMaintenanceDate) {
        equipment.scheduleMaintenance(input.nextMaintenanceDate)
      }

      // TODO: Create MaintenanceSchedule entity with intervals

      await this.equipmentRepo.save(equipment)

      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to schedule maintenance: ${error}`)
    }
  }

  /**
   * Complete maintenance for equipment
   */
  async completeMaintenance(input: CompleteMaintenanceInput): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const costMoney = input.cost ? Money.create(input.cost, 'USD') : Money.create(0, 'USD')
      if (!costMoney.isSuccess) {
        return Result.fail(costMoney.error ?? 'Invalid maintenance cost')
      }

      equipment.completeMaintenance(costMoney.value!)

      // TODO: Create maintenance record with notes

      await this.equipmentRepo.save(equipment)

      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to complete maintenance: ${error}`)
    }
  }

  /**
   * Retire equipment
   */
  async retireEquipment(input: RetireEquipmentInput): Promise<Result<EquipmentDTO>> {
    try {
      const equipment = await this.equipmentRepo.findById(new UniqueEntityID(input.equipmentId))
      if (!equipment) {
        return Result.fail('Equipment not found')
      }

      const retireResult = equipment.retire()
      if (!retireResult.isSuccess) {
        return Result.fail(retireResult.error ?? 'Failed to retire equipment')
      }

      // TODO: Stop GPS tracking
      // TODO: Record retirement details (reason, disposal value)

      await this.equipmentRepo.save(equipment)

      return Result.ok(this.toDTO(equipment))
    } catch (error) {
      return Result.fail(`Failed to retire equipment: ${error}`)
    }
  }

  /**
   * Get equipment utilization report
   */
  async getUtilizationReport(
    projectId?: string
  ): Promise<Result<EquipmentUtilizationReport[]>> {
    try {
      let equipmentList: Equipment[]

      if (projectId) {
        equipmentList = await this.equipmentRepo.findByProject(projectId)
      } else {
        equipmentList = await this.equipmentRepo.findAll()
      }

      const reports: EquipmentUtilizationReport[] = equipmentList.map((equipment) => {
        const totalHours = equipment.totalOperatingHours.hours
        const utilizationRate = equipment.utilizationRate?.rate ?? 0

        // Calculate average hours per day (simplified calculation)
        const daysSinceAcquisition = Math.max(
          1,
          Math.floor((new Date().getTime() - equipment.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24))
        )
        const avgHoursPerDay = totalHours / daysSinceAcquisition

        // Calculate idle time (assuming 8 hour work days)
        const expectedWorkHours = daysSinceAcquisition * 8
        const idleHours = Math.max(0, expectedWorkHours - totalHours)

        // Calculate cost per hour (simplified)
        const costPerHour = totalHours > 0 ? equipment.acquisitionCost.amount / totalHours : 0

        return {
          equipmentId: equipment.id.toString(),
          assetNumber: equipment.assetNumber.value,
          name: equipment.name,
          totalHoursUsed: totalHours,
          averageHoursPerDay: avgHoursPerDay,
          utilizationRate,
          idleTimeHours: idleHours,
          costPerHour,
          lastUsedDate: equipment.lastUsedDate,
        }
      })

      return Result.ok(reports)
    } catch (error) {
      return Result.fail(`Failed to generate utilization report: ${error}`)
    }
  }

  /**
   * Get maintenance due report
   */
  async getMaintenanceDueReport(): Promise<Result<MaintenanceDueReport[]>> {
    try {
      const allEquipment = await this.equipmentRepo.findAll()

      // Filter equipment that needs maintenance
      const equipmentNeedingMaintenance = allEquipment.filter((equipment) => {
        return equipment.needsMaintenance() || equipment.isMaintenanceOverdue()
      })

      const reports: MaintenanceDueReport[] = equipmentNeedingMaintenance.map((equipment) => {
        const isOverdue = equipment.isMaintenanceOverdue()
        let daysOverdue: number | undefined

        if (isOverdue && equipment.nextMaintenanceDate) {
          daysOverdue = Math.floor(
            (new Date().getTime() - equipment.nextMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        }

        return {
          equipmentId: equipment.id.toString(),
          assetNumber: equipment.assetNumber.value,
          name: equipment.name,
          lastMaintenanceDate: equipment.lastMaintenanceDate,
          nextMaintenanceDate: equipment.nextMaintenanceDate,
          isOverdue,
          daysOverdue,
        }
      })

      return Result.ok(reports)
    } catch (error) {
      return Result.fail(`Failed to generate maintenance due report: ${error}`)
    }
  }

  /**
   * Get available equipment
   */
  async getAvailableEquipment(
    category?: EquipmentCategory
  ): Promise<Result<EquipmentSummary[]>> {
    try {
      let equipmentList = await this.equipmentRepo.findByStatus('AVAILABLE')

      if (category) {
        equipmentList = equipmentList.filter((equipment) => equipment.category === category)
      }

      const summaries = equipmentList.map((equipment) => this.toSummary(equipment))
      return Result.ok(summaries)
    } catch (error) {
      return Result.fail(`Failed to get available equipment: ${error}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private toDTO(equipment: Equipment): EquipmentDTO {
    return {
      id: equipment.id.toString(),
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
            latitude: equipment.currentLocation.latitude,
            longitude: equipment.currentLocation.longitude,
            accuracy: equipment.currentLocation.accuracy,
            altitude: equipment.currentLocation.altitude,
            timestamp: equipment.currentLocation.timestamp,
            address: equipment.currentLocation.address,
          }
        : undefined,
      homeLocation: equipment.homeLocation
        ? {
            latitude: equipment.homeLocation.latitude,
            longitude: equipment.homeLocation.longitude,
            accuracy: equipment.homeLocation.accuracy,
            altitude: equipment.homeLocation.altitude,
            timestamp: equipment.homeLocation.timestamp,
            address: equipment.homeLocation.address,
          }
        : undefined,
      currentProjectId: equipment.currentProjectId?.toString(),
      currentSiteId: equipment.currentSiteId?.toString(),
      assignedToUserId: equipment.assignedToUserId?.toString(),
      assignmentDate: equipment.assignmentDate,
      expectedReturnDate: equipment.expectedReturnDate,
      totalOperatingHours: equipment.totalOperatingHours.hours,
      utilizationRate: equipment.utilizationRate?.rate,
      lastUsedDate: equipment.lastUsedDate,
      lastMaintenanceDate: equipment.lastMaintenanceDate,
      nextMaintenanceDate: equipment.nextMaintenanceDate,
      maintenanceIntervalHours: equipment.maintenanceIntervalHours,
      maintenanceIntervalDays: equipment.maintenanceIntervalDays,
      acquisitionDate: equipment.acquisitionDate,
      acquisitionCost: equipment.acquisitionCost.amount,
      currentValue: equipment.currentValue.amount,
      depreciationMethod: equipment.depreciationMethod,
      warrantyExpiryDate: equipment.warrantyExpiryDate,
      insuranceExpiryDate: equipment.insuranceExpiryDate,
      isActive: !equipment.isInUse() && !equipment.isUnderMaintenance(),
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    }
  }

  private toSummary(equipment: Equipment): EquipmentSummary {
    return {
      id: equipment.id.toString(),
      assetNumber: equipment.assetNumber.value,
      name: equipment.name,
      category: equipment.category,
      status: equipment.status,
      currentProjectId: equipment.currentProjectId?.toString(),
      utilizationRate: equipment.utilizationRate?.rate,
      nextMaintenanceDate: equipment.nextMaintenanceDate,
    }
  }
}
