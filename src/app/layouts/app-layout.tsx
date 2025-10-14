import { Suspense } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import '@shared/styles/layout.css'
import { Button } from '@shared/components/ui'
import { ThemeToggle } from '../components/theme-toggle'
import { useAuth } from '../providers/auth-provider'

export const AppLayout = () => {
  const { isAuthenticated, user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <div className="app-layout__brand">Motif ERP</div>
        <nav className="app-layout__nav">
          <Link to="/" className="app-layout__nav-link">
            Dashboard
          </Link>
        </nav>
        <div className="app-layout__actions">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <span className="app-layout__user">{user.displayName}</span>
          ) : null}
          {isAuthenticated ? (
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth/login')}>
              Sign in
            </Button>
          )}
        </div>
      </header>
      <main className="app-layout__content">
        <Suspense fallback={<div className="app-layout__fallback">Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
