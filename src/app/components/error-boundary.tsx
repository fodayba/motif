import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw, FileQuestion, ArrowLeft } from 'lucide-react'
import './error-boundary.css'

export const ErrorBoundary = () => {
  const error = useRouteError()
  let errorMessage: string
  let errorStatus: string | number = 'Error'
  let errorSubtitle: string

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status
    errorMessage = error.statusText || error.data?.message || 'An error occurred'
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else {
    errorMessage = 'An unexpected error occurred'
  }

  const handleReload = () => {
    window.location.reload()
  }

  const is404 = errorStatus === 404

  if (is404) {
    errorSubtitle = "The page you're looking for doesn't exist or has been moved."
  } else {
    errorSubtitle = 'An unexpected error has occurred. Our team has been notified.'
  }

  return (
    <div className="error-boundary">
      <div className="error-boundary__backdrop" />
      <div className="error-boundary__container">
        <div className="error-boundary__card">
          <div className="error-boundary__visual">
            {is404 ? (
              <>
                <div className="error-boundary__icon-wrapper error-boundary__icon-wrapper--404">
                  <FileQuestion size={48} strokeWidth={1} />
                </div>
                <div className="error-boundary__status">404</div>
              </>
            ) : (
              <div className="error-boundary__icon-wrapper error-boundary__icon-wrapper--error">
                <AlertTriangle size={48} strokeWidth={1.5} />
              </div>
            )}
          </div>
          
          <div className="error-boundary__content">
            <h1 className="error-boundary__title">
              {is404 ? 'Page Not Found' : 'Something Went Wrong'}
            </h1>
            
            <p className="error-boundary__subtitle">
              {errorSubtitle}
            </p>

            <p className="error-boundary__message">
              {errorMessage}
            </p>

            {!is404 && error instanceof Error && error.stack && (
              <details className="error-boundary__details">
                <summary>View technical details</summary>
                <pre className="error-boundary__stack">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="error-boundary__actions">
            {is404 ? (
              <>
                <Link to="/" className="error-boundary__button error-boundary__button--primary">
                  <Home size={18} strokeWidth={1.5} />
                  <span>Return Home</span>
                </Link>
                <button onClick={() => window.history.back()} className="error-boundary__button error-boundary__button--ghost">
                  <ArrowLeft size={18} strokeWidth={1.5} />
                  <span>Go Back</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={handleReload} className="error-boundary__button error-boundary__button--primary">
                  <RefreshCw size={18} strokeWidth={1.5} />
                  <span>Try Again</span>
                </button>
                <Link to="/" className="error-boundary__button error-boundary__button--ghost">
                  <Home size={18} strokeWidth={1.5} />
                  <span>Return Home</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
