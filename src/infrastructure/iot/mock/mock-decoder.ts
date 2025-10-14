import type { IoTDecoder, StreamingPayload } from '../types'

export class MockDecoder implements IoTDecoder<StreamingPayload> {
  decode(payload: StreamingPayload): StreamingPayload | null {
    return payload
  }
}
