import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './quality-landing.css'

const complianceMetrics = [
  {
    id: 'inspection-pass',
    label: 'Inspection pass rate',
    value: '92%',
    detail: '7 corrective actions open',
    tone: 'warning' as const,
  },
  {
    id: 'safety-closure',
    label: 'Safety observations closed',
    value: '86%',
    detail: 'Goal ≥ 85% · trending up',
    tone: 'positive' as const,
  },
  {
    id: 'trir',
    label: 'TRIR (rolling 12 mo.)',
    value: '1.3',
    detail: 'Industry benchmark 1.5',
    tone: 'neutral' as const,
  },
  {
    id: 'near-miss',
    label: 'Near-miss reporting',
    value: '74%',
    detail: 'Need 12 more submissions',
    tone: 'warning' as const,
  },
]

const inspectionSchedule = [
  {
    id: 'insp-221',
    title: 'MEP rough-in QA walkthrough',
    project: 'North Medical Center',
    due: 'Today · 15:30',
    owner: 'Quality · J. Chen',
    status: 'scheduled' as const,
    statusLabel: 'Scheduled',
  },
  {
    id: 'insp-214',
    title: 'Tower crane safety check',
    project: 'Tower 3 · Downtown Skyline',
    due: 'Overdue 1 day',
    owner: 'Safety · M. Alvarez',
    status: 'overdue' as const,
    statusLabel: 'Overdue',
  },
  {
    id: 'insp-199',
    title: 'Concrete pour verification',
    project: 'Logistics Hub Expansion',
    due: 'Completed yesterday',
    owner: 'QA · M. Singh',
    status: 'completed' as const,
    statusLabel: 'Complete',
  },
]

const safetyAlerts = [
  {
    id: 'alert-782',
    title: 'Scaffold tie-off non-compliance',
    severity: 'high' as const,
    location: 'Tower 3 · Level 18',
    action: 'Issue stop work · inspect harness tags',
  },
  {
    id: 'alert-776',
    title: 'Heat stress monitoring',
    severity: 'medium' as const,
    location: 'North Medical Center · Exterior',
    action: 'Deploy cool-down rotations · log vitals',
  },
  {
    id: 'alert-770',
    title: 'Material storage blocking egress',
    severity: 'low' as const,
    location: 'Logistics Hub · Bay 4',
    action: 'Remove pallets · re-train crew lead',
  },
]

const correctiveActions = [
  {
    id: 'ca-118',
    description: 'Rework MEP hanger spacing per spec section 21.43',
    assignee: 'North Medical · QA',
    target: 'Due in 2 days',
    status: 'escalated' as const,
    statusLabel: 'Escalated',
  },
  {
    id: 'ca-112',
    description: 'Update hot-work permits for shift 3 contractors',
    assignee: 'Tower 3 · Safety',
    target: 'Due tomorrow',
    status: 'at-risk' as const,
    statusLabel: 'At risk',
  },
  {
    id: 'ca-104',
    description: 'Document rebar inspection photos in QA drive',
    assignee: 'Logistics Hub · QC',
    target: 'Due in 5 days',
    status: 'in-progress' as const,
    statusLabel: 'In progress',
  },
]

const trainingMatrix = [
  {
    id: 'train-1',
    cohort: 'Tower 3 · Crane ops',
    completion: 68,
    expiring: '4 certs expiring in 30 days',
  },
  {
    id: 'train-2',
    cohort: 'North Medical · Site supervisors',
    completion: 94,
    expiring: '1 OSHA 30 renewal pending',
  },
  {
    id: 'train-3',
    cohort: 'Logistics Hub · Concrete crew',
    completion: 81,
    expiring: 'Toolbox talk overdue 2 days',
  },
]

const inspectionPassSeries = [88, 89, 90, 91, 92, 92, 93]
const safetyClosureSeries = [72, 74, 78, 81, 83, 85, 86]
const trirValue = 1.3
const nearMissTargetDelta = -6
const sensorMeta = {
  iotCoverage: 48,
}

export const QualityLanding = () => {
  return (
    <div className="module-scaffold quality-landing">
      <header className="module-scaffold__header">
        <div className="module-scaffold__title">
          <span className="module-scaffold__eyebrow">Quality & Safety</span>
          <h1 className="module-scaffold__heading">Field compliance and corrective actions</h1>
          <p className="module-scaffold__summary">
            Coordinate inspections, mitigate safety hazards, and manage punch list remediation. Angular
            workflows for checklists, certifications, and regulatory exports will migrate into this module
            with richer analytics overlays.
          </p>
        </div>
        <div className="module-scaffold__actions">
          <Button>Log inspection</Button>
          <Button variant="secondary">Record safety event</Button>
        </div>
      </header>

      <section className="quality-landing__metrics">
        {complianceMetrics.map((metric) => (
          <Surface key={metric.id} className="quality-landing__metric" padding="lg">
            <span className="quality-landing__metric-label">{metric.label}</span>
            <span className="quality-landing__metric-value">{metric.value}</span>
            <span className={`quality-landing__metric-detail metric-detail--${metric.tone}`}>
              {metric.detail}
            </span>
          </Surface>
        ))}
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Inspection pass rate</div>
            <div className="module-metrics__card-value">92%</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={1.4} suffix=" pts" label="Vs. last month" />
            </div>
            <Sparkline values={inspectionPassSeries} ariaLabel="Inspection pass rate trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Safety closures</div>
            <div className="module-metrics__card-value">86%</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={3.5} suffix=" pts" label="Closure velocity" />
            </div>
            <Sparkline values={safetyClosureSeries} ariaLabel="Safety closure trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">TRIR</div>
            <RadialGauge value={trirValue} max={3} label="Rolling 12 mo." caption="Benchmark 1.5" tone="success" />
            <p className="quality-landing__metric-note">
              Keep TRIR under the benchmark by closing heat-stress and crane observations before the
              state audit window opens.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Sensor coverage" meta="IoT telemetry relaunch">
              <p className="quality-landing__metric-note">
                Wearable telemetry is {sensorMeta.iotCoverage}% deployed. Automated near-miss logging resumes once
                the device sync rewrite lands; expect {Math.abs(nearMissTargetDelta)} additional submissions to hit goal.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="quality-landing__grid">
        <Surface className="quality-landing__panel" padding="lg">
          <div className="quality-landing__panel-header">
            <h2 className="quality-landing__panel-title">Inspection timeline</h2>
            <Button variant="ghost">Schedule</Button>
          </div>
          <div className="quality-landing__list">
            {inspectionSchedule.map((inspection) => (
              <div key={inspection.id} className="quality-landing__list-item">
                <div className="quality-landing__list-content">
                  <div className="quality-landing__list-title">{inspection.title}</div>
                  <p className="quality-landing__list-subtitle">{inspection.project}</p>
                  <div className="quality-landing__list-meta">
                    <span>{inspection.due}</span>
                    <span>{inspection.owner}</span>
                  </div>
                </div>
                <span className={`quality-landing__tag quality-landing__tag--${inspection.status}`}>
                  {inspection.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="quality-landing__panel" padding="lg">
          <div className="quality-landing__panel-header">
            <h2 className="quality-landing__panel-title">Safety watchlist</h2>
            <Button variant="ghost">Mitigation</Button>
          </div>
          <div className="quality-landing__list quality-landing__list--stacked">
            {safetyAlerts.map((alert) => (
              <div key={alert.id} className="quality-landing__alert">
                <div className="quality-landing__alert-header">
                  <span className="quality-landing__list-title">{alert.title}</span>
                  <span className={`quality-landing__badge quality-landing__badge--${alert.severity}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="quality-landing__list-meta">
                  <span>{alert.location}</span>
                </div>
                <p className="quality-landing__alert-action">{alert.action}</p>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="quality-landing__grid quality-landing__grid--wide">
        <Surface className="quality-landing__panel" padding="lg">
          <div className="quality-landing__panel-header">
            <h2 className="quality-landing__panel-title">Corrective actions</h2>
            <Button variant="ghost">Workflow</Button>
          </div>
          <div className="quality-landing__list">
            {correctiveActions.map((action) => (
              <div key={action.id} className="quality-landing__list-item">
                <div className="quality-landing__list-content">
                  <div className="quality-landing__list-title">{action.description}</div>
                  <p className="quality-landing__list-subtitle">{action.assignee}</p>
                  <div className="quality-landing__list-meta">
                    <span>{action.target}</span>
                  </div>
                </div>
                <span className={`quality-landing__tag quality-landing__tag--${action.status}`}>
                  {action.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="quality-landing__panel" padding="lg">
          <div className="quality-landing__panel-header">
            <h2 className="quality-landing__panel-title">Training compliance</h2>
            <Button variant="ghost">Assignments</Button>
          </div>
          <div className="quality-landing__list quality-landing__list--stacked">
            {trainingMatrix.map((cohort) => (
              <div key={cohort.id} className="quality-landing__cohort">
                <div className="quality-landing__cohort-header">
                  <span className="quality-landing__list-title">{cohort.cohort}</span>
                  <span className="quality-landing__cohort-value">{cohort.completion}%</span>
                </div>
                <div className="quality-landing__progress">
                  <div
                    className="quality-landing__progress-value"
                    style={{ width: `${cohort.completion}%` }}
                  />
                </div>
                <p className="quality-landing__cohort-note">{cohort.expiring}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="quality-landing__panel" padding="lg" variant="muted">
          <div className="quality-landing__panel-header">
            <h2 className="quality-landing__panel-title">Compliance insight</h2>
          </div>
          <p className="quality-landing__summary">
            Leading indicators highlight crane operations and heat stress as top risk drivers. Closing
            <strong>5 escalated actions</strong> by <strong>Friday</strong> returns the inspection pass rate to the 95% goal and
            keeps TRIR under the benchmark ahead of the state audit.
          </p>
          <ul className="quality-landing__bullets">
            <li>Deploy rapid-response crew for tower crane corrective actions.</li>
            <li>Roll out hydration monitoring via IoT wearables on high-temp shifts.</li>
            <li>Publish new QA photo standards to the compliance knowledge base.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
