import { Button, Surface, TextField } from '@shared/components/ui'
import './dashboard-landing.css'

export const DashboardLanding = () => {
  return (
    <div className="dashboard-landing">
      <header className="dashboard-landing__header">
        <div>
          <p className="dashboard-landing__label">Executive Overview</p>
          <h1 className="dashboard-landing__title">Construction ERP Control Center</h1>
        </div>
        <Button variant="secondary">Create Project</Button>
      </header>

      <section className="dashboard-landing__grid">
        <Surface className="dashboard-landing__card">
          <h2 className="dashboard-landing__card-title">Quick Filters</h2>
          <div className="dashboard-landing__form">
            <TextField label="Project" placeholder="Search projects" />
            <TextField label="Location" placeholder="Filter by region" />
            <Button block>Apply Filters</Button>
          </div>
        </Surface>

        <Surface className="dashboard-landing__card" variant="muted">
          <h2 className="dashboard-landing__card-title">Next Steps</h2>
          <ul className="dashboard-landing__list">
            <li>Configure access roles for new sites</li>
            <li>Sync procurement data with suppliers</li>
            <li>Review weekly cost variance report</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
