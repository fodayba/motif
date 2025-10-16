import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { GPSLocation } from '../value-objects/gps-location'

export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'

export const EQUIPMENT_CONDITIONS: readonly EquipmentCondition[] = [
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
] as const

export type CheckInOutType = 'CHECK_IN' | 'CHECK_OUT'

export const CHECK_IN_OUT_TYPES: readonly CheckInOutType[] = ['CHECK_IN', 'CHECK_OUT'] as const

export type CheckInOutProps = {
  equipmentId: UniqueEntityID
  operatorUserId: UniqueEntityID
  type: CheckInOutType
  timestamp: Date
  location: GPSLocation
  projectId?: UniqueEntityID
  siteId?: UniqueEntityID
  digitalSignature: string // Base64 encoded signature image
  operatorCertifications?: string[]
  equipmentCondition?: EquipmentCondition
  meterReading?: number // Hours, miles, or other unit
  fuelLevel?: number // Percentage 0-100
  damageReported: boolean
  damageDescription?: string
  photos?: string[] // URLs or base64
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class CheckInOut extends AggregateRoot<CheckInOutProps> {
  private constructor(props: CheckInOutProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get equipmentId(): UniqueEntityID {
    return this.props.equipmentId
  }

  get operatorUserId(): UniqueEntityID {
    return this.props.operatorUserId
  }

  get type(): CheckInOutType {
    return this.props.type
  }

  get timestamp(): Date {
    return this.props.timestamp
  }

  get location(): GPSLocation {
    return this.props.location
  }

  get projectId(): UniqueEntityID | undefined {
    return this.props.projectId
  }

  get siteId(): UniqueEntityID | undefined {
    return this.props.siteId
  }

  get digitalSignature(): string {
    return this.props.digitalSignature
  }

  get operatorCertifications(): string[] | undefined {
    return this.props.operatorCertifications
  }

  get equipmentCondition(): EquipmentCondition | undefined {
    return this.props.equipmentCondition
  }

  get meterReading(): number | undefined {
    return this.props.meterReading
  }

  get fuelLevel(): number | undefined {
    return this.props.fuelLevel
  }

  get damageReported(): boolean {
    return this.props.damageReported
  }

  get damageDescription(): string | undefined {
    return this.props.damageDescription
  }

  get photos(): string[] | undefined {
    return this.props.photos
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Logic Methods

  public isCheckOut(): boolean {
    return this.type === 'CHECK_OUT'
  }

  public isCheckIn(): boolean {
    return this.type === 'CHECK_IN'
  }

  public hasDamage(): boolean {
    return this.damageReported
  }

  public needsInspection(): boolean {
    return (
      this.damageReported ||
      this.equipmentCondition === 'POOR' ||
      this.equipmentCondition === 'DAMAGED'
    )
  }

  public isConditionAcceptable(): boolean {
    if (!this.equipmentCondition) return true
    return (
      this.equipmentCondition === 'EXCELLENT' ||
      this.equipmentCondition === 'GOOD' ||
      this.equipmentCondition === 'FAIR'
    )
  }

  public addPhoto(photoUrl: string): void {
    if (!this.props.photos) {
      this.props.photos = []
    }
    this.props.photos.push(photoUrl)
    this.touch()
  }

  public addNotes(notes: string): void {
    if (!this.props.notes) {
      this.props.notes = notes
    } else {
      this.props.notes += `\n${notes}`
    }
    this.touch()
  }

  public updateDamageReport(description: string, photos?: string[]): void {
    this.props.damageReported = true
    this.props.damageDescription = description
    if (photos) {
      this.props.photos = [...(this.props.photos || []), ...photos]
    }
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(props: CheckInOutProps, id?: UniqueEntityID): Result<CheckInOut> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.equipmentId, argumentName: 'equipmentId' },
      { argument: props.operatorUserId, argumentName: 'operatorUserId' },
      { argument: props.type, argumentName: 'type' },
      { argument: props.timestamp, argumentName: 'timestamp' },
      { argument: props.location, argumentName: 'location' },
      { argument: props.digitalSignature, argumentName: 'digitalSignature' },
      { argument: props.damageReported, argumentName: 'damageReported' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!CHECK_IN_OUT_TYPES.includes(props.type)) {
      return Result.fail(`invalid check-in/out type: ${props.type}`)
    }

    if (props.equipmentCondition && !EQUIPMENT_CONDITIONS.includes(props.equipmentCondition)) {
      return Result.fail(`invalid equipment condition: ${props.equipmentCondition}`)
    }

    if (props.digitalSignature.trim().length === 0) {
      return Result.fail('digital signature is required')
    }

    if (props.meterReading !== undefined && props.meterReading < 0) {
      return Result.fail('meter reading cannot be negative')
    }

    if (props.fuelLevel !== undefined && (props.fuelLevel < 0 || props.fuelLevel > 100)) {
      return Result.fail('fuel level must be between 0 and 100')
    }

    if (props.damageReported && !props.damageDescription) {
      return Result.fail('damage description is required when damage is reported')
    }

    if (props.timestamp > new Date()) {
      return Result.fail('check-in/out timestamp cannot be in the future')
    }

    return Result.ok(
      new CheckInOut(
        {
          ...props,
          digitalSignature: props.digitalSignature.trim(),
          notes: props.notes?.trim(),
          damageDescription: props.damageDescription?.trim(),
        },
        id,
      ),
    )
  }
}
