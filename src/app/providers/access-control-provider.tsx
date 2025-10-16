import type { PropsWithChildren } from 'react'
import { createContext, useContext, useMemo } from 'react'
import type { Permission } from '@domain/access-control'
import { PERMISSIONS } from '@domain/access-control'
import { useAuth } from './auth-provider'

type AccessControlContextValue = {
  can: (permission: Permission) => boolean
  permissions: Permission[]
}

const AccessControlContext =
  createContext<AccessControlContextValue | undefined>(undefined)

const roleMap: Record<string, Permission[]> = {
  'system-admin': [...PERMISSIONS],
  'project-manager': [
    'projects.read',
    'projects.manage',
    'equipment.read',
    'inventory.read',
    'procurement.read',
    'quality.read',
    'documents.read',
    'analytics.read',
  ],
  'equipment-manager': ['equipment.read', 'equipment.manage', 'inventory.read'],
  'inventory-manager': ['inventory.read', 'inventory.manage', 'equipment.read'],
  'procurement-manager': ['procurement.read', 'procurement.manage', 'inventory.read'],
  'finance-manager': ['finance.read', 'finance.manage', 'projects.read', 'documents.read'],
  'quality-manager': [
    'quality.read',
    'quality.manage',
    'safety.read',
    'safety.manage',
    'documents.read',
  ],
  executive: ['projects.read', 'finance.read', 'analytics.read', 'documents.read'],
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
