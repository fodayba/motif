import type { Permission } from '@domain/access-control'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAccessControl } from '../providers/access-control-provider'
import { useAuth } from '../providers/auth-provider'
import { ForbiddenPage } from '@presentation/pages/forbidden/forbidden-page'

type ModuleGuardProps = {
  requiredPermissions?: Permission[]
}

export const ModuleGuard = ({ requiredPermissions = [] }: ModuleGuardProps) => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { can } = useAccessControl()
  const normalizedPermissions = requiredPermissions.filter(Boolean)
  const hasAccess =
    normalizedPermissions.length === 0 ||
    normalizedPermissions.every((permission) => can(permission))

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />
  }

  if (!hasAccess) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
