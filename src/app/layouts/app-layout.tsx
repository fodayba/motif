import { Suspense, useMemo } from 'react'
import { NavLink, Outlet, useMatches, useNavigate } from 'react-router-dom'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'
import '@shared/styles/app-shell.css'
import { Button, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@shared/components/ui'
import { NotificationTrigger } from '../components/notification-trigger'
import { ThemeToggle } from '../components/theme-toggle'
import { DensityToggle } from '../components/density-toggle'
import { useAuth } from '../providers/auth-provider'
import { useAccessControl } from '../providers/access-control-provider'
import { APP_NAVIGATION } from '../router/navigation'
import { NAVIGATION_ICONS } from '../router/navigation-icons'

type RouteHandle = {
  navId?: string
  label?: string
  description?: string
}

export const AppLayout = () => {
  const { isAuthenticated, user, signOut } = useAuth()
  const { can } = useAccessControl()
  const navigate = useNavigate()

  const matches = useMatches()

  const activeMeta = useMemo<RouteHandle>(() => {
    const reversed = [...matches].reverse()
    for (const match of reversed) {
      if (match.handle && typeof match.handle === 'object') {
        return match.handle as RouteHandle
      }
    }
    return {}
  }, [matches])

  const navigationGroups = useMemo(() => {
    return APP_NAVIGATION.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
          return true
        }

        return item.requiredPermissions.every((permission) => can(permission))
      }),
    })).filter((group) => group.items.length > 0)
  }, [can])

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <button
          type="button"
          className="app-shell__brand"
          onClick={() => navigate('/')}
        >
          Motif ERP
        </button>
        <nav className="app-shell__nav" aria-label="Primary">
          {navigationGroups.length === 0 ? (
            <p className="app-shell__nav-empty">No modules assigned to your role yet.</p>
          ) : (
            navigationGroups.map((group) => (
              <div key={group.id} className="app-shell__nav-group">
                <span className="app-shell__nav-heading">{group.label}</span>
                <div className="app-shell__nav-links">
                  {group.items.map((item) => {
                    const Icon = NAVIGATION_ICONS[item.id]
                    return (
                      <NavLink
                        key={item.id}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link'
                        }
                      >
                        {Icon && <Icon className="app-shell__link-icon" strokeWidth={1.5} />}
                        <div className="app-shell__link-content">
                          <span className="app-shell__link-label">{item.label}</span>
                          <span className="app-shell__link-description">{item.description}</span>
                        </div>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </nav>
      </aside>

      <div className="app-shell__body">
        <header className="app-shell__topbar">
          <div className="app-shell__breadcrumb">
            <span className="app-shell__breadcrumb-eyebrow">Workspace module</span>
            <h1 className="app-shell__breadcrumb-title">
              {activeMeta.label ?? 'Workspace overview'}
            </h1>
            {activeMeta.description ? (
              <p className="app-shell__breadcrumb-description">{activeMeta.description}</p>
            ) : null}
          </div>
          <div className="app-shell__topbar-actions">
            <ThemeToggle />
            <DensityToggle />
            <NotificationTrigger />
            {isAuthenticated && user ? (
              <DropdownMenu
                trigger={
                  <div className="app-shell__user">
                    <User size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    {user.displayName}
                    <ChevronDown size={14} strokeWidth={1.5} style={{ display: 'inline', marginLeft: '6px', verticalAlign: 'middle', opacity: 0.6 }} />
                  </div>
                }
                align="right"
              >
                <DropdownMenuItem
                  icon={<User size={16} strokeWidth={1.5} />}
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  icon={<Settings size={16} strokeWidth={1.5} />}
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  icon={<LogOut size={16} strokeWidth={1.5} />}
                  onClick={() => void signOut()}
                  variant="danger"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth/login')}>Sign in</Button>
            )}
          </div>
        </header>

        <main className="app-shell__content">
          <Suspense fallback={<div className="app-shell__fallback">Loading module…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
