import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import '@shared/styles/auth-layout.css'
import { useMemo } from 'react'
import { useAuth } from '../providers/auth-provider'

export const AuthLayout = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const currentYear = new Date().getFullYear()

  const pageKey = useMemo(() => {
    const path = location.pathname.toLowerCase()
    if (path.includes('/auth/register')) {
      return 'register'
    }
    if (path.includes('/auth/mfa')) {
      return 'mfa'
    }
    if (path.includes('/auth/onboarding')) {
      return 'onboarding'
    }
    return 'login'
  }, [location.pathname])

  const branding = useMemo(() => {
    if (pageKey === 'register') {
      return {
        eyebrow: 'Premium onboarding',
        title: 'Begin your journey',
        subtitle: 'Join construction teams leading complex projects with refined operational control.',
      }
    }
    if (pageKey === 'onboarding') {
      return {
        eyebrow: 'Workspace setup',
        title: 'Configure your workspace',
        subtitle: 'Tailor notifications, project oversight, and team access to match your operating rhythm.',
      }
    }
    if (pageKey === 'mfa') {
      return {
        eyebrow: 'Secure access',
        title: 'Verify your identity',
        subtitle: 'Multi-factor authentication keeps sensitive operations and financial controls protected.',
      }
    }
    return {
      eyebrow: 'Operational excellence',
      title: 'Welcome back',
      subtitle: 'Re-enter your workspace to orchestrate budgets, field execution, and compliance in real time.',
    }
  }, [pageKey])

  if (user && !user.mfaVerified && location.pathname !== '/auth/mfa') {
    return <Navigate to="/auth/mfa" replace />
  }

  if (user && user.mfaVerified && !user.onboardingComplete && location.pathname !== '/auth/onboarding') {
    return <Navigate to="/auth/onboarding" replace />
  }

  if (isAuthenticated && user?.onboardingComplete && location.pathname.startsWith('/auth')) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={`${pageKey}-page auth-page-shell`}>
      <div className="auth-container">
        <aside className="branding-column">
          <div className="branding-nav">
            <Link to="/" className="nav-back" aria-label="Back to site">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </Link>
          </div>

          <div className="brand-identity">
            <div className="brand-mark">
              <h1 className="brand-name">Motif ERP</h1>
              <p className="brand-subtitle">Precision control for construction portfolios</p>
            </div>
          </div>

          <div className="branding-content">
            <div className="content-header">
              <span className="welcome-eyebrow">{branding.eyebrow}</span>
              <h2 className="welcome-title">{branding.title}</h2>
              <p className="welcome-subtitle">{branding.subtitle}</p>
            </div>

            <div className="value-propositions">
              <div className="value-prop">
                <div className="prop-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="prop-text">Enterprise-grade security with continuous MFA enforcement.</div>
              </div>
              <div className="value-prop">
                <div className="prop-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <circle cx="12" cy="16" r="1" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="prop-text">Centralize approvals, audits, and cost governance in one system.</div>
              </div>
              <div className="value-prop">
                <div className="prop-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="prop-text">Unify project teams, suppliers, and executives around live data.</div>
              </div>
            </div>
          </div>

          <div className="branding-footer">
            <div className="quality-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Enterprise grade</span>
            </div>
            <p className="branding-footer__meta">© {currentYear} Motif ERP · support@motif-erp.io</p>
          </div>
        </aside>

        <section className="form-column">
          <div className="form-content">
            <Outlet />
            <footer className="form-footer">
              <span>© {currentYear} Motif ERP</span>
              <a href="mailto:support@motif-erp.io">support@motif-erp.io</a>
            </footer>
          </div>
        </section>
      </div>
    </div>
  )
}
