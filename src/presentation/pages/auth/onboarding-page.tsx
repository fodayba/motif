import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/auth-provider'
import './auth-pages.css'

export const OnboardingPage = () => {
  const navigate = useNavigate()
  const { completeOnboarding, user } = useAuth()
  const [form, setForm] = useState({
    organizationName: '',
    role: '',
    projectFocus: '',
    acceptTerms: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState({
    organizationName: false,
    role: false,
    projectFocus: false,
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!form.acceptTerms) {
      setError('Please confirm the terms to continue')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await completeOnboarding({
        organizationName: form.organizationName,
        role: form.role,
        acceptTerms: form.acceptTerms,
      })
      navigate(result.nextRoute)
    } catch (onboardingError) {
      setError(
        onboardingError instanceof Error
          ? onboardingError.message
          : 'Unable to complete onboarding',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <header className="form-header">
        <h2>Finish setting up your workspace</h2>
        <p>
          Tailor dashboards and field alerts for {user?.displayName ?? 'your team'} with a few quick
          details.
        </p>
      </header>
      {error ? (
        <div className="error-banner" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      ) : null}
      <form className="form-body" onSubmit={handleSubmit} noValidate>
        <div className="input-group">
          <label className="form-label" htmlFor="onboarding-organization">
            Company or project name
          </label>
          <div
            className={`input-container${focusedField.organizationName ? ' focused' : ''}`}
          >
            <span className="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M9 8h6" />
                <path d="M8 21V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16" />
              </svg>
            </span>
            <input
              id="onboarding-organization"
              name="organizationName"
              type="text"
              placeholder="Motif Construction Group"
              required
              className="form-input"
              value={form.organizationName}
              onChange={(event) =>
                setForm((current) => ({ ...current, organizationName: event.target.value }))
              }
              onFocus={() => setFocusedField((state) => ({ ...state, organizationName: true }))}
              onBlur={() => setFocusedField((state) => ({ ...state, organizationName: false }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label className="form-label" htmlFor="onboarding-role">
              Your role
            </label>
            <div className={`input-container${focusedField.role ? ' focused' : ''}`}>
              <span className="input-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="onboarding-role"
                name="role"
                type="text"
                placeholder="Project director"
                required
                className="form-input"
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value }))
                }
                onFocus={() => setFocusedField((state) => ({ ...state, role: true }))}
                onBlur={() => setFocusedField((state) => ({ ...state, role: false }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="form-label" htmlFor="onboarding-focus">
              Primary project focus
            </label>
            <div className={`input-container${focusedField.projectFocus ? ' focused' : ''}`}>
              <span className="input-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </span>
              <input
                id="onboarding-focus"
                name="projectFocus"
                type="text"
                placeholder="Commercial, infrastructure, industrial..."
                className="form-input"
                value={form.projectFocus}
                onChange={(event) =>
                  setForm((current) => ({ ...current, projectFocus: event.target.value }))
                }
                onFocus={() => setFocusedField((state) => ({ ...state, projectFocus: true }))}
                onBlur={() => setFocusedField((state) => ({ ...state, projectFocus: false }))}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-option">
            <input
              type="checkbox"
              className="checkbox-input"
              checked={form.acceptTerms}
              onChange={(event) =>
                setForm((current) => ({ ...current, acceptTerms: event.target.checked }))
              }
            />
            <span className="checkbox-custom" aria-hidden="true" />
            <span className="checkbox-content">
              <span className="checkbox-title">
                I agree to the{' '}
                <a href="https://motif-erp.io/terms" target="_blank" rel="noreferrer" className="link">
                  Motif ERP Terms of Service
                </a>{' '}
                and{' '}
                <a href="https://motif-erp.io/privacy" target="_blank" rel="noreferrer" className="link">
                  Privacy Policy
                </a>
              </span>
            </span>
          </label>
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Finalizing…' : 'Complete onboarding'}
        </button>
      </form>
    </section>
  )
}
