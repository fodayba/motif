import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/auth-provider'
import { AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import './auth-pages.css'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { signInWithEmail } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState({ email: false, password: false })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    try {
      setIsSubmitting(true)
      const result = await signInWithEmail(form)
      navigate(result.nextRoute)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to sign in')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = () => {
    setError('Google sign-in is not yet available in this preview build. Please continue with email access.')
  }

  return (
    <section>
      <header className="form-header">
        <h2>Welcome back</h2>
        <p>Enter your enterprise access credentials to rejoin your workspace.</p>
      </header>
      {error ? (
        <div className="error-banner" role="alert">
          <AlertCircle size={20} strokeWidth={2} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      <form className="form-body" onSubmit={handleSubmit} noValidate>
        <div className="input-group">
          <label className="form-label" htmlFor="login-email">
            Work email
          </label>
          <div
            className={`input-container${focusedField.email ? ' focused' : ''}${error ? ' error' : ''}`}
          >
            <span className="input-icon" aria-hidden="true">
              <Mail size={18} strokeWidth={2} />
            </span>
            <input
              id="login-email"
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

        <div className="input-group">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <div
            className={`input-container${focusedField.password ? ' focused' : ''}${error ? ' error' : ''}`}
          >
            <span className="input-icon" aria-hidden="true">
              <Lock size={18} strokeWidth={2} />
            </span>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className="form-input"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
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
              {showPassword ? (
                <EyeOff size={18} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Eye size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="form-options">
            <Link to="/auth/forgot-password" className="form-options__link">
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        <button
          type="button"
          className="google-button"
          disabled={isSubmitting}
          onClick={handleGoogleSignIn}
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
          Need an account?{' '}
          <Link to="/auth/register" className="link">
            Create one
          </Link>
        </p>
      </div>
    </section>
  )
}
