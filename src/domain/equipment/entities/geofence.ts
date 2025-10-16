import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { GPSLocation } from '../value-objects/gps-location'
import type { GeofenceAlertType } from '../enums/geofence-alert-type'

export type GeofenceProps = {
  name: string
  center: GPSLocation
  radius: number // in meters
  projectId?: UniqueEntityID
  siteId?: UniqueEntityID
  isActive: boolean
  alertsEnabled: boolean
  authorizedEquipmentIds?: UniqueEntityID[]
  createdAt: Date
  updatedAt: Date
}

export type GeofenceAlertProps = {
  equipmentId: UniqueEntityID
  geofenceId: UniqueEntityID
  alertType: GeofenceAlertType
  location: GPSLocation
  timestamp: Date
  isAcknowledged: boolean
  acknowledgedBy?: UniqueEntityID
  acknowledgedAt?: Date
  notes?: string
}

export class Geofence extends AggregateRoot<GeofenceProps> {
  private constructor(props: GeofenceProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get name(): string {
    return this.props.name
  }

  get center(): GPSLocation {
    return this.props.center
  }

  get radius(): number {
    return this.props.radius
  }

  get projectId(): UniqueEntityID | undefined {
    return this.props.projectId
  }

  get siteId(): UniqueEntityID | undefined {
    return this.props.siteId
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get alertsEnabled(): boolean {
    return this.props.alertsEnabled
  }

  get authorizedEquipmentIds(): UniqueEntityID[] | undefined {
    return this.props.authorizedEquipmentIds
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Logic Methods

  public isEquipmentAuthorized(equipmentId: UniqueEntityID): boolean {
    if (!this.authorizedEquipmentIds || this.authorizedEquipmentIds.length === 0) {
      // If no restrictions, all equipment is authorized
      return true
    }
    return this.authorizedEquipmentIds.some((id) => id.equals(equipmentId))
  }

  public isLocationWithinGeofence(location: GPSLocation): boolean {
    const distance = this.calculateDistance(this.center, location)
    return distance <= this.radius
  }

  public shouldTriggerAlert(
    equipmentId: UniqueEntityID,
    location: GPSLocation,
    previousLocation?: GPSLocation,
  ): { shouldAlert: boolean; alertType?: GeofenceAlertType } {
    if (!this.isActive || !this.alertsEnabled) {
      return { shouldAlert: false }
    }

    const isWithin = this.isLocationWithinGeofence(location)
    const wasWithin = previousLocation ? this.isLocationWithinGeofence(previousLocation) : false

    // Entry alert
    if (isWithin && !wasWithin) {
      // Check if equipment is authorized
      if (!this.isEquipmentAuthorized(equipmentId)) {
        return { shouldAlert: true, alertType: 'UNAUTHORIZED_MOVEMENT' }
      }
      return { shouldAlert: true, alertType: 'ENTRY' }
    }

    // Exit alert
    if (!isWithin && wasWithin) {
      // Check if equipment is authorized to leave
      if (!this.isEquipmentAuthorized(equipmentId)) {
        return { shouldAlert: true, alertType: 'UNAUTHORIZED_MOVEMENT' }
      }
      return { shouldAlert: true, alertType: 'EXIT' }
    }

    return { shouldAlert: false }
  }

  public updateCenter(center: GPSLocation): void {
    this.props.center = center
    this.touch()
  }

  public updateRadius(radius: number): Result<Geofence> {
    if (radius <= 0) {
      return Result.fail('radius must be greater than 0')
    }
    this.props.radius = radius
    this.touch()
    return Result.ok(this)
  }

  public activate(): Result<Geofence> {
    if (this.isActive) {
      return Result.fail('geofence is already active')
    }
    this.props.isActive = true
    this.touch()
    return Result.ok(this)
  }

  public deactivate(): Result<Geofence> {
    if (!this.isActive) {
      return Result.fail('geofence is already inactive')
    }
    this.props.isActive = false
    this.touch()
    return Result.ok(this)
  }

  public enableAlerts(): void {
    this.props.alertsEnabled = true
    this.touch()
  }

  public disableAlerts(): void {
    this.props.alertsEnabled = false
    this.touch()
  }

  public authorizeEquipment(equipmentId: UniqueEntityID): void {
    if (!this.props.authorizedEquipmentIds) {
      this.props.authorizedEquipmentIds = []
    }
    if (!this.props.authorizedEquipmentIds.some((id) => id.equals(equipmentId))) {
      this.props.authorizedEquipmentIds.push(equipmentId)
      this.touch()
    }
  }

  public unauthorizeEquipment(equipmentId: UniqueEntityID): void {
    if (!this.props.authorizedEquipmentIds) return
    this.props.authorizedEquipmentIds = this.props.authorizedEquipmentIds.filter(
      (id) => !id.equals(equipmentId),
    )
    this.touch()
  }

  public clearAuthorizedEquipment(): void {
    this.props.authorizedEquipmentIds = []
    this.touch()
  }

  // Helper method to calculate distance between two GPS points using Haversine formula
  private calculateDistance(point1: GPSLocation, point2: GPSLocation): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180
    const φ2 = (point2.latitude * Math.PI) / 180
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(props: GeofenceProps, id?: UniqueEntityID): Result<Geofence> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.center, argumentName: 'center' },
      { argument: props.radius, argumentName: 'radius' },
      { argument: props.isActive, argumentName: 'isActive' },
      { argument: props.alertsEnabled, argumentName: 'alertsEnabled' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.radius <= 0) {
      return Result.fail('radius must be greater than 0')
    }

    if (props.name.trim().length === 0) {
      return Result.fail('name cannot be empty')
    }

    return Result.ok(
      new Geofence(
        {
          ...props,
          name: props.name.trim(),
        },
        id,
      ),
    )
  }
}
