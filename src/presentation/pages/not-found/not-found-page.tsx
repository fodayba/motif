import { Button } from '@shared/components/ui'
import './not-found-page.css'
import { useNavigate } from 'react-router-dom'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__visual">
          <div className="not-found__icon">
            <FileQuestion size={64} strokeWidth={1} />
          </div>
          <div className="not-found__status">404</div>
        </div>
        
        <div className="not-found__content">
          <h1 className="not-found__title">Page not found</h1>
          <p className="not-found__message">
            The page you're looking for doesn't exist or has been moved. Please check the URL or return to the dashboard.
          </p>
        </div>

        <div className="not-found__actions">
          <Button onClick={() => navigate('/')}>
            <Home size={18} strokeWidth={1.5} />
            Back to dashboard
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft size={18} strokeWidth={1.5} />
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
