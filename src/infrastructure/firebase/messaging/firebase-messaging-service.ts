import { Result } from '@domain/shared'
import type { MessagingClient, MessagingRequest } from '../types'

export type SendNotificationInput = MessagingRequest

export type MulticastResult = {
  successCount: number
  failureCount: number
  failedTokens: string[]
}

export class FirebaseMessagingService {
  private readonly messaging: MessagingClient

  constructor(messaging: MessagingClient) {
    this.messaging = messaging
  }

  async sendNotification(input: SendNotificationInput): Promise<Result<string>> {
    try {
      const response = await this.messaging.send(input)
      return Result.ok(response.messageId)
    } catch (error) {
      const description = error instanceof Error ? error.message : 'failed to send notification'
      return Result.fail(description)
    }
  }

  async sendMulticast(
    input: SendNotificationInput & { tokens: string[] },
  ): Promise<Result<MulticastResult>> {
    if (!this.messaging.sendMulticast) {
      return Result.fail('multicast messaging is not configured')
    }

    try {
      const response = await this.messaging.sendMulticast({ ...input })
      const failedTokens = response.responses
        .map((result, index) => (result.error ? input.tokens[index] : undefined))
        .filter((value): value is string => Boolean(value))

      return Result.ok({
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      })
    } catch (error) {
      const description =
        error instanceof Error ? error.message : 'failed to send multicast notification'
      return Result.fail(description)
    }
  }
}
