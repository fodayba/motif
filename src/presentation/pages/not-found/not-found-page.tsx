import { Button, Surface } from '@shared/components/ui'
import './not-found-page.css'
import { useNavigate } from 'react-router-dom'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="not-found">
      <Surface className="not-found__card" padding="lg">
        <h1 className="not-found__title">Page Not Found</h1>
        <p className="not-found__message">
          The requested resource could not be located. Check the URL or return to
          the dashboard.
        </p>
        <Button onClick={() => navigate('/')}>Return to dashboard</Button>
      </Surface>
    </div>
  )
}
