import { Button, Surface } from '@shared/components/ui'
import './forbidden-page.css'
import { useNavigate } from 'react-router-dom'

export const ForbiddenPage = () => {
  const navigate = useNavigate()

  return (
    <div className="forbidden">
      <Surface className="forbidden__card" padding="lg">
        <span className="forbidden__badge">403</span>
        <h1 className="forbidden__title">Access restricted</h1>
        <p className="forbidden__message">
          You do not have permission to open this workspace module. Request access or try a different
          area.
        </p>
        <div className="forbidden__actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate('/')}>Return to dashboard</Button>
        </div>
      </Surface>
    </div>
  )
}
