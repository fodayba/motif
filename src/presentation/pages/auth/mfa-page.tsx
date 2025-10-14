import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/auth-provider'
import './auth-pages.css'

export const MfaPage = () => {
  const navigate = useNavigate()
  const { verifyMfa, user } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    try {
      setIsSubmitting(true)
      const result = await verifyMfa(code)
      navigate(result.nextRoute)
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : 'Unable to verify code',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCodeChange = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, '').slice(0, 6)
    setCode(numeric)
  }

  return (
    <section>
      <header className="form-header">
        <h2>Verify multi-factor authentication</h2>
        <p>
          Enter the 6-digit code from your authenticator app for {user?.email ?? 'your account'} to
          complete secure sign-in.
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
          <label className="form-label" htmlFor="mfa-code">
            Verification code
          </label>
          <div className={`input-container${isFocused ? ' focused' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M7 5v14" />
                <path d="M17 5v14" />
              </svg>
            </span>
            <input
              id="mfa-code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              required
              className="form-input"
              value={code}
              onChange={(event) => handleCodeChange(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="auth-link">
          <p>Codes refresh every 30 seconds in your authenticator app.</p>
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting || code.length !== 6}>
          {isSubmitting ? 'Verifying…' : 'Verify access'}
        </button>

        <div className="auth-link">
          <p>Lost access? Contact your administrator.</p>
        </div>
      </form>
    </section>
  )
}
