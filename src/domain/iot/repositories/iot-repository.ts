import type { SensorReading } from '../entities/sensor-reading'
import type { UniqueEntityID } from '../../shared'

export interface IoTRepository {
  recordReading(reading: SensorReading): Promise<void>
  listRecentReadings(deviceId: UniqueEntityID, options?: { limit?: number }): Promise<SensorReading[]>
  listByMetric(metric: string, range: { from: Date; to: Date }): Promise<SensorReading[]>
}
