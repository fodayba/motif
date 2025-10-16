import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { AlertCircle, Home, RefreshCw, FileQuestion, ArrowLeft } from 'lucide-react'
import './error-boundary.css'

export const ErrorBoundary = () => {
  const error = useRouteError()
  let errorMessage: string
  let errorStatus: string | number = 'Error'

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

  return (
    <div className="error-boundary">
      <div className="error-boundary__container">
        <div className="error-boundary__visual">
          {is404 ? (
            <>
              <div className="error-boundary__icon error-boundary__icon--large">
                <FileQuestion size={64} strokeWidth={1} />
              </div>
              <div className="error-boundary__status">404</div>
            </>
          ) : (
            <div className="error-boundary__icon">
              <AlertCircle size={56} strokeWidth={1.5} />
            </div>
          )}
        </div>
        
        <div className="error-boundary__content">
          <h1 className="error-boundary__title">
            {is404 ? 'Page not found' : 'Something went wrong'}
          </h1>
          
          <p className="error-boundary__message">
            {is404
              ? "The page you're looking for doesn't exist or has been moved. Please check the URL or return to the homepage."
              : errorMessage}
          </p>

          {!is404 && (
            <details className="error-boundary__details">
              <summary>Technical details</summary>
              <pre className="error-boundary__stack">
                {error instanceof Error && error.stack ? error.stack : JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>

        <div className="error-boundary__actions">
          {is404 ? (
            <>
              <Link to="/" className="error-boundary__button error-boundary__button--primary">
                <Home size={18} strokeWidth={1.5} />
                Back to home
              </Link>
              <button onClick={() => window.history.back()} className="error-boundary__button error-boundary__button--secondary">
                <ArrowLeft size={18} strokeWidth={1.5} />
                Go back
              </button>
            </>
          ) : (
            <>
              <button onClick={handleReload} className="error-boundary__button error-boundary__button--primary">
                <RefreshCw size={18} strokeWidth={1.5} />
                Reload page
              </button>
              <Link to="/" className="error-boundary__button error-boundary__button--secondary">
                <Home size={18} strokeWidth={1.5} />
                Back to home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
