import type { IoTIngestionGateway, StreamingPayload } from '../types'

export class MockIngestionGateway implements IoTIngestionGateway {
  private subscribers: Map<string, (payload: StreamingPayload) => Promise<void> | void> = new Map()

  async publish(reading: StreamingPayload): Promise<void> {
    const handler = this.subscribers.get(reading.deviceId)
    if (!handler) {
      return
    }

    await handler(reading)
  }

  async subscribe(
    deviceId: string,
    handler: (payload: StreamingPayload) => Promise<void> | void,
  ): Promise<void> {
    this.subscribers.set(deviceId, handler)
  }

  async unsubscribe(deviceId: string): Promise<void> {
    this.subscribers.delete(deviceId)
  }
}
