import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { SensorType } from '../enums/sensor-type'
import { SENSOR_TYPES } from '../enums/sensor-type'

export type SensorThreshold = {
  min?: number
  max?: number
  warningMin?: number
  warningMax?: number
  criticalMin?: number
  criticalMax?: number
}

export type IoTSensorProps = {
  equipmentId: UniqueEntityID
  sensorType: SensorType
  sensorId: string // Physical sensor identifier
  unit: string // e.g., '°C', 'PSI', 'RPM', '%'
  thresholds?: SensorThreshold
  isActive: boolean
  lastReadingValue?: number
  lastReadingTimestamp?: Date
  calibrationDate?: Date
  nextCalibrationDate?: Date
  createdAt: Date
  updatedAt: Date
}

export type SensorReadingProps = {
  sensorId: UniqueEntityID
  value: number
  timestamp: Date
  isAnomalous: boolean
  anomalyScore?: number // 0-1, higher means more anomalous
}

export class IoTSensor extends AggregateRoot<IoTSensorProps> {
  private constructor(props: IoTSensorProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get equipmentId(): UniqueEntityID {
    return this.props.equipmentId
  }

  get sensorType(): SensorType {
    return this.props.sensorType
  }

  get sensorId(): string {
    return this.props.sensorId
  }

  get unit(): string {
    return this.props.unit
  }

  get thresholds(): SensorThreshold | undefined {
    return this.props.thresholds
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get lastReadingValue(): number | undefined {
    return this.props.lastReadingValue
  }

  get lastReadingTimestamp(): Date | undefined {
    return this.props.lastReadingTimestamp
  }

  get calibrationDate(): Date | undefined {
    return this.props.calibrationDate
  }

  get nextCalibrationDate(): Date | undefined {
    return this.props.nextCalibrationDate
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Logic Methods

  public recordReading(value: number, timestamp: Date): Result<IoTSensor> {
    if (!this.isActive) {
      return Result.fail('sensor is not active')
    }

    this.props.lastReadingValue = value
    this.props.lastReadingTimestamp = timestamp
    this.touch()

    return Result.ok(this)
  }

  public isValueInNormalRange(value: number): boolean {
    if (!this.thresholds) return true

    const { min, max } = this.thresholds
    if (min !== undefined && value < min) return false
    if (max !== undefined && value > max) return false

    return true
  }

  public isValueInWarningRange(value: number): boolean {
    if (!this.thresholds) return false

    const { warningMin, warningMax } = this.thresholds
    if (warningMin !== undefined && value < warningMin) return true
    if (warningMax !== undefined && value > warningMax) return true

    return false
  }

  public isValueInCriticalRange(value: number): boolean {
    if (!this.thresholds) return false

    const { criticalMin, criticalMax } = this.thresholds
    if (criticalMin !== undefined && value < criticalMin) return true
    if (criticalMax !== undefined && value > criticalMax) return true

    return false
  }

  public getSeverityLevel(value: number): 'NORMAL' | 'WARNING' | 'CRITICAL' {
    if (this.isValueInCriticalRange(value)) return 'CRITICAL'
    if (this.isValueInWarningRange(value)) return 'WARNING'
    return 'NORMAL'
  }

  public needsCalibration(): boolean {
    if (!this.nextCalibrationDate) return false
    return new Date() >= this.nextCalibrationDate
  }

  public isCalibrationOverdue(): boolean {
    if (!this.nextCalibrationDate) return false
    const daysOverdue = Math.floor(
      (new Date().getTime() - this.nextCalibrationDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysOverdue > 0
  }

  public updateThresholds(thresholds: SensorThreshold): Result<IoTSensor> {
    // Validate threshold logic
    if (thresholds.min !== undefined && thresholds.max !== undefined) {
      if (thresholds.min >= thresholds.max) {
        return Result.fail('min threshold must be less than max threshold')
      }
    }

    if (thresholds.warningMin !== undefined && thresholds.warningMax !== undefined) {
      if (thresholds.warningMin >= thresholds.warningMax) {
        return Result.fail('warning min threshold must be less than warning max threshold')
      }
    }

    if (thresholds.criticalMin !== undefined && thresholds.criticalMax !== undefined) {
      if (thresholds.criticalMin >= thresholds.criticalMax) {
        return Result.fail('critical min threshold must be less than critical max threshold')
      }
    }

    this.props.thresholds = thresholds
    this.touch()
    return Result.ok(this)
  }

  public recordCalibration(calibrationDate: Date, nextCalibrationDate?: Date): void {
    this.props.calibrationDate = calibrationDate
    this.props.nextCalibrationDate = nextCalibrationDate
    this.touch()
  }

  public activate(): Result<IoTSensor> {
    if (this.isActive) {
      return Result.fail('sensor is already active')
    }
    this.props.isActive = true
    this.touch()
    return Result.ok(this)
  }

  public deactivate(): Result<IoTSensor> {
    if (!this.isActive) {
      return Result.fail('sensor is already inactive')
    }
    this.props.isActive = false
    this.touch()
    return Result.ok(this)
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(props: IoTSensorProps, id?: UniqueEntityID): Result<IoTSensor> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.equipmentId, argumentName: 'equipmentId' },
      { argument: props.sensorType, argumentName: 'sensorType' },
      { argument: props.sensorId, argumentName: 'sensorId' },
      { argument: props.unit, argumentName: 'unit' },
      { argument: props.isActive, argumentName: 'isActive' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!SENSOR_TYPES.includes(props.sensorType)) {
      return Result.fail(`invalid sensor type: ${props.sensorType}`)
    }

    if (props.sensorId.trim().length === 0) {
      return Result.fail('sensor ID cannot be empty')
    }

    if (props.unit.trim().length === 0) {
      return Result.fail('unit cannot be empty')
    }

    // Validate thresholds if provided
    if (props.thresholds) {
      const { min, max, warningMin, warningMax, criticalMin, criticalMax } = props.thresholds

      if (min !== undefined && max !== undefined && min >= max) {
        return Result.fail('min threshold must be less than max threshold')
      }

      if (warningMin !== undefined && warningMax !== undefined && warningMin >= warningMax) {
        return Result.fail('warning min threshold must be less than warning max threshold')
      }

      if (criticalMin !== undefined && criticalMax !== undefined && criticalMin >= criticalMax) {
        return Result.fail('critical min threshold must be less than critical max threshold')
      }
    }

    return Result.ok(
      new IoTSensor(
        {
          ...props,
          sensorId: props.sensorId.trim(),
          unit: props.unit.trim(),
        },
        id,
      ),
    )
  }
}
