import { Result, UniqueEntityID, GeoCoordinate } from '@domain/shared'
import {
  Geofence,
  GPSLocation,
  type GeofenceAlertType,
} from '@domain/equipment'

/**
 * Geofence Application Service
 * Orchestrates geofence management and alert use cases
 */

// ============================================================================
// Repository Interfaces (to be implemented in infrastructure layer)
// ============================================================================

export interface GeofenceRepository {
  findById(id: UniqueEntityID): Promise<Geofence | null>
  findAll(): Promise<Geofence[]>
  findActive(): Promise<Geofence[]>
  findByProject(projectId: UniqueEntityID): Promise<Geofence[]>
  findBySite(siteId: UniqueEntityID): Promise<Geofence[]>
  save(geofence: Geofence): Promise<void>
  delete(geofence: Geofence): Promise<void>
}

export interface GeofenceAlertRepository {
  save(alert: GeofenceAlert): Promise<void>
  findByEquipment(equipmentId: UniqueEntityID): Promise<GeofenceAlert[]>
  findUnacknowledged(): Promise<GeofenceAlert[]>
  acknowledgeAlert(alertId: UniqueEntityID, acknowledgedBy: UniqueEntityID, notes?: string): Promise<void>
}

// ============================================================================
// Supporting Types
// ============================================================================

export type GeofenceAlert = {
  id: string
  equipmentId: string
  geofenceId: string
  alertType: GeofenceAlertType
  location: {
    latitude: number
    longitude: number
    timestamp: Date
    address?: string
  }
  timestamp: Date
  isAcknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  notes?: string
}

// ============================================================================
// Input Types
// ============================================================================

export type CreateGeofenceInput = {
  name: string
  centerLatitude: number
  centerLongitude: number
  radius: number
  projectId?: string
  siteId?: string
  alertsEnabled?: boolean
  authorizedEquipmentIds?: string[]
}

export type UpdateGeofenceInput = {
  geofenceId: string
  name?: string
  centerLatitude?: number
  centerLongitude?: number
  radius?: number
  alertsEnabled?: boolean
}

export type CheckLocationInput = {
  equipmentId: string
  latitude: number
  longitude: number
  previousLatitude?: number
  previousLongitude?: number
}

export type AuthorizeEquipmentInput = {
  geofenceId: string
  equipmentId: string
}

export type UnauthorizeEquipmentInput = {
  geofenceId: string
  equipmentId: string
}

export type AcknowledgeAlertInput = {
  alertId: string
  acknowledgedBy: string
  notes?: string
}

// ============================================================================
// Output Types
// ============================================================================

export type GeofenceDTO = {
  id: string
  name: string
  center: {
    latitude: number
    longitude: number
  }
  radius: number
  projectId?: string
  siteId?: string
  isActive: boolean
  alertsEnabled: boolean
  authorizedEquipmentIds?: string[]
  createdAt: Date
  updatedAt: Date
}

export type GeofenceSummary = {
  id: string
  name: string
  radius: number
  isActive: boolean
  alertsEnabled: boolean
  authorizedEquipmentCount: number
}

export type GeofenceViolation = {
  equipmentId: string
  geofenceId: string
  geofenceName: string
  alertType: GeofenceAlertType
  location: {
    latitude: number
    longitude: number
    timestamp: Date
  }
  timestamp: Date
}

// ============================================================================
// Geofence Service
// ============================================================================

export class GeofenceService {
  private readonly geofenceRepo: GeofenceRepository
  private readonly alertRepo: GeofenceAlertRepository

  constructor(geofenceRepo: GeofenceRepository, alertRepo: GeofenceAlertRepository) {
    this.geofenceRepo = geofenceRepo
    this.alertRepo = alertRepo
  }

  /**
   * Create a new geofence
   */
  async createGeofence(input: CreateGeofenceInput): Promise<Result<GeofenceDTO>> {
    try {
      // Create GeoCoordinate for center
      const coordinateResult = GeoCoordinate.create(input.centerLatitude, input.centerLongitude)
      if (!coordinateResult.isSuccess) {
        return Result.fail(coordinateResult.error ?? 'Invalid center coordinates')
      }

      // Create GPSLocation for center
      const centerResult = GPSLocation.create({
        coordinate: coordinateResult.value!,
        timestamp: new Date(),
      })
      if (!centerResult.isSuccess) {
        return Result.fail(centerResult.error ?? 'Invalid center location')
      }

      // Convert authorized equipment IDs
      const authorizedIds = input.authorizedEquipmentIds?.map((id) => new UniqueEntityID(id))

      // Create Geofence entity
      const geofenceResult = Geofence.create({
        name: input.name,
        center: centerResult.value!,
        radius: input.radius,
        projectId: input.projectId ? new UniqueEntityID(input.projectId) : undefined,
        siteId: input.siteId ? new UniqueEntityID(input.siteId) : undefined,
        isActive: true,
        alertsEnabled: input.alertsEnabled ?? true,
        authorizedEquipmentIds: authorizedIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (!geofenceResult.isSuccess) {
        return Result.fail(geofenceResult.error ?? 'Failed to create geofence')
      }

      await this.geofenceRepo.save(geofenceResult.value!)

      return Result.ok(this.toDTO(geofenceResult.value!))
    } catch (error) {
      return Result.fail(`Failed to create geofence: ${error}`)
    }
  }

  /**
   * Get geofence by ID
   */
  async getGeofenceById(geofenceId: string): Promise<Result<GeofenceDTO>> {
    try {
      const geofence = await this.geofenceRepo.findById(new UniqueEntityID(geofenceId))
      if (!geofence) {
        return Result.fail('Geofence not found')
      }
      return Result.ok(this.toDTO(geofence))
    } catch (error) {
      return Result.fail(`Failed to get geofence: ${error}`)
    }
  }

  /**
   * List all geofences
   */
  async listGeofences(filters?: {
    projectId?: string
    siteId?: string
    activeOnly?: boolean
  }): Promise<Result<GeofenceSummary[]>> {
    try {
      let geofences: Geofence[]

      if (filters?.projectId) {
        geofences = await this.geofenceRepo.findByProject(new UniqueEntityID(filters.projectId))
      } else if (filters?.siteId) {
        geofences = await this.geofenceRepo.findBySite(new UniqueEntityID(filters.siteId))
      } else if (filters?.activeOnly) {
        geofences = await this.geofenceRepo.findActive()
      } else {
        geofences = await this.geofenceRepo.findAll()
      }

      const summaries = geofences.map((geofence) => this.toSummary(geofence))
      return Result.ok(summaries)
    } catch (error) {
      return Result.fail(`Failed to list geofences: ${error}`)
    }
  }

  /**
   * Update geofence
   */
  async updateGeofence(input: UpdateGeofenceInput): Promise<Result<GeofenceDTO>> {
    try {
      const geofence = await this.geofenceRepo.findById(new UniqueEntityID(input.geofenceId))
      if (!geofence) {
        return Result.fail('Geofence not found')
      }

      if (input.centerLatitude !== undefined && input.centerLongitude !== undefined) {
        const coordinateResult = GeoCoordinate.create(input.centerLatitude, input.centerLongitude)
        if (!coordinateResult.isSuccess) {
          return Result.fail(coordinateResult.error ?? 'Invalid center coordinates')
        }

        const centerResult = GPSLocation.create({
          coordinate: coordinateResult.value!,
          timestamp: new Date(),
        })
        if (!centerResult.isSuccess) {
          return Result.fail(centerResult.error ?? 'Invalid center location')
        }

        geofence.updateCenter(centerResult.value!)
      }

      if (input.radius !== undefined) {
        const updateResult = geofence.updateRadius(input.radius)
        if (!updateResult.isSuccess) {
          return Result.fail(updateResult.error ?? 'Failed to update radius')
        }
      }

      if (input.alertsEnabled !== undefined) {
        if (input.alertsEnabled) {
          geofence.enableAlerts()
        } else {
          geofence.disableAlerts()
        }
      }

      await this.geofenceRepo.save(geofence)

      return Result.ok(this.toDTO(geofence))
    } catch (error) {
      return Result.fail(`Failed to update geofence: ${error}`)
    }
  }

  /**
   * Activate geofence
   */
  async activateGeofence(geofenceId: string): Promise<Result<GeofenceDTO>> {
    try {
      const geofence = await this.geofenceRepo.findById(new UniqueEntityID(geofenceId))
      if (!geofence) {
        return Result.fail('Geofence not found')
      }

      const activateResult = geofence.activate()
      if (!activateResult.isSuccess) {
        return Result.fail(activateResult.error ?? 'Failed to activate geofence')
      }

      await this.geofenceRepo.save(geofence)

      return Result.ok(this.toDTO(geofence))
    } catch (error) {
      return Result.fail(`Failed to activate geofence: ${error}`)
    }
  }

  /**
   * Deactivate geofence
   */
  async deactivateGeofence(geofenceId: string): Promise<Result<GeofenceDTO>> {
    try {
      const geofence = await this.geofenceRepo.findById(new UniqueEntityID(geofenceId))
      if (!geofence) {
        return Result.fail('Geofence not found')
      }

      const deactivateResult = geofence.deactivate()
      if (!deactivateResult.isSuccess) {
        return Result.fail(deactivateResult.error ?? 'Failed to deactivate geofence')
      }

      await this.geofenceRepo.save(geofence)

      return Result.ok(this.toDTO(geofence))
    } catch (error) {
      return Result.fail(`Failed to deactivate geofence: ${error}`)
    }
  }

  /**
   * Check if equipment location triggers any geofence alerts
   */
  async checkLocation(input: CheckLocationInput): Promise<Result<GeofenceViolation[]>> {
    try {
      const activeGeofences = await this.geofenceRepo.findActive()
      const violations: GeofenceViolation[] = []

      // Create current location
      const currentCoordinate = GeoCoordinate.create(input.latitude, input.longitude)
      if (!currentCoordinate.isSuccess) {
        return Result.fail(currentCoordinate.error ?? 'Invalid current coordinates')
      }

      const currentLocation = GPSLocation.create({
        coordinate: currentCoordinate.value!,
        timestamp: new Date(),
      })
      if (!currentLocation.isSuccess) {
        return Result.fail(currentLocation.error ?? 'Invalid current location')
      }

      // Create previous location if provided
      let previousLocation: GPSLocation | undefined
      if (input.previousLatitude !== undefined && input.previousLongitude !== undefined) {
        const prevCoordinate = GeoCoordinate.create(input.previousLatitude, input.previousLongitude)
        if (prevCoordinate.isSuccess) {
          const prevLocationResult = GPSLocation.create({
            coordinate: prevCoordinate.value!,
            timestamp: new Date(),
          })
          if (prevLocationResult.isSuccess) {
            previousLocation = prevLocationResult.value!
          }
        }
      }

      // Check each geofence
      for (const geofence of activeGeofences) {
        const alertCheck = geofence.shouldTriggerAlert(
          new UniqueEntityID(input.equipmentId),
          currentLocation.value!,
          previousLocation,
        )

        if (alertCheck.shouldAlert && alertCheck.alertType) {
          // Create alert
          const alert: GeofenceAlert = {
            id: new UniqueEntityID().toString(),
            equipmentId: input.equipmentId,
            geofenceId: geofence.id.toString(),
            alertType: alertCheck.alertType,
            location: {
              latitude: input.latitude,
              longitude: input.longitude,
              timestamp: new Date(),
            },
            timestamp: new Date(),
            isAcknowledged: false,
          }

          await this.alertRepo.save(alert)

          violations.push({
            equipmentId: input.equipmentId,
            geofenceId: geofence.id.toString(),
            geofenceName: geofence.name,
            alertType: alertCheck.alertType,
            location: {
              latitude: input.latitude,
              longitude: input.longitude,
              timestamp: new Date(),
            },
            timestamp: new Date(),
          })
        }
      }

      return Result.ok(violations)
    } catch (error) {
      return Result.fail(`Failed to check location: ${error}`)
    }
  }

  /**
   * Authorize equipment for geofence
   */
  async authorizeEquipment(input: AuthorizeEquipmentInput): Promise<Result<GeofenceDTO>> {
    try {
      const geofence = await this.geofenceRepo.findById(new UniqueEntityID(input.geofenceId))
      if (!geofence) {
        return Result.fail('Geofence not found')
      }

      geofence.authorizeEquipment(new UniqueEntityID(input.equipmentId))

      await this.geofenceRepo.save(geofence)

      return Result.ok(this.toDTO(geofence))
    } catch (error) {
      return Result.fail(`Failed to authorize equipment: ${error}`)
    }
  }

  /**
   * Unauthorize equipment for geofence
   */
  async unauthorizeEquipment(input: UnauthorizeEquipmentInput): Promise<Result<GeofenceDTO>> {
    try {
      const geofence = await this.geofenceRepo.findById(new UniqueEntityID(input.geofenceId))
      if (!geofence) {
        return Result.fail('Geofence not found')
      }

      geofence.unauthorizeEquipment(new UniqueEntityID(input.equipmentId))

      await this.geofenceRepo.save(geofence)

      return Result.ok(this.toDTO(geofence))
    } catch (error) {
      return Result.fail(`Failed to unauthorize equipment: ${error}`)
    }
  }

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(): Promise<Result<GeofenceAlert[]>> {
    try {
      const alerts = await this.alertRepo.findUnacknowledged()
      return Result.ok(alerts)
    } catch (error) {
      return Result.fail(`Failed to get unacknowledged alerts: ${error}`)
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(input: AcknowledgeAlertInput): Promise<Result<boolean>> {
    try {
      await this.alertRepo.acknowledgeAlert(
        new UniqueEntityID(input.alertId),
        new UniqueEntityID(input.acknowledgedBy),
        input.notes,
      )
      return Result.ok(true)
    } catch (error) {
      return Result.fail(`Failed to acknowledge alert: ${error}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private toDTO(geofence: Geofence): GeofenceDTO {
    return {
      id: geofence.id.toString(),
      name: geofence.name,
      center: {
        latitude: geofence.center.latitude,
        longitude: geofence.center.longitude,
      },
      radius: geofence.radius,
      projectId: geofence.projectId?.toString(),
      siteId: geofence.siteId?.toString(),
      isActive: geofence.isActive,
      alertsEnabled: geofence.alertsEnabled,
      authorizedEquipmentIds: geofence.authorizedEquipmentIds?.map((id) => id.toString()),
      createdAt: geofence.createdAt,
      updatedAt: geofence.updatedAt,
    }
  }

  private toSummary(geofence: Geofence): GeofenceSummary {
    return {
      id: geofence.id.toString(),
      name: geofence.name,
      radius: geofence.radius,
      isActive: geofence.isActive,
      alertsEnabled: geofence.alertsEnabled,
      authorizedEquipmentCount: geofence.authorizedEquipmentIds?.length ?? 0,
    }
  }
}
