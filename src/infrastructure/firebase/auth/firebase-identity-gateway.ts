import { UniqueEntityID } from '@domain/shared'
import type { IdentityGateway } from '@application/auth/identity-gateway'
import type {
  FirebaseAdminAuth,
  FirebaseClientAuth,
  InvitationDispatcher,
} from '../types'

const isFirebaseError = (error: unknown): error is { code?: string; message?: string } => {
  return Boolean(error && typeof error === 'object' && 'message' in error)
}

export class FirebaseIdentityGateway implements IdentityGateway {
  private readonly adminAuth: FirebaseAdminAuth
  private readonly clientAuth: FirebaseClientAuth
  private readonly invitationDispatcher?: InvitationDispatcher

  constructor(deps: {
    adminAuth: FirebaseAdminAuth
    clientAuth: FirebaseClientAuth
    invitationDispatcher?: InvitationDispatcher
  }) {
    this.adminAuth = deps.adminAuth
    this.clientAuth = deps.clientAuth
    this.invitationDispatcher = deps.invitationDispatcher
  }

  async createCredentials(input: {
    userId: UniqueEntityID
    email: string
    password: string
  }): Promise<void> {
    try {
      await this.adminAuth.createUser({
        uid: input.userId.toString(),
        email: input.email,
        password: input.password,
      })
    } catch (error) {
      if (isFirebaseError(error) && error.code === 'auth/uid-already-exists') {
        await this.adminAuth.updateUser(input.userId.toString(), {
          password: input.password,
          email: input.email,
        })
        return
      }

      throw error
    }
  }

  async sendInvitation(input: { userId: UniqueEntityID; email: string }): Promise<void> {
    if (!this.invitationDispatcher) {
      return
    }

    let resetLink: string | undefined
    if (this.adminAuth.generatePasswordResetLink) {
      try {
        resetLink = await this.adminAuth.generatePasswordResetLink(input.email)
      } catch (error) {
        if (isFirebaseError(error) && error.code === 'auth/user-not-found') {
          resetLink = undefined
        } else {
          throw error
        }
      }
    }

    await this.invitationDispatcher.dispatchInvitation({
      userId: input.userId,
      email: input.email,
      resetLink,
    })
  }

  async verifyCredentials(input: {
    email: string
    password: string
  }): Promise<UniqueEntityID | null> {
    try {
      const result = await this.clientAuth.signInWithEmailAndPassword(
        input.email,
        input.password,
      )

      if (!result.user?.uid) {
        return null
      }

      return new UniqueEntityID(result.user.uid)
    } catch (error) {
      if (isFirebaseError(error) && error.code === 'auth/wrong-password') {
        return null
      }

      if (isFirebaseError(error) && error.code === 'auth/user-not-found') {
        return null
      }

      throw error
    }
  }

  async revokeSessions(userId: UniqueEntityID): Promise<void> {
    await this.adminAuth.revokeRefreshTokens(userId.toString())
    await this.clientAuth.signOut().catch(() => undefined)
  }
}
