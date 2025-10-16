import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './projects-landing.css'

const portfolioMetrics = [
  {
    id: 'evm',
    label: 'Portfolio SPI',
    value: '0.97',
    detail: 'Target ≥ 0.95 · improving 0.02 WoW',
    tone: 'positive' as const,
  },
  {
    id: 'cpi',
    label: 'Portfolio CPI',
    value: '0.94',
    detail: 'Cost variance −$1.2M vs plan',
    tone: 'negative' as const,
  },
  {
    id: 'milestones',
    label: 'Milestones on track',
    value: '42 / 50',
    detail: '6 at risk · 2 escalated',
    tone: 'warning' as const,
  },
  {
    id: 'conflicts',
    label: 'Resource conflicts',
    value: '11 crews',
    detail: 'Focus on electrical & concrete trades',
    tone: 'negative' as const,
  },
]

const milestoneHeat = [
  {
    id: 'tower-3',
    project: 'Tower 3 · Downtown Skyline',
    milestone: 'Podium concrete pour',
    due: 'Due in 5 days',
    risk: 'Weather contingency pending',
    status: 'warning' as const,
    statusLabel: 'Watch',
  },
  {
    id: 'hospital',
    project: 'North Medical Center',
    milestone: 'MEP rough-in complete',
    due: 'Due in 9 days',
    risk: 'Subcontractor manpower shortage',
    status: 'risk' as const,
    statusLabel: 'At risk',
  },
  {
    id: 'logistics',
    project: 'Logistics Hub Expansion',
    milestone: 'Steel erection phase 2',
    due: 'Due in 2 days',
    risk: 'Critical path stable',
    status: 'healthy' as const,
    statusLabel: 'Healthy',
  },
]

const resourceUtilization = [
  {
    id: 'electrical',
    trade: 'Electrical crew A',
    utilization: 96,
    note: 'Schedule compression · consider overtime cap',
  },
  {
    id: 'concrete',
    trade: 'Concrete crew B',
    utilization: 91,
    note: 'Allocate Tower 3 pour relief crew',
  },
  {
    id: 'finish',
    trade: 'Interior finish team',
    utilization: 68,
    note: 'Available for Hospital North swing shift',
  },
]

const riskRegister = [
  {
    id: 'risk-1',
    title: 'Curtain wall delivery delays',
    owner: 'Procurement · Facade',
    impact: 'Schedule slip 12 days',
    nextStep: 'Vendor escalation call 10/15',
    status: 'escalated' as const,
    statusLabel: 'Escalated',
  },
  {
    id: 'risk-2',
    title: 'Crane outage contingency',
    owner: 'Site Ops · Tower 3',
    impact: 'Daily cost $18k',
    nextStep: 'Secure backup crane rental',
    status: 'mitigation' as const,
    statusLabel: 'Mitigation',
  },
  {
    id: 'risk-3',
    title: 'Permit approval backlog',
    owner: 'Project Controls',
    impact: 'Potential inspection delay',
    nextStep: 'City review meeting 10/16',
    status: 'monitor' as const,
    statusLabel: 'Monitor',
  },
]

const inspectionLog = [
  {
    id: 'insp-1',
    type: 'Safety walkthrough',
    project: 'North Medical Center',
    scheduled: 'Today 14:00',
    status: 'scheduled' as const,
    statusLabel: 'Scheduled',
  },
  {
    id: 'insp-2',
    type: 'Quality punch list',
    project: 'Tower 3 · Floors 12-14',
    scheduled: 'Completed yesterday',
    status: 'completed' as const,
    statusLabel: 'Complete',
  },
  {
    id: 'insp-3',
    type: 'Environmental audit',
    project: 'Logistics Hub Expansion',
    scheduled: 'Due 10/20',
    status: 'upcoming' as const,
    statusLabel: 'Upcoming',
  },
]

const schedulePerformanceSeries = [0.93, 0.94, 0.95, 0.96, 0.97, 0.97, 0.98]
const costPerformanceSeries = [0.9, 0.91, 0.92, 0.92, 0.93, 0.94, 0.94]
const milestoneHealth = 84
const forecastMeta = {
  burnRateDelta: -4.6,
}

export const ProjectsLanding = () => {
  return (
    <div className="module-scaffold projects-landing">
      <header className="module-scaffold__header">
        <div className="module-scaffold__title">
          <span className="module-scaffold__eyebrow">Project Delivery</span>
          <h1 className="module-scaffold__heading">Portfolio coordination and earned value insights</h1>
          <p className="module-scaffold__summary">
            Track milestone health, resource conflicts, and risk posture across every active project. Phase
            budgeting, stage-gate workflows, and the Angular project wizard will be rebuilt here alongside
            EVM analytics.
          </p>
        </div>
        <div className="module-scaffold__actions">
          <Button>Launch project wizard</Button>
          <Button variant="secondary">View schedules</Button>
        </div>
      </header>

      <section className="projects-landing__metrics">
        {portfolioMetrics.map((metric) => (
          <Surface key={metric.id} className="projects-landing__metric" padding="lg">
            <span className="projects-landing__metric-label">{metric.label}</span>
            <span className="projects-landing__metric-value">{metric.value}</span>
            <span className={`projects-landing__metric-detail metric-detail--${metric.tone}`}>
              {metric.detail}
            </span>
          </Surface>
        ))}
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Schedule performance</div>
            <div className="module-metrics__card-value">0.98 SPI</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={0.03} label="WoW change" />
            </div>
            <Sparkline values={schedulePerformanceSeries} ariaLabel="Schedule performance trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Cost performance</div>
            <div className="module-metrics__card-value">0.94 CPI</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={0.02} label="Variance recovery" />
            </div>
            <Sparkline values={costPerformanceSeries} ariaLabel="Cost performance trend" variant="warning" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Milestone health</div>
            <RadialGauge
              value={milestoneHealth}
              label="On track"
              caption="Target ≥ 88%"
              tone="warning"
              size={140}
            />
            <p className="projects-landing__metric-note">
              Escalations on curtain wall and crane contingency keep the portfolio slightly below the
              88% goal—lock mitigation this week to regain buffer.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Program burn-down" meta="Linking to Primavera feeds">
              <p className="projects-landing__metric-note">
                Burn rate improved {forecastMeta.burnRateDelta}% after sequencing crews across Tower 3 and
                the hospital project. Full burn-down visual returns with the scheduling API refresh.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="projects-landing__grid">
        <Surface className="projects-landing__panel" padding="lg">
          <div className="projects-landing__panel-header">
            <h2 className="projects-landing__panel-title">Milestone radar</h2>
            <Button variant="ghost">Critical path</Button>
          </div>
          <div className="projects-landing__list">
            {milestoneHeat.map((item) => (
              <div key={item.id} className="projects-landing__list-item">
                <div className="projects-landing__list-content">
                  <div className="projects-landing__list-title">{item.project}</div>
                  <p className="projects-landing__list-subtitle">{item.milestone}</p>
                  <div className="projects-landing__list-meta">
                    <span>{item.due}</span>
                    <span>{item.risk}</span>
                  </div>
                </div>
                <span className={`projects-landing__tag projects-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="projects-landing__panel" padding="lg">
          <div className="projects-landing__panel-header">
            <h2 className="projects-landing__panel-title">Resource outlook</h2>
            <Button variant="ghost">Levelling</Button>
          </div>
          <div className="projects-landing__list projects-landing__list--stacked">
            {resourceUtilization.map((resource) => (
              <div key={resource.id} className="projects-landing__resource">
                <div className="projects-landing__resource-header">
                  <span className="projects-landing__list-title">{resource.trade}</span>
                  <span className="projects-landing__resource-value">{resource.utilization}%</span>
                </div>
                <div className="projects-landing__progress">
                  <div
                    className="projects-landing__progress-value"
                    style={{ width: `${resource.utilization}%` }}
                  />
                </div>
                <p className="projects-landing__resource-note">{resource.note}</p>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="projects-landing__grid projects-landing__grid--wide">
        <Surface className="projects-landing__panel" padding="lg">
          <div className="projects-landing__panel-header">
            <h2 className="projects-landing__panel-title">Risk register</h2>
            <Button variant="ghost">Escalations</Button>
          </div>
          <div className="projects-landing__list">
            {riskRegister.map((risk) => (
              <div key={risk.id} className="projects-landing__list-item">
                <div className="projects-landing__list-content">
                  <div className="projects-landing__list-title">{risk.title}</div>
                  <p className="projects-landing__list-subtitle">Owner: {risk.owner}</p>
                  <div className="projects-landing__list-meta">
                    <span>{risk.impact}</span>
                    <span>{risk.nextStep}</span>
                  </div>
                </div>
                <span className={`projects-landing__tag projects-landing__tag--${risk.status}`}>
                  {risk.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="projects-landing__panel" padding="lg">
          <div className="projects-landing__panel-header">
            <h2 className="projects-landing__panel-title">Inspection cadence</h2>
            <Button variant="ghost">Scheduling</Button>
          </div>
          <div className="projects-landing__list">
            {inspectionLog.map((inspection) => (
              <div key={inspection.id} className="projects-landing__list-item">
                <div className="projects-landing__list-content">
                  <div className="projects-landing__list-title">{inspection.type}</div>
                  <p className="projects-landing__list-subtitle">{inspection.project}</p>
                  <div className="projects-landing__list-meta">
                    <span>{inspection.scheduled}</span>
                  </div>
                </div>
                <span className={`projects-landing__tag projects-landing__tag--${inspection.status}`}>
                  {inspection.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="projects-landing__panel" padding="lg" variant="muted">
          <div className="projects-landing__panel-header">
            <h2 className="projects-landing__panel-title">Program insight</h2>
          </div>
          <p className="projects-landing__summary">
            Earned value projections show <strong>$540k</strong> of recoverable variance if mitigation plans lock
            by <strong>Friday 12:00</strong>. Prioritise crane contingency and curtain wall negotiations to protect the
            tower delivery milestone.
          </p>
          <ul className="projects-landing__bullets">
            <li>Run what-if schedule for electrical crews across Tower 3 and Hospital North.</li>
            <li>Confirm weather contingency budget approval by executive steering committee.</li>
            <li>Prep stage-gate review assets for Logistics Hub phase 2.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
