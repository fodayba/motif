import { indexedDbSupported, STORE, withStore } from './indexeddb-helpers'
import type { OfflineMutation, OfflineMutationQueue } from './offline-mutation-queue'

class InMemoryOfflineMutationQueue implements OfflineMutationQueue {
  private readonly queue = new Map<string, OfflineMutation>()

  async enqueue(mutation: OfflineMutation): Promise<void> {
    this.queue.set(mutation.id, mutation)
  }

  async peekAll(): Promise<OfflineMutation[]> {
    return Array.from(this.queue.values()).sort((a, b) => a.createdAt - b.createdAt)
  }

  async update(mutation: OfflineMutation): Promise<void> {
    this.queue.set(mutation.id, mutation)
  }

  async remove(id: string): Promise<void> {
    this.queue.delete(id)
  }

  async clearChannel(channel: string): Promise<void> {
    for (const [key, value] of this.queue.entries()) {
      if (value.channel === channel) {
        this.queue.delete(key)
      }
    }
  }

  async size(): Promise<number> {
    return this.queue.size
  }
}

export class IndexedDbOfflineMutationQueue implements OfflineMutationQueue {
  private readonly fallback = new InMemoryOfflineMutationQueue()

  async enqueue(mutation: OfflineMutation): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.enqueue(mutation)
      return
    }

    try {
      await withStore<void>(STORE.MUTATIONS, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(mutation)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error ?? new Error('Failed to enqueue mutation'))
        })
      })
    } catch (error) {
      console.warn('[offline-queue] Failed to enqueue mutation, using memory queue', error)
      await this.fallback.enqueue(mutation)
    }
  }

  async peekAll(): Promise<OfflineMutation[]> {
    if (!indexedDbSupported()) {
      return this.fallback.peekAll()
    }

    try {
      const mutations = await withStore<OfflineMutation[]>(STORE.MUTATIONS, 'readonly', (store) => {
        return new Promise<OfflineMutation[]>((resolve, reject) => {
          const request = store.getAll()
          request.onsuccess = () => resolve((request.result as OfflineMutation[]) ?? [])
          request.onerror = () => reject(request.error ?? new Error('Failed to read mutations'))
        })
      })

      return mutations.sort((a, b) => a.createdAt - b.createdAt)
    } catch (error) {
      console.warn('[offline-queue] Failed to read mutations, using memory queue', error)
      return this.fallback.peekAll()
    }
  }

  async update(mutation: OfflineMutation): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.update(mutation)
      return
    }

    try {
      await withStore<void>(STORE.MUTATIONS, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(mutation)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error ?? new Error('Failed to update mutation'))
        })
      })
    } catch (error) {
      console.warn('[offline-queue] Failed to update mutation, using memory queue', error)
      await this.fallback.update(mutation)
    }
  }

  async remove(id: string): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.remove(id)
      return
    }

    try {
      await withStore<void>(STORE.MUTATIONS, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error ?? new Error('Failed to delete mutation'))
        })
      })
    } catch (error) {
      console.warn('[offline-queue] Failed to delete mutation, using memory queue', error)
      await this.fallback.remove(id)
    }
  }

  async clearChannel(channel: string): Promise<void> {
    if (!indexedDbSupported()) {
      await this.fallback.clearChannel(channel)
      return
    }

    try {
      const mutations = await this.peekAll()
      const ids = mutations.filter((mutation) => mutation.channel === channel).map((mutation) => mutation.id)

      if (ids.length === 0) {
        return
      }

      await withStore<void>(STORE.MUTATIONS, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          let remaining = ids.length
          ids.forEach((id) => {
            const request = store.delete(id)
            request.onerror = () => reject(request.error ?? new Error('Failed to delete mutation by channel'))
            request.onsuccess = () => {
              remaining -= 1
              if (remaining === 0) {
                resolve()
              }
            }
          })
        })
      })
    } catch (error) {
      console.warn('[offline-queue] Failed to clear channel, using memory queue', error)
      await this.fallback.clearChannel(channel)
    }
  }

  async size(): Promise<number> {
    if (!indexedDbSupported()) {
      return this.fallback.size()
    }

    try {
      const mutations = await withStore<number>(STORE.MUTATIONS, 'readonly', (store) => {
        return new Promise<number>((resolve, reject) => {
          const request = store.count()
          request.onsuccess = () => resolve((request.result as number) ?? 0)
          request.onerror = () => reject(request.error ?? new Error('Failed to count mutations'))
        })
      })

      return mutations
    } catch (error) {
      console.warn('[offline-queue] Failed to count mutations, using memory queue', error)
      return this.fallback.size()
    }
  }
}
