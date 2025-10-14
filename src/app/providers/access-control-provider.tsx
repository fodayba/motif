import type { PropsWithChildren } from 'react'
import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './auth-provider'

type Permission =
  | 'projects:view'
  | 'projects:edit'
  | 'inventory:view'
  | 'inventory:edit'
  | 'finance:view'
  | 'finance:manage'
  | 'admin:manage'

type AccessControlContextValue = {
  can: (permission: Permission) => boolean
  permissions: Permission[]
}

const AccessControlContext =
  createContext<AccessControlContextValue | undefined>(undefined)

const roleMap: Record<string, Permission[]> = {
  'system-admin': [
    'projects:view',
    'projects:edit',
    'inventory:view',
    'inventory:edit',
    'finance:view',
    'finance:manage',
    'admin:manage',
  ],
  'project-manager': ['projects:view', 'projects:edit', 'inventory:view'],
  'inventory-manager': ['inventory:view', 'inventory:edit'],
  'finance-manager': ['finance:view', 'finance:manage'],
}

export const AccessControlProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth()

  const permissions = useMemo<Permission[]>(() => {
    if (!user) {
      return []
    }

    const derived = user.roles.flatMap((role) => roleMap[role] ?? [])
    return Array.from(new Set(derived))
  }, [user])

  const value = useMemo<AccessControlContextValue>(
    () => ({
      permissions,
      can: (permission) => permissions.includes(permission),
    }),
    [permissions],
  )

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  )
}

export const useAccessControl = () => {
  const context = useContext(AccessControlContext)

  if (!context) {
    throw new Error('useAccessControl must be used within an AccessControlProvider')
  }

  return context
}
