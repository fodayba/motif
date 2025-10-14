import { UniqueEntityID } from '@domain/shared'
import { SensorReading } from '@domain/iot'
import type { SensorPollingAdapter, DeviceIdentifier } from '../types'

const randomOffset = (max: number) => (Math.random() - 0.5) * max * 2

export class MockSensorPollingAdapter implements SensorPollingAdapter {
  private readonly baseValue: number
  private readonly variance: number

  constructor(baseValue = 50, variance = 10) {
    this.baseValue = baseValue
    this.variance = variance
  }

  async poll(device: DeviceIdentifier) {
    const readingResult = SensorReading.create({
      deviceId: new UniqueEntityID(device.id),
      metric: device.metadata?.metric && typeof device.metadata.metric === 'string'
        ? device.metadata.metric
        : 'temperature',
      value: this.baseValue + randomOffset(this.variance),
      unit: '°C',
      capturedAt: new Date(),
      metadata: device.metadata,
    })

    if (!readingResult.isSuccess || !readingResult.value) {
      throw new Error(readingResult.error ?? 'failed to create mock reading')
    }

    return [readingResult.value]
  }
}
