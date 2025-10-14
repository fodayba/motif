import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/auth-provider'
import './auth-pages.css'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { registerAccount } = useAuth()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    acceptTerms: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState({
    displayName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setConfirmTouched(true)
      setError('Passwords do not match')
      return
    }

    if (!form.acceptTerms) {
      setError('Please agree to the terms to continue')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await registerAccount({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
      })
      navigate(result.nextRoute)
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : 'Unable to create your account',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordsMismatch =
    confirmTouched && form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  const handleGoogleSignUp = () => {
    setError('Google sign-up is not yet available in this preview build. Please continue with email access.')
  }

  return (
    <section>
      <header className="form-header">
        <h2>Create your workspace access</h2>
        <p>Establish secure credentials for your team. You can invite collaborators after onboarding.</p>
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
          <label className="form-label" htmlFor="register-name">
            Full name
          </label>
          <div
            className={`input-container${focusedField.displayName ? ' focused' : ''}`}
          >
            <span className="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="register-name"
              name="displayName"
              type="text"
              placeholder="Alex Contractor"
              required
              className="form-input"
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({ ...current, displayName: event.target.value }))
              }
              onFocus={() => setFocusedField((state) => ({ ...state, displayName: true }))}
              onBlur={() => setFocusedField((state) => ({ ...state, displayName: false }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="form-label" htmlFor="register-email">
            Work email
          </label>
          <div className={`input-container${focusedField.email ? ' focused' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              className="form-input"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              onFocus={() => setFocusedField((state) => ({ ...state, email: true }))}
              onBlur={() => setFocusedField((state) => ({ ...state, email: false }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div
              className={`input-container${focusedField.password ? ' focused' : ''}`}
            >
              <span className="input-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                placeholder="Minimum 8 characters"
                required
                className="form-input"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                onFocus={() => setFocusedField((state) => ({ ...state, password: true }))}
                onBlur={() => setFocusedField((state) => ({ ...state, password: false }))}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {showPassword ? (
                    <>
                      <path d="M1 1l22 22" />
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.52 0-10-4-11-8 0-.72.11-1.4.31-2" />
                      <path d="M9.53 9.53a3 3 0 0 0 4.95 3.11" />
                      <path d="M9.88 4.12A10.05 10.05 0 0 1 12 4c5.52 0 10 4 11 8-.27 1.35-.8 2.6-1.53 3.68" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm password
            </label>
            <div
              className={`input-container${focusedField.confirmPassword ? ' focused' : ''}${
                passwordsMismatch ? ' error' : ''
              }`}
            >
              <span className="input-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                placeholder="Re-enter password"
                required
                className="form-input"
                value={form.confirmPassword}
                onChange={(event) => {
                  const { value } = event.target
                  setForm((current) => ({ ...current, confirmPassword: value }))
                  setConfirmTouched(true)
                }}
                onFocus={() => setFocusedField((state) => ({ ...state, confirmPassword: true }))}
                onBlur={() => {
                  setFocusedField((state) => ({ ...state, confirmPassword: false }))
                  setConfirmTouched(true)
                }}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {showConfirmPassword ? (
                    <>
                      <path d="M1 1l22 22" />
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.52 0-10-4-11-8 0-.72.11-1.4.31-2" />
                      <path d="M9.53 9.53a3 3 0 0 0 4.95 3.11" />
                      <path d="M9.88 4.12A10.05 10.05 0 0 1 12 4c5.52 0 10 4 11 8-.27 1.35-.8 2.6-1.53 3.68" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {passwordsMismatch ? <p className="error-message">Passwords do not match.</p> : null}
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
                  Terms &amp; Conditions
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        <button
          type="button"
          className="google-button"
          disabled={isSubmitting}
          onClick={handleGoogleSignUp}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
      </form>

      <div className="auth-link">
        <p>
          Already have access?{' '}
          <Link to="/auth/login" className="link">
            Back to sign in
          </Link>
        </p>
      </div>
    </section>
  )
}
