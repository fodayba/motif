import { UniqueEntityID } from '@domain/shared'
import { IoTService, SensorReading } from '@domain/iot'
import type { IoTRepository } from '@domain/iot'
import type {
  IoTDecoder,
  IoTIngestionGateway,
  IngestionResult,
  StreamingPayload,
} from '../types'

export class IoTIngestionPipeline<TPayload = unknown> {
  private readonly service: IoTService
  private readonly gateway: IoTIngestionGateway
  private readonly decoder: IoTDecoder<TPayload>
  private readonly repository: IoTRepository

  constructor(deps: {
    repository: IoTRepository
    gateway: IoTIngestionGateway
    decoder: IoTDecoder<TPayload>
  }) {
    this.repository = deps.repository
    this.service = new IoTService(this.repository)
    this.gateway = deps.gateway
    this.decoder = deps.decoder
  }

  async processBatch(payloads: TPayload[]): Promise<IngestionResult> {
    const result: IngestionResult = {
      received: payloads.length,
      accepted: 0,
      rejected: 0,
      errors: [],
    }

    for (const payload of payloads) {
      const decoded = this.decoder.decode(payload)

      if (!decoded) {
        result.rejected += 1
        result.errors.push({ message: 'unable to decode payload' })
        continue
      }

      const ingestionResult = await this.ingestDecoded(decoded)
      if (ingestionResult instanceof SensorReading) {
        result.accepted += 1
      } else {
        result.rejected += 1
        result.errors.push({
          deviceId: decoded.deviceId,
          metric: decoded.metric,
          message: ingestionResult,
        })
      }
    }

    return result
  }

  async stream(deviceId: string): Promise<void> {
    await this.gateway.subscribe(deviceId, async (payload) => {
      await this.ingestDecoded(payload)
    })
  }

  async stopStream(deviceId: string): Promise<void> {
    await this.gateway.unsubscribe(deviceId)
  }

  private async ingestDecoded(payload: StreamingPayload): Promise<SensorReading | string> {
    const readingResult = await this.service.ingestReading({
      deviceId: new UniqueEntityID(payload.deviceId),
      metric: payload.metric,
      value: payload.value,
      unit: payload.unit,
      capturedAt: payload.capturedAt,
      metadata: payload.metadata,
    })

    if (!readingResult.isSuccess || !readingResult.value) {
      return readingResult.error ?? 'failed to ingest reading'
    }

    const reading = readingResult.value
    await this.repository.recordReading(reading)

    return reading
  }
}
