import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'
import type { EquipmentCategory } from '../enums/equipment-category'
import { EQUIPMENT_CATEGORIES } from '../enums/equipment-category'
import type { EquipmentStatus } from '../enums/equipment-status'
import { EQUIPMENT_STATUSES } from '../enums/equipment-status'
import type { DepreciationMethod } from '../enums/depreciation-method'
import { DEPRECIATION_METHODS } from '../enums/depreciation-method'
import type { AssetNumber } from '../value-objects/asset-number'
import type { GPSLocation } from '../value-objects/gps-location'
import type { OperatingHours } from '../value-objects/operating-hours'
import type { UtilizationRate } from '../value-objects/utilization-rate'

export type EquipmentProps = {
  assetNumber: AssetNumber
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
  currentLocation?: GPSLocation
  homeLocation?: GPSLocation

  // Assignment
  currentProjectId?: UniqueEntityID
  currentSiteId?: UniqueEntityID
  assignedToUserId?: UniqueEntityID
  assignmentDate?: Date
  expectedReturnDate?: Date

  // Operating Metrics
  totalOperatingHours: OperatingHours
  utilizationRate?: UtilizationRate
  lastUsedDate?: Date

  // Maintenance
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  maintenanceIntervalHours?: number
  maintenanceIntervalMileage?: number
  maintenanceIntervalDays?: number

  // Financial
  acquisitionDate: Date
  acquisitionCost: Money
  currentValue: Money
  depreciationMethod: DepreciationMethod
  depreciationRate?: number
  salvageValue?: Money

  // Lifecycle
  warrantyExpiryDate?: Date
  insuranceExpiryDate?: Date
  insurancePolicyNumber?: string

  // Metadata
  createdAt: Date
  updatedAt: Date
}

export class Equipment extends AggregateRoot<EquipmentProps> {
  private constructor(props: EquipmentProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get assetNumber(): AssetNumber {
    return this.props.assetNumber
  }

  get name(): string {
    return this.props.name
  }

  get category(): EquipmentCategory {
    return this.props.category
  }

  get status(): EquipmentStatus {
    return this.props.status
  }

  get description(): string | undefined {
    return this.props.description
  }

  get manufacturer(): string | undefined {
    return this.props.manufacturer
  }

  get model(): string | undefined {
    return this.props.model
  }

  get serialNumber(): string | undefined {
    return this.props.serialNumber
  }

  get year(): number | undefined {
    return this.props.year
  }

  get qrCode(): string | undefined {
    return this.props.qrCode
  }

  get rfidTag(): string | undefined {
    return this.props.rfidTag
  }

  get barcode(): string | undefined {
    return this.props.barcode
  }

  get currentLocation(): GPSLocation | undefined {
    return this.props.currentLocation
  }

  get homeLocation(): GPSLocation | undefined {
    return this.props.homeLocation
  }

  get currentProjectId(): UniqueEntityID | undefined {
    return this.props.currentProjectId
  }

  get currentSiteId(): UniqueEntityID | undefined {
    return this.props.currentSiteId
  }

  get assignedToUserId(): UniqueEntityID | undefined {
    return this.props.assignedToUserId
  }

  get assignmentDate(): Date | undefined {
    return this.props.assignmentDate
  }

  get expectedReturnDate(): Date | undefined {
    return this.props.expectedReturnDate
  }

  get totalOperatingHours(): OperatingHours {
    return this.props.totalOperatingHours
  }

  get utilizationRate(): UtilizationRate | undefined {
    return this.props.utilizationRate
  }

  get lastUsedDate(): Date | undefined {
    return this.props.lastUsedDate
  }

  get lastMaintenanceDate(): Date | undefined {
    return this.props.lastMaintenanceDate
  }

  get nextMaintenanceDate(): Date | undefined {
    return this.props.nextMaintenanceDate
  }

  get maintenanceIntervalHours(): number | undefined {
    return this.props.maintenanceIntervalHours
  }

  get maintenanceIntervalDays(): number | undefined {
    return this.props.maintenanceIntervalDays
  }

  get acquisitionDate(): Date {
    return this.props.acquisitionDate
  }

  get acquisitionCost(): Money {
    return this.props.acquisitionCost
  }

  get currentValue(): Money {
    return this.props.currentValue
  }

  get depreciationMethod(): DepreciationMethod {
    return this.props.depreciationMethod
  }

  get warrantyExpiryDate(): Date | undefined {
    return this.props.warrantyExpiryDate
  }

  get insuranceExpiryDate(): Date | undefined {
    return this.props.insuranceExpiryDate
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Logic Methods

  public isAvailable(): boolean {
    return this.status === 'AVAILABLE'
  }

  public isInUse(): boolean {
    return this.status === 'IN_USE'
  }

  public isUnderMaintenance(): boolean {
    return this.status === 'MAINTENANCE' || this.status === 'REPAIR'
  }

  public needsMaintenance(): boolean {
    if (!this.nextMaintenanceDate) return false
    return new Date() >= this.nextMaintenanceDate
  }

  public isMaintenanceOverdue(): boolean {
    if (!this.nextMaintenanceDate) return false
    const daysOverdue = Math.floor(
      (new Date().getTime() - this.nextMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysOverdue > 0
  }

  public isWarrantyExpired(): boolean {
    if (!this.warrantyExpiryDate) return false
    return new Date() > this.warrantyExpiryDate
  }

  public isInsuranceExpired(): boolean {
    if (!this.insuranceExpiryDate) return false
    return new Date() > this.insuranceExpiryDate
  }

  public updateStatus(status: EquipmentStatus): Result<Equipment> {
    if (!EQUIPMENT_STATUSES.includes(status)) {
      return Result.fail(`invalid equipment status: ${status}`)
    }

    this.props.status = status
    this.touch()
    return Result.ok(this)
  }

  public updateLocation(location: GPSLocation): void {
    this.props.currentLocation = location
    this.touch()
  }

  public assignToProject(
    projectId: UniqueEntityID,
    siteId?: UniqueEntityID,
    userId?: UniqueEntityID,
    expectedReturnDate?: Date,
  ): Result<Equipment> {
    if (!this.isAvailable()) {
      return Result.fail('equipment must be available to be assigned')
    }

    this.props.currentProjectId = projectId
    this.props.currentSiteId = siteId
    this.props.assignedToUserId = userId
    this.props.assignmentDate = new Date()
    this.props.expectedReturnDate = expectedReturnDate
    this.props.status = 'IN_USE'
    this.touch()

    return Result.ok(this)
  }

  public releaseFromProject(): Result<Equipment> {
    if (!this.isInUse()) {
      return Result.fail('equipment is not currently in use')
    }

    this.props.currentProjectId = undefined
    this.props.currentSiteId = undefined
    this.props.assignedToUserId = undefined
    this.props.assignmentDate = undefined
    this.props.expectedReturnDate = undefined
    this.props.status = 'AVAILABLE'
    this.touch()

    return Result.ok(this)
  }

  public addOperatingHours(hours: OperatingHours): Result<Equipment> {
    const newHoursResult = this.totalOperatingHours.add(hours.hours)
    if (!newHoursResult.isSuccess) {
      return Result.fail(newHoursResult.error ?? 'failed to add operating hours')
    }

    this.props.totalOperatingHours = newHoursResult.value!
    this.props.lastUsedDate = new Date()
    this.touch()

    // Check if maintenance is needed based on hours
    if (this.maintenanceIntervalHours) {
      const hoursSinceLastMaintenance = this.calculateHoursSinceLastMaintenance()
      if (hoursSinceLastMaintenance >= this.maintenanceIntervalHours) {
        // Maintenance is due
        this.props.status = 'MAINTENANCE'
      }
    }

    return Result.ok(this)
  }

  public updateUtilizationRate(rate: UtilizationRate): void {
    this.props.utilizationRate = rate
    this.touch()
  }

  public scheduleMaintenance(nextDate: Date): void {
    this.props.nextMaintenanceDate = nextDate
    this.touch()
  }

  public completeMaintenance(_cost: Money): void {
    this.props.lastMaintenanceDate = new Date()
    this.props.status = 'AVAILABLE'

    // Calculate next maintenance date if interval is set
    if (this.maintenanceIntervalDays) {
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + this.maintenanceIntervalDays)
      this.props.nextMaintenanceDate = nextDate
    }

    this.touch()
  }

  public updateValue(newValue: Money): void {
    this.props.currentValue = newValue
    this.touch()
  }

  public retire(): Result<Equipment> {
    if (this.isInUse()) {
      return Result.fail('cannot retire equipment that is in use')
    }

    this.props.status = 'RETIRED'
    this.touch()
    return Result.ok(this)
  }

  private calculateHoursSinceLastMaintenance(): number {
    // This is a simplified calculation
    // In a real system, you'd track operating hours more precisely
    return this.totalOperatingHours.hours
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(props: EquipmentProps, id?: UniqueEntityID): Result<Equipment> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.assetNumber, argumentName: 'assetNumber' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.category, argumentName: 'category' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.totalOperatingHours, argumentName: 'totalOperatingHours' },
      { argument: props.acquisitionDate, argumentName: 'acquisitionDate' },
      { argument: props.acquisitionCost, argumentName: 'acquisitionCost' },
      { argument: props.currentValue, argumentName: 'currentValue' },
      { argument: props.depreciationMethod, argumentName: 'depreciationMethod' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!EQUIPMENT_CATEGORIES.includes(props.category)) {
      return Result.fail(`invalid equipment category: ${props.category}`)
    }

    if (!EQUIPMENT_STATUSES.includes(props.status)) {
      return Result.fail(`invalid equipment status: ${props.status}`)
    }

    if (!DEPRECIATION_METHODS.includes(props.depreciationMethod)) {
      return Result.fail(`invalid depreciation method: ${props.depreciationMethod}`)
    }

    if (props.acquisitionDate > new Date()) {
      return Result.fail('acquisition date cannot be in the future')
    }

    return Result.ok(
      new Equipment(
        {
          ...props,
          name: props.name.trim(),
          description: props.description?.trim(),
        },
        id,
      ),
    )
  }
}
