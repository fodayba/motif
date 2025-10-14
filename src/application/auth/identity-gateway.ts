import type { UniqueEntityID } from '@domain/shared'

export interface IdentityGateway {
  createCredentials(input: {
    userId: UniqueEntityID
    email: string
    password: string
  }): Promise<void>
  sendInvitation(input: { userId: UniqueEntityID; email: string }): Promise<void>
  verifyCredentials(input: {
    email: string
    password: string
  }): Promise<UniqueEntityID | null>
  revokeSessions(userId: UniqueEntityID): Promise<void>
}
