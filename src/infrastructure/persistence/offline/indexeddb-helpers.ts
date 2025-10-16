const DB_NAME = 'motif-offline-persistence'
const DB_VERSION = 1
const CACHE_STORE = 'cache'
const MUTATION_STORE = 'mutations'

export type StoreName = typeof CACHE_STORE | typeof MUTATION_STORE

const isBrowser = typeof window !== 'undefined'
const supportsIndexedDb = () => isBrowser && typeof indexedDB !== 'undefined'

let databasePromise: Promise<IDBDatabase> | null = null

const openDatabase = (): Promise<IDBDatabase> => {
  if (!supportsIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment'))
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains(MUTATION_STORE)) {
          const store = db.createObjectStore(MUTATION_STORE, { keyPath: 'id' })
          store.createIndex('channel', 'channel', { unique: false })
        }
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to open IndexedDB'))
      }
    })
  }

  return databasePromise
}

export const withStore = async <T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
  const db = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    let result: T

    operation(store)
      .then((value) => {
        result = value
      })
      .catch((error) => {
        transaction.abort()
        reject(error)
      })

    transaction.oncomplete = () => {
      resolve(result)
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction error'))
    }

    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    }
  })
}

export const closeDatabase = async () => {
  if (!databasePromise) {
    return
  }

  const db = await databasePromise
  db.close()
  databasePromise = null
}

export const STORE = {
  CACHE: CACHE_STORE,
  MUTATIONS: MUTATION_STORE,
} as const

export const indexedDbSupported = supportsIndexedDb
