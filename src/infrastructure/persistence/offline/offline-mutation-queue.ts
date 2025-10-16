export type OfflineMutation = {
  id: string
  channel: string
  payload: unknown
  createdAt: number
  attempts: number
  headers?: Record<string, string>
  metadata?: Record<string, unknown>
  lastError?: string
}

export interface OfflineMutationQueue {
  enqueue(mutation: OfflineMutation): Promise<void>
  peekAll(): Promise<OfflineMutation[]>
  update(mutation: OfflineMutation): Promise<void>
  remove(id: string): Promise<void>
  clearChannel(channel: string): Promise<void>
  size(): Promise<number>
}
