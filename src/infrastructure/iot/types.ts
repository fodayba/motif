import type { SensorReading } from '@domain/iot'

export type DeviceIdentifier = {
  id: string
  type?: string
  location?: string
  metadata?: Record<string, unknown>
}

export type StreamingPayload = {
  deviceId: string
  metric: string
  value: number
  unit: string
  capturedAt: Date
  metadata?: Record<string, unknown>
}

export interface IoTIngestionGateway {
  publish(reading: StreamingPayload): Promise<void>
  subscribe(
    deviceId: string,
    handler: (payload: StreamingPayload) => Promise<void> | void,
  ): Promise<void>
  unsubscribe(deviceId: string): Promise<void>
}

export interface SensorPollingAdapter {
  poll(device: DeviceIdentifier): Promise<SensorReading[]>
}

export interface IoTDecoder<TPayload = unknown> {
  decode(payload: TPayload): StreamingPayload | null
}

export type IngestionResult = {
  received: number
  accepted: number
  rejected: number
  errors: Array<{ deviceId?: string; metric?: string; message: string }>
}
