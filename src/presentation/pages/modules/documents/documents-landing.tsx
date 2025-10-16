import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './documents-landing.css'

const documentMetrics = [
  {
    id: 'drawings',
    label: 'Active drawing sets',
    value: '38',
    detail: '6 pending revision approval',
    tone: 'warning' as const,
  },
  {
    id: 'rfi',
    label: 'Open RFIs',
    value: '24',
    detail: 'Avg turnaround 2.4 days',
    tone: 'neutral' as const,
  },
  {
    id: 'submittals',
    label: 'Submittal compliance',
    value: '91%',
    detail: 'Goal 95% · Needs action',
    tone: 'warning' as const,
  },
  {
    id: 'signoffs',
    label: 'Sign-offs this week',
    value: '17',
    detail: '2 overdue reviews',
    tone: 'negative' as const,
  },
]

const reviewVelocitySeries = [3.4, 3.2, 3.0, 2.8, 2.6, 2.5, 2.4]
const markupThroughputSeries = [38, 41, 44, 48, 52, 55, 59]
const complianceRate = 91
const kioskSyncMeta = {
  kiosks: 6,
  nightlySync: '23:00',
}

const workspaceTimeline = [
  {
    id: 'timeline-1',
    title: 'Revise structural drawings set S4.1',
    project: 'Tower 3 · Downtown Skyline',
    due: 'Due in 1 day',
    owner: 'Structural · L. Nguyen',
    status: 'at-risk' as const,
    statusLabel: 'At risk',
  },
  {
    id: 'timeline-2',
    title: 'Submittal review – HVAC equipment',
    project: 'North Medical Center',
    due: 'Scheduled tomorrow 10:00',
    owner: 'MEP · A. Wallace',
    status: 'scheduled' as const,
    statusLabel: 'Scheduled',
  },
  {
    id: 'timeline-3',
    title: 'Issue addendum 07 for logistics hub',
    project: 'Logistics Hub Expansion',
    due: 'Completed today',
    owner: 'Document Control · J. Rivera',
    status: 'completed' as const,
    statusLabel: 'Complete',
  },
]

const markupQueue = [
  {
    id: 'markup-1',
    name: 'Steel connection detail redlines',
    reviewers: ['Procurement', 'Structural'],
    updated: 'Updated 20 minutes ago',
    comments: '5 unresolved comments',
    status: 'in-review' as const,
    statusLabel: 'In review',
  },
  {
    id: 'markup-2',
    name: 'Fire stopping inspection photos',
    reviewers: ['QA', 'Safety'],
    updated: 'Updated 2 hours ago',
    comments: 'Needs new annotations',
    status: 'needs-update' as const,
    statusLabel: 'Needs update',
  },
  {
    id: 'markup-3',
    name: 'Owner change request log',
    reviewers: ['Finance', 'Project Controls'],
    updated: 'Updated yesterday',
    comments: 'Ready for sign-off',
    status: 'awaiting-signoff' as const,
    statusLabel: 'Awaiting sign-off',
  },
]

const distributionChannels = [
  {
    id: 'channel-1',
    title: 'Project team workspace',
    summary: 'Real-time collaboration with markups, tasks, and chat threads.',
    members: '128 members · 12 guests',
    status: 'active' as const,
    statusLabel: 'Active',
  },
  {
    id: 'channel-2',
    title: 'Owner document portal',
    summary: 'Curated deliverables, approvals, and audit-ready exports.',
    members: '18 stakeholders',
    status: 'curation' as const,
    statusLabel: 'Curation',
  },
  {
    id: 'channel-3',
    title: 'Field kiosk playlist',
    summary: 'Offline sync for crews · safety sheets and latest drawings.',
    members: '6 kiosks syncing',
    status: 'syncing' as const,
    statusLabel: 'Syncing',
  },
]

const governanceQueue = [
  {
    id: 'govern-1',
    item: 'RFI-287 · Curtain wall caulking detail',
    step: 'Needs architect response',
    sla: 'SLA breach in 8 hours',
    status: 'escalated' as const,
    statusLabel: 'Escalated',
  },
  {
    id: 'govern-2',
    item: 'Submittal-142 · Electrical switchgear',
    step: 'Pending GC approval',
    sla: 'Due in 2 days',
    status: 'pending' as const,
    statusLabel: 'Pending',
  },
  {
    id: 'govern-3',
    item: 'Addendum 07 distribution',
    step: 'Awaiting owner acknowledgement',
    sla: 'Due in 1 day',
    status: 'awaiting' as const,
    statusLabel: 'Awaiting',
  },
]

export const DocumentsLanding = () => {
  return (
    <div className="module-scaffold documents-landing">
      <header className="module-scaffold__header">
        <div className="module-scaffold__title">
          <span className="module-scaffold__eyebrow">Document Control</span>
          <h1 className="module-scaffold__heading">Collaboration, markups, and revision governance</h1>
          <p className="module-scaffold__summary">
            Drawing sets, RFIs, and submittals from the Angular client will be ported here with richer
            audit trails, collaborative markups, and version comparison workflows.
          </p>
        </div>
        <div className="module-scaffold__actions">
          <Button>Upload document</Button>
          <Button variant="secondary">Start review</Button>
        </div>
      </header>

      <section className="documents-landing__metrics">
        {documentMetrics.map((metric) => (
          <Surface key={metric.id} className="documents-landing__metric" padding="lg">
            <span className="documents-landing__metric-label">{metric.label}</span>
            <span className="documents-landing__metric-value">{metric.value}</span>
            <span
              className={`documents-landing__metric-detail documents-landing__metric-detail--${metric.tone}`}
            >
              {metric.detail}
            </span>
          </Surface>
        ))}
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Review turnaround</div>
            <div className="module-metrics__card-value">2.4 days</div>
            <div className="module-metrics__card-meta">
              <TrendBadge
                delta={-0.6}
                suffix=" days"
                label="vs. last month"
                positiveIsGood={false}
              />
            </div>
            <Sparkline
              values={reviewVelocitySeries}
              ariaLabel="Review turnaround trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Markup throughput</div>
            <div className="module-metrics__card-value">59 / week</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={7} label="extra packages" />
            </div>
            <Sparkline
              values={markupThroughputSeries}
              ariaLabel="Markup throughput trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Submittal compliance</div>
            <RadialGauge
              value={complianceRate}
              label="On-time packages"
              caption="Target ≥ 95%"
              tone="warning"
              size={140}
            />
            <p className="documents-landing__metric-note">
              Escalate the four overdue packages before weekly owner review to avoid slipping under the
              contractual KPI.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Field sync" meta="Offline kiosks">
              <p className="documents-landing__metric-note">
                {kioskSyncMeta.kiosks} kiosks sync nightly at {kioskSyncMeta.nightlySync}. The next upgrade
                adds delta downloads so markups arrive within five minutes of publish.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="documents-landing__grid">
        <Surface className="documents-landing__panel" padding="lg">
          <div className="documents-landing__panel-header">
            <h2 className="documents-landing__panel-title">Workspace activity</h2>
            <Button variant="ghost">Timeline</Button>
          </div>
          <div className="documents-landing__list">
            {workspaceTimeline.map((event) => (
              <div key={event.id} className="documents-landing__list-item">
                <div className="documents-landing__list-content">
                  <div className="documents-landing__list-title">{event.title}</div>
                  <p className="documents-landing__list-subtitle">{event.project}</p>
                  <div className="documents-landing__list-meta">
                    <span>{event.due}</span>
                    <span>{event.owner}</span>
                  </div>
                </div>
                <span className={`documents-landing__tag documents-landing__tag--${event.status}`}>
                  {event.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="documents-landing__panel" padding="lg">
          <div className="documents-landing__panel-header">
            <h2 className="documents-landing__panel-title">Markup queue</h2>
            <Button variant="ghost">Resolve</Button>
          </div>
          <div className="documents-landing__list documents-landing__list--stacked">
            {markupQueue.map((markup) => (
              <div key={markup.id} className="documents-landing__markup">
                <div className="documents-landing__markup-header">
                  <span className="documents-landing__list-title">{markup.name}</span>
                  <span className={`documents-landing__badge documents-landing__badge--${markup.status}`}>
                    {markup.statusLabel}
                  </span>
                </div>
                <div className="documents-landing__list-meta">
                  <span>{markup.reviewers.join(' · ')}</span>
                  <span>{markup.updated}</span>
                </div>
                <p className="documents-landing__markup-note">{markup.comments}</p>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="documents-landing__grid documents-landing__grid--wide">
        <Surface className="documents-landing__panel" padding="lg">
          <div className="documents-landing__panel-header">
            <h2 className="documents-landing__panel-title">Collaboration channels</h2>
            <Button variant="ghost">Manage access</Button>
          </div>
          <div className="documents-landing__list">
            {distributionChannels.map((channel) => (
              <div key={channel.id} className="documents-landing__list-item">
                <div className="documents-landing__list-content">
                  <div className="documents-landing__list-title">{channel.title}</div>
                  <p className="documents-landing__list-subtitle">{channel.summary}</p>
                  <div className="documents-landing__list-meta">
                    <span>{channel.members}</span>
                  </div>
                </div>
                <span className={`documents-landing__tag documents-landing__tag--${channel.status}`}>
                  {channel.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="documents-landing__panel" padding="lg">
          <div className="documents-landing__panel-header">
            <h2 className="documents-landing__panel-title">Governance queue</h2>
            <Button variant="ghost">Prioritise</Button>
          </div>
          <div className="documents-landing__list">
            {governanceQueue.map((item) => (
              <div key={item.id} className="documents-landing__list-item">
                <div className="documents-landing__list-content">
                  <div className="documents-landing__list-title">{item.item}</div>
                  <p className="documents-landing__list-subtitle">{item.step}</p>
                  <div className="documents-landing__list-meta">
                    <span>{item.sla}</span>
                  </div>
                </div>
                <span className={`documents-landing__tag documents-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="documents-landing__panel" padding="lg" variant="muted">
          <div className="documents-landing__panel-header">
            <h2 className="documents-landing__panel-title">Collaboration insight</h2>
          </div>
          <p className="documents-landing__summary">
            Sign-off velocity improves to <strong>2.1 days</strong> when markup queues close within 24 hours. Prioritise
            structural addendum approvals and sync field kiosks nightly to keep crews current.
          </p>
          <ul className="documents-landing__bullets">
            <li>Launch automated reminders for overdue RFIs and submittals.</li>
            <li>Centralise owner change logs with audit-ready exports.</li>
            <li>Enable side-by-side drawing compare for Tower 3 steel revisions.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
