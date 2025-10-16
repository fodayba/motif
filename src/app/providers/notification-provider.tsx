import type { PropsWithChildren } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { nanoid } from 'nanoid/non-secure'
import {
  InAppNotificationCenter,
  type NotificationDraft,
  type NotificationMutations,
  type NotificationSnapshot,
} from '@shared/components/feedback'
import { useModalHelpers } from '@shared/components/overlay'
import { IndexedDbOfflineCache } from '@infrastructure/persistence/offline'
import { useOfflineSync } from './offline-provider'

const CACHE_KEY = 'notification-center:snapshots'
const MUTATION_CHANNEL = 'notification-center'

export type NotificationLoaderOptions = {
  force?: boolean
}

export type NotificationLoader = (options?: NotificationLoaderOptions) => Promise<NotificationSnapshot[]>

type NotificationCenterProviderProps = PropsWithChildren<{
  loader?: NotificationLoader
  mutations?: NotificationMutations
}>

type StoredNotification = {
  id: string
  title: string
  description: string
  createdAt: string
  channelId: string
  channelLabel: string
  priority: NotificationSnapshot['priority']
  readAt?: string | null
  tags?: string[]
  actionLabel?: string
}

type NotificationMutationPayload =
  | { type: 'markRead'; id: string }
  | { type: 'markAllRead' }
  | { type: 'act'; id: string }

type NotificationCenterContextValue = {
  items: NotificationSnapshot[]
  unreadCount: number
  isHydrating: boolean
  isCenterOpen: boolean
  lastSyncedAt: number | null
  openCenter: () => void
  closeCenter: () => void
  toggleCenter: () => void
  pushNotification: (draft: NotificationDraft) => NotificationSnapshot
  replaceNotifications: (next: NotificationSnapshot[]) => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  triggerAction: (item: NotificationSnapshot) => Promise<void>
  registerActionHandler: (handler: (item: NotificationSnapshot) => void) => () => void
  refresh: (options?: NotificationLoaderOptions) => Promise<void>
}

const NotificationCenterContext = createContext<NotificationCenterContextValue | null>(null)

export const useNotificationCenter = () => {
  const context = useContext(NotificationCenterContext)

  if (!context) {
    throw new Error('NotificationCenterProvider is missing from the component tree')
  }

  return context
}

type SnapshotInput = {
  id: string
  title: string
  description: string
  createdAt: Date | string | number
  channelId: string
  channelLabel: string
  priority?: NotificationSnapshot['priority']
  readAt?: Date | string | number | null
  tags?: string[]
  actionLabel?: string
}

const coerceDate = (value: Date | string | number | null | undefined): Date | undefined => {
  if (value === null || value === undefined) {
    return undefined
  }

  if (value instanceof Date) {
    return value
  }

  const timestamp = typeof value === 'number' ? value : Date.parse(String(value))

  if (Number.isNaN(timestamp)) {
    return undefined
  }

  return new Date(timestamp)
}

const toSnapshot = (input: SnapshotInput): NotificationSnapshot => {
  const created = coerceDate(input.createdAt) ?? new Date()
  const readAt = coerceDate(input.readAt)

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    createdAt: created,
    channelId: input.channelId,
    channelLabel: input.channelLabel,
    priority: input.priority ?? 'normal',
    readAt: readAt ?? undefined,
    tags: Array.isArray(input.tags) ? input.tags : [],
    actionLabel: input.actionLabel,
  }
}

const serializeNotifications = (items: NotificationSnapshot[]): StoredNotification[] => {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    createdAt: item.createdAt.toISOString(),
    channelId: item.channelId,
    channelLabel: item.channelLabel,
    priority: item.priority,
    readAt: item.readAt ? item.readAt.toISOString() : null,
    tags: item.tags,
    actionLabel: item.actionLabel,
  }))
}

const deserializeNotifications = (items: StoredNotification[]): NotificationSnapshot[] => {
  return items.map((item) =>
    toSnapshot({
      id: item.id,
      title: item.title,
      description: item.description,
      createdAt: item.createdAt,
      channelId: item.channelId,
      channelLabel: item.channelLabel,
      priority: item.priority,
      readAt: item.readAt,
      tags: item.tags,
      actionLabel: item.actionLabel,
    }),
  )
}

const sortByCreatedAtDesc = (items: NotificationSnapshot[]) => {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

const NotificationCenterContent = () => {
  const { items, isHydrating, markRead, markAllRead, triggerAction } = useNotificationCenter()

  return (
    <InAppNotificationCenter
      items={items}
      isLoading={isHydrating && items.length === 0}
      onMarkRead={(id) => {
        void markRead(id)
      }}
      onMarkAllRead={() => {
        void markAllRead()
      }}
      onAction={(item) => {
        void triggerAction(item)
      }}
    />
  )
}

export const NotificationCenterProvider = ({ children, loader, mutations }: NotificationCenterProviderProps) => {
  const cache = useMemo(() => new IndexedDbOfflineCache(), [])
  const { queueMutation, registerMutationHandler } = useOfflineSync()
  const { openSheet, closeModal } = useModalHelpers()

  const [items, setItems] = useState<NotificationSnapshot[]>([])
  const [isHydrating, setIsHydrating] = useState(false)
  const [isCenterOpen, setIsCenterOpen] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const centerModalIdRef = useRef<string | null>(null)

  const itemsRef = useRef<NotificationSnapshot[]>([])
  const mutationsRef = useRef<NotificationMutations | undefined>(mutations)
  const loaderRef = useRef<NotificationLoader | undefined>(loader)
  const actionHandlerRef = useRef<((item: NotificationSnapshot) => void) | null>(null)
  const pendingRequestsRef = useRef(0)

  useEffect(() => {
    mutationsRef.current = mutations
  }, [mutations])

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  const beginHydration = useCallback(() => {
    pendingRequestsRef.current += 1
    setIsHydrating(true)
  }, [])

  const endHydration = useCallback(() => {
    pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1)
    if (pendingRequestsRef.current === 0) {
      setIsHydrating(false)
    }
  }, [])

  const commit = useCallback(
    (next: NotificationSnapshot[], options?: { persist?: boolean; syncedAt?: number | null }) => {
      const sorted = sortByCreatedAtDesc(next)
      itemsRef.current = sorted
      setItems(sorted)

      if (options && Object.prototype.hasOwnProperty.call(options, 'syncedAt')) {
        setLastSyncedAt(options?.syncedAt ?? null)
      }

      if (options?.persist === false) {
        return
      }

      void cache
        .set(CACHE_KEY, serializeNotifications(sorted), {
          tags: ['notification-center'],
        })
        .catch((error) => {
          console.error('[notification-center] failed to persist cache', error)
        })
    },
    [cache],
  )

  const loadCached = useCallback(async () => {
    beginHydration()
    try {
      const cached = await cache.get<StoredNotification[]>(CACHE_KEY)
      if (cached?.data) {
        commit(deserializeNotifications(cached.data), {
          persist: false,
          syncedAt: cached.updatedAt ?? null,
        })
      }
    } catch (error) {
      console.warn('[notification-center] failed to read cache', error)
    } finally {
      endHydration()
    }
  }, [beginHydration, cache, commit, endHydration])

  const runLoader = useCallback(
    async (options?: NotificationLoaderOptions) => {
      if (!loaderRef.current) {
        return
      }

      beginHydration()
      try {
        const fetched = await loaderRef.current(options)
        const normalized = Array.isArray(fetched)
          ? fetched.map((item) => toSnapshot({ ...item }))
          : []

        commit(normalized, {
          syncedAt: Date.now(),
        })
      } catch (error) {
        console.error('[notification-center] failed to refresh notifications', error)
      } finally {
        endHydration()
      }
    },
    [beginHydration, commit, endHydration],
  )

  const enqueueMutation = useCallback(
    async (payload: NotificationMutationPayload) => {
      try {
        await queueMutation({
          channel: MUTATION_CHANNEL,
          payload,
          metadata: { scope: 'notification-center' },
        })
      } catch (error) {
        console.error('[notification-center] failed to queue mutation', error)
      }
    },
    [queueMutation],
  )

  const markRead = useCallback(
    async (id: string) => {
      const next: NotificationSnapshot[] = []
      let changed = false

      for (const item of itemsRef.current) {
        if (item.id === id && !item.readAt) {
          changed = true
          next.push({ ...item, readAt: new Date() })
        } else {
          next.push(item)
        }
      }

      if (changed) {
        commit(next)
      }

      const remote = mutationsRef.current?.markRead
      if (!remote) {
        return
      }

      try {
        await remote(id)
      } catch (error) {
        console.warn('[notification-center] markRead failed, queuing', error)
        await enqueueMutation({ type: 'markRead', id })
      }
    },
    [commit, enqueueMutation],
  )

  const markAllRead = useCallback(async () => {
    const next: NotificationSnapshot[] = []
    let changed = false

    for (const item of itemsRef.current) {
      if (!item.readAt) {
        changed = true
        next.push({ ...item, readAt: new Date() })
      } else {
        next.push(item)
      }
    }

    if (changed) {
      commit(next)
    }

    const remote = mutationsRef.current?.markAllRead
    if (!remote) {
      return
    }

    try {
      await remote()
    } catch (error) {
      console.warn('[notification-center] markAllRead failed, queuing', error)
      await enqueueMutation({ type: 'markAllRead' })
    }
  }, [commit, enqueueMutation])

  const triggerAction = useCallback(
    async (item: NotificationSnapshot) => {
      await markRead(item.id)

      const handler = actionHandlerRef.current
      if (handler) {
        handler(item)
      }

      const remote = mutationsRef.current?.actOnNotification
      if (!remote) {
        return
      }

      try {
        await remote(item.id)
      } catch (error) {
        console.warn('[notification-center] action handler failed, queuing', error)
        await enqueueMutation({ type: 'act', id: item.id })
      }
    },
    [enqueueMutation, markRead],
  )

  const pushNotification = useCallback(
    (draft: NotificationDraft) => {
      const snapshot = toSnapshot({
        id: draft.id ?? nanoid(),
        title: draft.title,
        description: draft.description,
        createdAt: draft.createdAt ?? new Date(),
        channelId: draft.channelId,
        channelLabel: draft.channelLabel,
        priority: draft.priority,
        readAt: draft.readAt ?? null,
        tags: draft.tags,
        actionLabel: draft.actionLabel,
      })

      commit([snapshot, ...itemsRef.current])
      return snapshot
    },
    [commit],
  )

  const replaceNotifications = useCallback(
    (next: NotificationSnapshot[]) => {
      commit(next)
    },
    [commit],
  )

  const registerActionHandler = useCallback((handler: (item: NotificationSnapshot) => void) => {
    actionHandlerRef.current = handler
    return () => {
      if (actionHandlerRef.current === handler) {
        actionHandlerRef.current = null
      }
    }
  }, [])

  const unregisterModal = useCallback(() => {
    centerModalIdRef.current = null
    setIsCenterOpen(false)
  }, [])

  const openCenter = useCallback(() => {
    setIsCenterOpen(true)
    const current = centerModalIdRef.current

    if (current) {
      closeModal(current)
    }

    const id = openSheet(<NotificationCenterContent />, {
      ariaLabel: 'Notification center',
      size: 'lg',
      onDismiss: unregisterModal,
    })

    centerModalIdRef.current = id
  }, [closeModal, openSheet, unregisterModal])

  const closeCenter = useCallback(() => {
    const current = centerModalIdRef.current
    if (current) {
      closeModal(current)
      centerModalIdRef.current = null
    }
    setIsCenterOpen(false)
  }, [closeModal])

  const toggleCenter = useCallback(() => {
    if (isCenterOpen) {
      closeCenter()
    } else {
      openCenter()
    }
  }, [closeCenter, isCenterOpen, openCenter])

  const refresh = useCallback(
    async (options?: NotificationLoaderOptions) => {
      if (loaderRef.current) {
        await runLoader(options)
      } else {
        await loadCached()
      }
    },
    [loadCached, runLoader],
  )

  useEffect(() => {
    void loadCached()
  }, [loadCached])

  useEffect(() => {
    if (!loaderRef.current) {
      return
    }

    void runLoader()
  }, [runLoader])

  useEffect(() => {
    const unsubscribe = registerMutationHandler(MUTATION_CHANNEL, async (mutation) => {
      const payload = mutation.payload as NotificationMutationPayload
      const current = mutationsRef.current

      if (!current) {
        return
      }

      try {
        if (payload.type === 'markRead' && current.markRead) {
          await current.markRead(payload.id)
        } else if (payload.type === 'markAllRead' && current.markAllRead) {
          await current.markAllRead()
        } else if (payload.type === 'act' && current.actOnNotification) {
          await current.actOnNotification(payload.id)
        }
      } catch (error) {
        console.warn('[notification-center] queued mutation failed, will retry', error)
        throw error
      }
    })

    return unsubscribe
  }, [registerMutationHandler])

  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items])

  const value = useMemo<NotificationCenterContextValue>(() => {
    return {
      items,
      unreadCount,
      isHydrating,
      isCenterOpen,
      lastSyncedAt,
      openCenter,
      closeCenter,
      toggleCenter,
      pushNotification,
      replaceNotifications,
      markRead,
      markAllRead,
      triggerAction,
      registerActionHandler,
      refresh,
    }
  }, [
    items,
    unreadCount,
    isHydrating,
    isCenterOpen,
    lastSyncedAt,
    openCenter,
    closeCenter,
    toggleCenter,
    pushNotification,
    replaceNotifications,
    markRead,
    markAllRead,
    triggerAction,
    registerActionHandler,
    refresh,
  ])

  return <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>
}

