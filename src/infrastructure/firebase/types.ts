import type { UniqueEntityID } from '@domain/shared'

export type FirebaseUserRecord = {
  uid: string
  email?: string
}

export interface FirebaseAdminAuth {
  createUser(input: { uid: string; email: string; password: string }): Promise<FirebaseUserRecord>
  updateUser(uid: string, input: { password?: string; email?: string }): Promise<FirebaseUserRecord>
  generatePasswordResetLink?(email: string): Promise<string>
  revokeRefreshTokens(uid: string): Promise<void>
}

export interface FirebaseClientAuth {
  signInWithEmailAndPassword(email: string, password: string): Promise<{ user: FirebaseUserRecord }>
  signOut(): Promise<void>
}

export interface InvitationDispatcher {
  dispatchInvitation(input: {
    userId: UniqueEntityID
    email: string
    resetLink?: string
  }): Promise<void>
}

export type FirestoreDocument<T = Record<string, unknown>> = T & { id?: string }

export type FirestoreQueryConstraint =
  | { field: string; op: '==' | '!=' | '>' | '>=' | '<' | '<='; value: unknown }
  | { field: string; op: 'in' | 'not-in'; value: unknown[] }
  | { field: string; op: 'array-contains'; value: unknown }
  | { field: string; op: 'array-contains-any'; value: unknown[] }
  | { field: string; op: 'orderBy'; direction?: 'asc' | 'desc' }
  | { field: string; op: 'limit'; value: number }

export interface FirestoreClient {
  getDocument<T extends FirestoreDocument>(collection: string, id: string): Promise<T | null>
  setDocument<T extends FirestoreDocument>(collection: string, id: string, data: T): Promise<void>
  updateDocument<T extends FirestoreDocument>(collection: string, id: string, data: Partial<T>): Promise<void>
  deleteDocument(collection: string, id: string): Promise<void>
  queryCollection<T extends FirestoreDocument>(
    collection: string,
    constraints?: FirestoreQueryConstraint[],
  ): Promise<Array<T & { id: string }>>
}

export interface StorageUploadOptions {
  contentType?: string
  cacheControl?: string
  metadata?: Record<string, string>
}

export type StorageUploadRequest = {
  path: string
  data: ArrayBuffer | Uint8Array | Blob | NodeJS.ReadableStream
  options?: StorageUploadOptions
}

export type StorageDownloadRequest = {
  path: string
}

export interface StorageClient {
  upload(request: StorageUploadRequest): Promise<{ path: string; size: number; checksum?: string }>
  getDownloadUrl(request: StorageDownloadRequest): Promise<string>
  deleteObject(path: string): Promise<void>
}

export type MessagingNotification = {
  title: string
  body: string
  imageUrl?: string
}

export type MessagingData = Record<string, string>

export type MessagingTarget = {
  token?: string
  topic?: string
  condition?: string
}

export type MessagingRequest = MessagingTarget & {
  notification?: MessagingNotification
  data?: MessagingData
}

export interface MessagingClient {
  send(request: MessagingRequest): Promise<{ messageId: string }>
  sendMulticast?(request: MessagingRequest & { tokens: string[] }): Promise<{
    successCount: number
    failureCount: number
    responses: Array<{ messageId?: string; error?: Error }>
  }>
}
