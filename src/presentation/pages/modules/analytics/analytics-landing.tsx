import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './analytics-landing.css'

const analyticsMetrics = [
  {
    id: 'cva',
    label: 'Portfolio variance exposure',
    value: '$4.2M',
    detail: 'Down 12% week over week',
    tone: 'positive' as const,
  },
  {
    id: 'productivity',
    label: 'Field productivity index',
    value: '1.08×',
    detail: 'Beating baseline by 8%',
    tone: 'positive' as const,
  },
  {
    id: 'schedule-risk',
    label: 'Schedule risk flags',
    value: '14',
    detail: '5 high · 9 medium',
    tone: 'warning' as const,
  },
  {
    id: 'data-freshness',
    label: 'Data freshness',
    value: '94%',
    detail: '3 sources stale > 48h',
    tone: 'warning' as const,
  },
]

const varianceExposureSeries = [5.4, 5.1, 4.9, 4.7, 4.4, 4.3, 4.2]
const productivityIndexSeries = [1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08]
const freshnessSeries = [88, 89, 90, 92, 93, 94, 94]
const insightMeta = {
  autoRouted: 62,
}

const dashboardCatalog = [
  {
    id: 'dash-1',
    title: 'Executive KPI briefing',
    description: 'Blends earned value, cash coverage, and safety trendlines for weekly steering decks.',
    updated: 'Refreshed 1 hour ago',
    owner: 'Analytics · S. Patel',
    status: 'published' as const,
    statusLabel: 'Published',
  },
  {
    id: 'dash-2',
    title: 'Production throughput monitor',
    description: 'Tracks labour efficiency, crew utilisation, and backlog clearance velocity.',
    updated: 'Updated this morning',
    owner: 'Operations Analytics',
    status: 'draft' as const,
    statusLabel: 'Draft',
  },
  {
    id: 'dash-3',
    title: 'Commercial health overview',
    description: 'Combines billing forecasts, retention release timelines, and vendor performance.',
    updated: 'Pending data sync',
    owner: 'Finance Analytics',
    status: 'needs-data' as const,
    statusLabel: 'Needs data',
  },
]

const anomalyAlerts = [
  {
    id: 'anom-884',
    label: 'Cost anomaly · Tower 3 steel package',
    severity: 'critical' as const,
    triggered: 'Detected 12 minutes ago',
    action: 'Review vendor invoice batch before approval.',
  },
  {
    id: 'anom-879',
    label: 'Productivity dip · Electrical crews',
    severity: 'high' as const,
    triggered: 'Detected 2 hours ago',
    action: 'Correlate with overtime levels and weather disruptions.',
  },
  {
    id: 'anom-872',
    label: 'Safety observation spike',
    severity: 'medium' as const,
    triggered: 'Detected yesterday',
    action: 'Surface to site safety leads and schedule stand-down.',
  },
]

const forecastPipelines = [
  {
    id: 'forecast-cost',
    title: 'Cost forecast scenario',
    baseline: 'Baseline CPI 0.94',
    projection: 'Recovery path hits 1.02 by Q2',
    nextStep: 'Enable incentive-based mitigation program.',
  },
  {
    id: 'forecast-schedule',
    title: 'Schedule risk outlook',
    baseline: 'SPI 0.97',
    projection: 'Risk-adjusted delivery Apr 18 ± 4d',
    nextStep: 'Model crew levelling for electrical trades.',
  },
  {
    id: 'forecast-safety',
    title: 'Leading indicator pulse',
    baseline: 'TRIR 1.3',
    projection: 'Hold under 1.4 if heat program deploys',
    nextStep: 'Validate hydration compliance telemetry feed.',
  },
]

const reportSchedule = [
  {
    id: 'report-1',
    name: 'Executive Monday briefing',
    cadence: 'Weekly · Mondays 07:00',
    distribution: 'Email + Teams broadcast',
    status: 'active' as const,
    statusLabel: 'Active',
  },
  {
    id: 'report-2',
    name: 'Owner rep cost digest',
    cadence: 'Bi-weekly · Wednesdays',
    distribution: 'Secure link',
    status: 'pending' as const,
    statusLabel: 'Pending data',
  },
  {
    id: 'report-3',
    name: 'Safety lead anomaly feed',
    cadence: 'Daily · 06:30',
    distribution: 'SMS + in-app alert',
    status: 'paused' as const,
    statusLabel: 'Paused',
  },
]

export const AnalyticsLanding = () => {
  return (
    <div className="module-scaffold analytics-landing">
      <header className="module-scaffold__header">
        <div className="module-scaffold__title">
          <span className="module-scaffold__eyebrow">Analytics</span>
          <h1 className="module-scaffold__heading">Operational intelligence and KPI dashboards</h1>
          <p className="module-scaffold__summary">
            Predictive models, benchmarking, and anomaly detection converge here. Angular dashboard
            canvases, scheduler, and executive briefing exports will be re-established with more interactive
            drill-through and alerting capabilities.
          </p>
        </div>
        <div className="module-scaffold__actions">
          <Button>Build dashboard</Button>
          <Button variant="secondary">Schedule report</Button>
        </div>
      </header>

      <section className="analytics-landing__metrics">
        {analyticsMetrics.map((metric) => (
          <Surface key={metric.id} className="analytics-landing__metric" padding="lg">
            <span className="analytics-landing__metric-label">{metric.label}</span>
            <span className="analytics-landing__metric-value">{metric.value}</span>
            <span
              className={`analytics-landing__metric-detail analytics-landing__metric-detail--${metric.tone}`}
            >
              {metric.detail}
            </span>
          </Surface>
        ))}
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Variance exposure</div>
            <div className="module-metrics__card-value">$4.2M</div>
            <div className="module-metrics__card-meta">
              <TrendBadge
                delta={-0.6}
                suffix="M"
                label="vs. last sprint"
                positiveIsGood={false}
              />
            </div>
            <Sparkline
              values={varianceExposureSeries}
              ariaLabel="Variance exposure trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Productivity index</div>
            <div className="module-metrics__card-value">1.08×</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={0.04} label="QoQ lift" />
            </div>
            <Sparkline
              values={productivityIndexSeries}
              ariaLabel="Productivity index trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Data freshness</div>
            <RadialGauge
              value={freshnessSeries[freshnessSeries.length - 1]}
              label="Sources in SLA"
              caption="Target ≥ 96%"
              tone="warning"
              size={140}
            />
            <p className="analytics-landing__metric-note">
              {freshnessSeries.filter((value) => value < 95).length} feeds remain stale longer than 48
              hours. Ignite the backfill process to reach parity before Monday's briefing.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Signal automation" meta="Gen-2 anomaly engine">
              <p className="analytics-landing__metric-note">
                Auto-routing covers {insightMeta.autoRouted}% of anomaly escalations. The next release
                unlocks proactive Slack digests once the risk taxonomy migration completes.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="analytics-landing__grid">
        <Surface className="analytics-landing__panel" padding="lg">
          <div className="analytics-landing__panel-header">
            <h2 className="analytics-landing__panel-title">Dashboard catalogue</h2>
            <Button variant="ghost">Manage</Button>
          </div>
          <div className="analytics-landing__list">
            {dashboardCatalog.map((dashboard) => (
              <div key={dashboard.id} className="analytics-landing__list-item">
                <div className="analytics-landing__list-content">
                  <div className="analytics-landing__list-title">{dashboard.title}</div>
                  <p className="analytics-landing__list-subtitle">{dashboard.description}</p>
                  <div className="analytics-landing__list-meta">
                    <span>{dashboard.updated}</span>
                    <span>{dashboard.owner}</span>
                  </div>
                </div>
                <span className={`analytics-landing__tag analytics-landing__tag--${dashboard.status}`}>
                  {dashboard.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="analytics-landing__panel" padding="lg">
          <div className="analytics-landing__panel-header">
            <h2 className="analytics-landing__panel-title">Anomaly watchlist</h2>
            <Button variant="ghost">Rules</Button>
          </div>
          <div className="analytics-landing__list analytics-landing__list--stacked">
            {anomalyAlerts.map((alert) => (
              <div key={alert.id} className="analytics-landing__alert">
                <div className="analytics-landing__alert-header">
                  <span className="analytics-landing__list-title">{alert.label}</span>
                  <span className={`analytics-landing__badge analytics-landing__badge--${alert.severity}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="analytics-landing__list-meta">
                  <span>{alert.triggered}</span>
                </div>
                <p className="analytics-landing__alert-action">{alert.action}</p>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="analytics-landing__grid analytics-landing__grid--wide">
        <Surface className="analytics-landing__panel" padding="lg">
          <div className="analytics-landing__panel-header">
            <h2 className="analytics-landing__panel-title">Forecast scenarios</h2>
            <Button variant="ghost">Simulate</Button>
          </div>
          <div className="analytics-landing__list analytics-landing__list--stacked">
            {forecastPipelines.map((forecast) => (
              <div key={forecast.id} className="analytics-landing__forecast">
                <div className="analytics-landing__forecast-header">
                  <span className="analytics-landing__list-title">{forecast.title}</span>
                  <span className="analytics-landing__forecast-baseline">{forecast.baseline}</span>
                </div>
                <span className="analytics-landing__forecast-projection">{forecast.projection}</span>
                <p className="analytics-landing__forecast-note">{forecast.nextStep}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="analytics-landing__panel" padding="lg">
          <div className="analytics-landing__panel-header">
            <h2 className="analytics-landing__panel-title">Report automation</h2>
            <Button variant="ghost">Configure</Button>
          </div>
          <div className="analytics-landing__list">
            {reportSchedule.map((report) => (
              <div key={report.id} className="analytics-landing__list-item">
                <div className="analytics-landing__list-content">
                  <div className="analytics-landing__list-title">{report.name}</div>
                  <p className="analytics-landing__list-subtitle">{report.cadence}</p>
                  <div className="analytics-landing__list-meta">
                    <span>{report.distribution}</span>
                  </div>
                </div>
                <span className={`analytics-landing__tag analytics-landing__tag--${report.status}`}>
                  {report.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="analytics-landing__panel" padding="lg" variant="muted">
          <div className="analytics-landing__panel-header">
            <h2 className="analytics-landing__panel-title">Insights briefing</h2>
          </div>
          <p className="analytics-landing__summary">
            Portfolio analytics indicate <strong>$1.1M</strong> in recoverable variance if Tower 3 procurement
            anomalies close before <strong>Month-end</strong>. Schedule risk concentration on electrical crews triggers a
            levelling recommendation, while data freshness gaps need remediation to maintain trustworthy
            dashboards.
          </p>
          <ul className="analytics-landing__bullets">
            <li>Lock anomaly response playbook before auto-routing escalations.</li>
            <li>Backfill stale IoT telemetry feeds for real-time productivity metrics.</li>
            <li>Draft exec briefing template for Monday distribution with new benchmarks.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
