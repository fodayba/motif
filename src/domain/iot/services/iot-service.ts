import { Result, UniqueEntityID, Validation } from '../../shared'
import { SensorReading } from '../entities/sensor-reading'
import type { IoTRepository } from '../repositories/iot-repository'

export interface IngestSensorReadingProps {
  deviceId: UniqueEntityID
  metric: string
  value: number
  unit: string
  capturedAt?: Date
  metadata?: Record<string, unknown>
  allowNegative?: boolean
}

export class IoTService {
  private readonly repository: IoTRepository

  constructor(repository: IoTRepository) {
    this.repository = repository
  }

  async ingestReading(props: IngestSensorReadingProps): Promise<Result<SensorReading>> {
    if (!props.allowNegative) {
      const validationResult = Validation.nonNegativeNumber(props.value, 'value')
      if (!validationResult.isSuccess) {
        return Result.fail(validationResult.error ?? 'Invalid sensor reading')
      }
    }

    const readingResult = SensorReading.create({
      deviceId: props.deviceId,
      metric: props.metric,
      value: props.value,
      unit: props.unit,
      capturedAt: props.capturedAt ?? new Date(),
      metadata: props.metadata,
    })

    if (!readingResult.isSuccess || !readingResult.value) {
      return Result.fail(readingResult.error ?? 'Failed to create sensor reading')
    }

    const reading = readingResult.value
    await this.repository.recordReading(reading)

    return Result.ok(reading)
  }

  async listRecent(deviceId: UniqueEntityID, limit = 100): Promise<SensorReading[]> {
    return this.repository.listRecentReadings(deviceId, { limit })
  }

  async listMetricRange(metric: string, from: Date, to: Date): Promise<SensorReading[]> {
    return this.repository.listByMetric(metric, { from, to })
  }
}
