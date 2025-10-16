import { Result, UniqueEntityID } from '@domain/shared'
import {
  IoTSensor,
  type SensorType,
  type SensorThreshold,
} from '@domain/equipment'

/**
 * IoT Sensor Application Service
 * Orchestrates IoT sensor management and monitoring use cases
 */

// ============================================================================
// Repository Interfaces (to be implemented in infrastructure layer)
// ============================================================================

export interface IoTSensorRepository {
  findById(id: UniqueEntityID): Promise<IoTSensor | null>
  findByEquipment(equipmentId: UniqueEntityID): Promise<IoTSensor[]>
  findBySensorId(sensorId: string): Promise<IoTSensor | null>
  findActive(): Promise<IoTSensor[]>
  findNeedingCalibration(): Promise<IoTSensor[]>
  save(sensor: IoTSensor): Promise<void>
  delete(sensor: IoTSensor): Promise<void>
}

export interface SensorReadingRepository {
  save(reading: SensorReading): Promise<void>
  findByensor(sensorId: UniqueEntityID, limit?: number): Promise<SensorReading[]>
  findAnomalous(sensorId: UniqueEntityID): Promise<SensorReading[]>
  findByTimeRange(sensorId: UniqueEntityID, startTime: Date, endTime: Date): Promise<SensorReading[]>
}

// ============================================================================
// Supporting Types
// ============================================================================

export type SensorReading = {
  id: string
  sensorId: string
  equipmentId: string
  value: number
  unit: string
  timestamp: Date
  isAnomalous: boolean
  anomalyScore?: number
  severityLevel: 'NORMAL' | 'WARNING' | 'CRITICAL'
}

// ============================================================================
// Input Types
// ============================================================================

export type RegisterSensorInput = {
  equipmentId: string
  sensorType: SensorType
  sensorId: string
  unit: string
  thresholds?: SensorThreshold
  calibrationDate?: Date
  nextCalibrationDate?: Date
}

export type UpdateSensorInput = {
  sensorId: string
  thresholds?: SensorThreshold
  unit?: string
}

export type RecordReadingInput = {
  sensorId: string
  value: number
  timestamp?: Date
}

export type RecordCalibrationInput = {
  sensorId: string
  calibrationDate: Date
  nextCalibrationDate?: Date
}

// ============================================================================
// Output Types
// ============================================================================

export type IoTSensorDTO = {
  id: string
  equipmentId: string
  sensorType: SensorType
  sensorId: string
  unit: string
  thresholds?: SensorThreshold
  isActive: boolean
  lastReadingValue?: number
  lastReadingTimestamp?: Date
  lastSeverityLevel?: 'NORMAL' | 'WARNING' | 'CRITICAL'
  calibrationDate?: Date
  nextCalibrationDate?: Date
  needsCalibration: boolean
  isCalibrationOverdue: boolean
  createdAt: Date
  updatedAt: Date
}

export type SensorSummary = {
  id: string
  equipmentId: string
  sensorType: SensorType
  lastValue?: number
  lastTimestamp?: Date
  severityLevel: 'NORMAL' | 'WARNING' | 'CRITICAL'
  isActive: boolean
}

export type SensorAlert = {
  sensorId: string
  equipmentId: string
  sensorType: SensorType
  value: number
  unit: string
  severityLevel: 'WARNING' | 'CRITICAL'
  threshold: string
  timestamp: Date
}

export type AnomalyDetectionResult = {
  sensorId: string
  equipmentId: string
  isAnomalous: boolean
  anomalyScore: number
  confidence: number
  recommendation?: string
}

// ============================================================================
// IoT Sensor Service
// ============================================================================

export class IoTSensorService {
  private readonly sensorRepo: IoTSensorRepository
  private readonly readingRepo: SensorReadingRepository

  constructor(sensorRepo: IoTSensorRepository, readingRepo: SensorReadingRepository) {
    this.sensorRepo = sensorRepo
    this.readingRepo = readingRepo
  }

  /**
   * Register a new IoT sensor
   */
  async registerSensor(input: RegisterSensorInput): Promise<Result<IoTSensorDTO>> {
    try {
      const sensorResult = IoTSensor.create({
        equipmentId: new UniqueEntityID(input.equipmentId),
        sensorType: input.sensorType,
        sensorId: input.sensorId,
        unit: input.unit,
        thresholds: input.thresholds,
        isActive: true,
        calibrationDate: input.calibrationDate,
        nextCalibrationDate: input.nextCalibrationDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (!sensorResult.isSuccess) {
        return Result.fail(sensorResult.error ?? 'Failed to register sensor')
      }

      await this.sensorRepo.save(sensorResult.value!)

      return Result.ok(this.toDTO(sensorResult.value!))
    } catch (error) {
      return Result.fail(`Failed to register sensor: ${error}`)
    }
  }

  /**
   * Get sensor by ID
   */
  async getSensorById(sensorId: string): Promise<Result<IoTSensorDTO>> {
    try {
      const sensor = await this.sensorRepo.findById(new UniqueEntityID(sensorId))
      if (!sensor) {
        return Result.fail('Sensor not found')
      }
      return Result.ok(this.toDTO(sensor))
    } catch (error) {
      return Result.fail(`Failed to get sensor: ${error}`)
    }
  }

  /**
   * Get all sensors for equipment
   */
  async getSensorsByEquipment(equipmentId: string): Promise<Result<IoTSensorDTO[]>> {
    try {
      const sensors = await this.sensorRepo.findByEquipment(new UniqueEntityID(equipmentId))
      const dtos = sensors.map((sensor) => this.toDTO(sensor))
      return Result.ok(dtos)
    } catch (error) {
      return Result.fail(`Failed to get sensors: ${error}`)
    }
  }

  /**
   * Update sensor configuration
   */
  async updateSensor(input: UpdateSensorInput): Promise<Result<IoTSensorDTO>> {
    try {
      const sensor = await this.sensorRepo.findById(new UniqueEntityID(input.sensorId))
      if (!sensor) {
        return Result.fail('Sensor not found')
      }

      if (input.thresholds) {
        const updateResult = sensor.updateThresholds(input.thresholds)
        if (!updateResult.isSuccess) {
          return Result.fail(updateResult.error ?? 'Failed to update thresholds')
        }
      }

      await this.sensorRepo.save(sensor)

      return Result.ok(this.toDTO(sensor))
    } catch (error) {
      return Result.fail(`Failed to update sensor: ${error}`)
    }
  }

  /**
   * Record a sensor reading
   */
  async recordReading(input: RecordReadingInput): Promise<Result<SensorReading>> {
    try {
      const sensor = await this.sensorRepo.findById(new UniqueEntityID(input.sensorId))
      if (!sensor) {
        return Result.fail('Sensor not found')
      }

      const timestamp = input.timestamp || new Date()

      // Record reading on sensor entity
      const recordResult = sensor.recordReading(input.value, timestamp)
      if (!recordResult.isSuccess) {
        return Result.fail(recordResult.error ?? 'Failed to record reading')
      }

      // Determine severity level
      const severityLevel = sensor.getSeverityLevel(input.value)

      // Detect anomalies (simplified - in production would use ML model)
      const isAnomalous = this.detectAnomaly(sensor, input.value)
      const anomalyScore = isAnomalous ? 0.8 : 0.1

      // Create reading record
      const reading: SensorReading = {
        id: new UniqueEntityID().toString(),
        sensorId: sensor.id.toString(),
        equipmentId: sensor.equipmentId.toString(),
        value: input.value,
        unit: sensor.unit,
        timestamp,
        isAnomalous,
        anomalyScore,
        severityLevel,
      }

      // Save reading to repository
      await this.readingRepo.save(reading)

      // Update sensor in repository
      await this.sensorRepo.save(sensor)

      // TODO: Emit domain event if critical or anomalous
      // TODO: Trigger predictive maintenance if needed

      return Result.ok(reading)
    } catch (error) {
      return Result.fail(`Failed to record reading: ${error}`)
    }
  }

  /**
   * Record sensor calibration
   */
  async recordCalibration(input: RecordCalibrationInput): Promise<Result<IoTSensorDTO>> {
    try {
      const sensor = await this.sensorRepo.findById(new UniqueEntityID(input.sensorId))
      if (!sensor) {
        return Result.fail('Sensor not found')
      }

      sensor.recordCalibration(input.calibrationDate, input.nextCalibrationDate)

      await this.sensorRepo.save(sensor)

      return Result.ok(this.toDTO(sensor))
    } catch (error) {
      return Result.fail(`Failed to record calibration: ${error}`)
    }
  }

  /**
   * Activate sensor
   */
  async activateSensor(sensorId: string): Promise<Result<IoTSensorDTO>> {
    try {
      const sensor = await this.sensorRepo.findById(new UniqueEntityID(sensorId))
      if (!sensor) {
        return Result.fail('Sensor not found')
      }

      const activateResult = sensor.activate()
      if (!activateResult.isSuccess) {
        return Result.fail(activateResult.error ?? 'Failed to activate sensor')
      }

      await this.sensorRepo.save(sensor)

      return Result.ok(this.toDTO(sensor))
    } catch (error) {
      return Result.fail(`Failed to activate sensor: ${error}`)
    }
  }

  /**
   * Deactivate sensor
   */
  async deactivateSensor(sensorId: string): Promise<Result<IoTSensorDTO>> {
    try {
      const sensor = await this.sensorRepo.findById(new UniqueEntityID(sensorId))
      if (!sensor) {
        return Result.fail('Sensor not found')
      }

      const deactivateResult = sensor.deactivate()
      if (!deactivateResult.isSuccess) {
        return Result.fail(deactivateResult.error ?? 'Failed to deactivate sensor')
      }

      await this.sensorRepo.save(sensor)

      return Result.ok(this.toDTO(sensor))
    } catch (error) {
      return Result.fail(`Failed to deactivate sensor: ${error}`)
    }
  }

  /**
   * Get critical sensor alerts
   */
  async getCriticalAlerts(): Promise<Result<SensorAlert[]>> {
    try {
      const activeSensors = await this.sensorRepo.findActive()
      const alerts: SensorAlert[] = []

      for (const sensor of activeSensors) {
        if (sensor.lastReadingValue === undefined) continue

        const severityLevel = sensor.getSeverityLevel(sensor.lastReadingValue)

        if (severityLevel === 'WARNING' || severityLevel === 'CRITICAL') {
          const threshold = this.getViolatedThreshold(sensor, sensor.lastReadingValue)

          alerts.push({
            sensorId: sensor.id.toString(),
            equipmentId: sensor.equipmentId.toString(),
            sensorType: sensor.sensorType,
            value: sensor.lastReadingValue,
            unit: sensor.unit,
            severityLevel,
            threshold,
            timestamp: sensor.lastReadingTimestamp || new Date(),
          })
        }
      }

      return Result.ok(alerts)
    } catch (error) {
      return Result.fail(`Failed to get critical alerts: ${error}`)
    }
  }

  /**
   * Get sensors needing calibration
   */
  async getSensorsNeedingCalibration(): Promise<Result<SensorSummary[]>> {
    try {
      const sensors = await this.sensorRepo.findNeedingCalibration()
      const summaries = sensors.map((sensor) => this.toSummary(sensor))
      return Result.ok(summaries)
    } catch (error) {
      return Result.fail(`Failed to get sensors needing calibration: ${error}`)
    }
  }

  /**
   * Get sensor readings history
   */
  async getSensorReadings(
    sensorId: string,
    limit?: number,
  ): Promise<Result<SensorReading[]>> {
    try {
      const readings = await this.readingRepo.findByensor(new UniqueEntityID(sensorId), limit)
      return Result.ok(readings)
    } catch (error) {
      return Result.fail(`Failed to get sensor readings: ${error}`)
    }
  }

  /**
   * Detect anomalies in sensor readings
   */
  async detectAnomalies(
    equipmentId: string,
  ): Promise<Result<AnomalyDetectionResult[]>> {
    try {
      const sensors = await this.sensorRepo.findByEquipment(new UniqueEntityID(equipmentId))
      const results: AnomalyDetectionResult[] = []

      for (const sensor of sensors) {
        const anomalousReadings = await this.readingRepo.findAnomalous(sensor.id)

        if (anomalousReadings.length > 0) {
          // Calculate average anomaly score
          const avgScore =
            anomalousReadings.reduce((sum, r) => sum + (r.anomalyScore || 0), 0) /
            anomalousReadings.length

          // Determine confidence based on number of anomalous readings
          const confidence = Math.min(anomalousReadings.length / 10, 1.0)

          results.push({
            sensorId: sensor.id.toString(),
            equipmentId: equipmentId,
            isAnomalous: true,
            anomalyScore: avgScore,
            confidence,
            recommendation: this.getMaintenanceRecommendation(sensor, avgScore),
          })
        }
      }

      return Result.ok(results)
    } catch (error) {
      return Result.fail(`Failed to detect anomalies: ${error}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private toDTO(sensor: IoTSensor): IoTSensorDTO {
    const lastSeverityLevel = sensor.lastReadingValue
      ? sensor.getSeverityLevel(sensor.lastReadingValue)
      : undefined

    return {
      id: sensor.id.toString(),
      equipmentId: sensor.equipmentId.toString(),
      sensorType: sensor.sensorType,
      sensorId: sensor.sensorId,
      unit: sensor.unit,
      thresholds: sensor.thresholds,
      isActive: sensor.isActive,
      lastReadingValue: sensor.lastReadingValue,
      lastReadingTimestamp: sensor.lastReadingTimestamp,
      lastSeverityLevel,
      calibrationDate: sensor.calibrationDate,
      nextCalibrationDate: sensor.nextCalibrationDate,
      needsCalibration: sensor.needsCalibration(),
      isCalibrationOverdue: sensor.isCalibrationOverdue(),
      createdAt: sensor.createdAt,
      updatedAt: sensor.updatedAt,
    }
  }

  private toSummary(sensor: IoTSensor): SensorSummary {
    const severityLevel = sensor.lastReadingValue
      ? sensor.getSeverityLevel(sensor.lastReadingValue)
      : 'NORMAL'

    return {
      id: sensor.id.toString(),
      equipmentId: sensor.equipmentId.toString(),
      sensorType: sensor.sensorType,
      lastValue: sensor.lastReadingValue,
      lastTimestamp: sensor.lastReadingTimestamp,
      severityLevel,
      isActive: sensor.isActive,
    }
  }

  private detectAnomaly(sensor: IoTSensor, value: number): boolean {
    // Simplified anomaly detection
    // In production, this would use ML models, historical data analysis, etc.
    return sensor.isValueInCriticalRange(value)
  }

  private getViolatedThreshold(sensor: IoTSensor, value: number): string {
    if (!sensor.thresholds) return 'No thresholds set'

    if (sensor.isValueInCriticalRange(value)) {
      if (sensor.thresholds.criticalMin !== undefined && value < sensor.thresholds.criticalMin) {
        return `Below critical minimum: ${sensor.thresholds.criticalMin} ${sensor.unit}`
      }
      if (sensor.thresholds.criticalMax !== undefined && value > sensor.thresholds.criticalMax) {
        return `Above critical maximum: ${sensor.thresholds.criticalMax} ${sensor.unit}`
      }
    }

    if (sensor.isValueInWarningRange(value)) {
      if (sensor.thresholds.warningMin !== undefined && value < sensor.thresholds.warningMin) {
        return `Below warning minimum: ${sensor.thresholds.warningMin} ${sensor.unit}`
      }
      if (sensor.thresholds.warningMax !== undefined && value > sensor.thresholds.warningMax) {
        return `Above warning maximum: ${sensor.thresholds.warningMax} ${sensor.unit}`
      }
    }

    return 'Threshold violated'
  }

  private getMaintenanceRecommendation(sensor: IoTSensor, anomalyScore: number): string {
    if (anomalyScore > 0.8) {
      return `Critical: Immediate inspection recommended for ${sensor.sensorType} sensor`
    }
    if (anomalyScore > 0.6) {
      return `High: Schedule maintenance within 24-48 hours for ${sensor.sensorType} sensor`
    }
    if (anomalyScore > 0.4) {
      return `Medium: Schedule maintenance within next week for ${sensor.sensorType} sensor`
    }
    return `Low: Monitor ${sensor.sensorType} sensor readings closely`
  }
}
