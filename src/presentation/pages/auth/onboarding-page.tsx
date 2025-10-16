import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/auth-provider'
import { AlertCircle, Building2, User, Layers } from 'lucide-react'
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
          <AlertCircle size={20} strokeWidth={2} aria-hidden="true" />
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
              <Building2 size={18} strokeWidth={2} />
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
                <User size={18} strokeWidth={2} />
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
                <Layers size={18} strokeWidth={2} />
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
