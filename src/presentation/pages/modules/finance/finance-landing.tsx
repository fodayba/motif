import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './finance-landing.css'

const costMetrics = [
  {
    id: 'cpi',
    label: 'Portfolio CPI',
    value: '0.94',
    detail: 'Variance −$1.2M vs plan',
    tone: 'negative' as const,
  },
  {
    id: 'billing',
    label: 'Billing compliance',
    value: '96%',
    detail: '4 invoices pending approval',
    tone: 'warning' as const,
  },
  {
    id: 'retention',
    label: 'Retention balance',
    value: '$3.8M',
    detail: 'Release window opens 11/01',
    tone: 'neutral' as const,
  },
  {
    id: 'cashflow',
    label: 'Cash flow coverage',
    value: '1.3×',
    detail: 'Meets 90-day requirement',
    tone: 'positive' as const,
  },
]

const varianceLedger = [
  {
    id: 'VAR-104',
    project: 'Tower 3 · Downtown Skyline',
    amount: '-$420,000',
    driver: 'Curtain wall escalation',
    owner: 'Procurement',
    status: 'escalated' as const,
    statusLabel: 'Escalated',
  },
  {
    id: 'VAR-099',
    project: 'North Medical Center',
    amount: '-$180,000',
    driver: 'MEP rework labour',
    owner: 'Project Controls',
    status: 'mitigation' as const,
    statusLabel: 'Mitigation',
  },
  {
    id: 'VAR-092',
    project: 'Logistics Hub Expansion',
    amount: '+$130,000',
    driver: 'Concrete buyout savings',
    owner: 'Finance',
    status: 'favorable' as const,
    statusLabel: 'Favorable',
  },
]

const billingQueue = [
  {
    id: 'INV-7712',
    customer: 'City of Austin',
    value: '$220,400',
    status: 'pending-approval' as const,
    statusLabel: 'Awaiting approval',
    eta: 'Due in 2 days',
  },
  {
    id: 'INV-7706',
    customer: 'North Health System',
    value: '$145,800',
    status: 'invoiced' as const,
    statusLabel: 'Sent to client',
    eta: 'Terms Net 30',
  },
  {
    id: 'INV-7701',
    customer: 'Logistics Holdings',
    value: '$312,150',
    status: 'blocked' as const,
    statusLabel: 'Blocked',
    eta: 'Waiting cost sheet',
  },
]

const forecastPipelines = [
  {
    id: 'forecast-1',
    project: 'Tower 3 · Downtown Skyline',
    burnRate: '$640k / wk',
    runway: '7.2 months',
    note: 'Adjust for curtain wall escrow release.',
  },
  {
    id: 'forecast-2',
    project: 'North Medical Center',
    burnRate: '$410k / wk',
    runway: '5.8 months',
    note: 'Align with change orders pending approval.',
  },
  {
    id: 'forecast-3',
    project: 'Logistics Hub Expansion',
    burnRate: '$290k / wk',
    runway: '9.1 months',
    note: 'Invoices tracking to baseline.',
  },
]

const retentionSchedule = [
  {
    id: 'ret-1',
    project: 'Tower 3 · Downtown Skyline',
    hold: '$1,850,000',
    release: 'Release target 11/15',
    status: 'pending' as const,
    statusLabel: 'Pending',
  },
  {
    id: 'ret-2',
    project: 'North Medical Center',
    hold: '$940,000',
    release: 'Partial release 12/05',
    status: 'scheduled' as const,
    statusLabel: 'Scheduled',
  },
  {
    id: 'ret-3',
    project: 'Logistics Hub Expansion',
    hold: '$680,000',
    release: 'To be released post inspection',
    status: 'blocked' as const,
    statusLabel: 'Blocked',
  },
]

const cashPositionSeries = [8.4, 8.9, 8.6, 9.1, 9.3, 9.4, 9.6]
const varianceSeries = [-1.9, -1.6, -1.4, -1.5, -1.2, -1.1, -1.0]
const billingCompletion = 82

export const FinanceLanding = () => {
  return (
    <div className="module-scaffold finance-landing">
      <header className="module-scaffold__header">
        <div className="module-scaffold__title">
          <span className="module-scaffold__eyebrow">Financial Management</span>
          <h1 className="module-scaffold__heading">Cost control, billing, and cash flow assurance</h1>
          <p className="module-scaffold__summary">
            Monitor earned value, manage billing cycles, and orchestrate retention strategy. Cost controls,
            budget approvals, and accounting integrations from the Angular app will be re-established here.
          </p>
        </div>
        <div className="module-scaffold__actions">
          <Button>Create billing run</Button>
          <Button variant="secondary">Review budgets</Button>
        </div>
      </header>

      <section className="finance-landing__metrics">
        {costMetrics.map((metric) => (
          <Surface key={metric.id} className="finance-landing__metric" padding="lg">
            <span className="finance-landing__metric-label">{metric.label}</span>
            <span className="finance-landing__metric-value">{metric.value}</span>
            <span className={`finance-landing__metric-detail metric-detail--${metric.tone}`}>
              {metric.detail}
            </span>
          </Surface>
        ))}
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Cash position</div>
            <div className="module-metrics__card-value">$9.6M</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={3.6} suffix="%" label="vs. prior 6 weeks" positiveIsGood />
            </div>
            <Sparkline values={cashPositionSeries} ariaLabel="Cash position trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Cost variance</div>
            <div className="module-metrics__card-value">−$1.0M</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={0.4} suffix="M" label="variance recovery" />
            </div>
            <Sparkline
              values={varianceSeries}
              ariaLabel="Cost variance trend"
              variant="warning"
              areaOpacity={0.18}
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Billing timeliness</div>
            <RadialGauge
              value={billingCompletion}
              label="On-time"
              caption="Target 88%"
              tone="info"
              size={140}
            />
            <p className="finance-landing__summary">
              Executive approvals remain the primary blocker. Automating retention releases lifts the rate
              another <strong>4%</strong> based on scenario testing.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Margin outlook" meta="Rolling 90-day forecast">
              <p className="finance-landing__summary">
                Integrate committed spend feeds to unlock variance driven heatmaps. The historic margin
                overlay resurfaces once infrastructure connectors are live.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="finance-landing__grid">
        <Surface className="finance-landing__panel" padding="lg">
          <div className="finance-landing__panel-header">
            <h2 className="finance-landing__panel-title">Variance ledger</h2>
            <Button variant="ghost">Drill to project</Button>
          </div>
          <div className="finance-landing__list">
            {varianceLedger.map((variance) => (
              <div key={variance.id} className="finance-landing__list-item">
                <div className="finance-landing__list-content">
                  <div className="finance-landing__list-title">{variance.project}</div>
                  <p className="finance-landing__list-subtitle">{variance.driver}</p>
                  <div className="finance-landing__list-meta">
                    <span>{variance.amount}</span>
                    <span>Owner {variance.owner}</span>
                  </div>
                </div>
                <span className={`finance-landing__tag finance-landing__tag--${variance.status}`}>
                  {variance.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="finance-landing__panel" padding="lg">
          <div className="finance-landing__panel-header">
            <h2 className="finance-landing__panel-title">Billing queue</h2>
            <Button variant="ghost">Approvals</Button>
          </div>
          <div className="finance-landing__list">
            {billingQueue.map((invoice) => (
              <div key={invoice.id} className="finance-landing__list-item">
                <div className="finance-landing__list-content">
                  <div className="finance-landing__list-title">{invoice.id}</div>
                  <p className="finance-landing__list-subtitle">{invoice.customer}</p>
                  <div className="finance-landing__list-meta">
                    <span>{invoice.value}</span>
                    <span>{invoice.eta}</span>
                  </div>
                </div>
                <span className={`finance-landing__tag finance-landing__tag--${invoice.status}`}>
                  {invoice.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="finance-landing__grid finance-landing__grid--wide">
        <Surface className="finance-landing__panel" padding="lg">
          <div className="finance-landing__panel-header">
            <h2 className="finance-landing__panel-title">Forecast runway</h2>
            <Button variant="ghost">Scenario plan</Button>
          </div>
          <div className="finance-landing__list finance-landing__list--stacked">
            {forecastPipelines.map((forecast) => (
              <div key={forecast.id} className="finance-landing__forecast">
                <div className="finance-landing__forecast-header">
                  <span className="finance-landing__list-title">{forecast.project}</span>
                  <span className="finance-landing__forecast-burn">{forecast.burnRate}</span>
                </div>
                <span className="finance-landing__forecast-runway">Runway {forecast.runway}</span>
                <p className="finance-landing__forecast-note">{forecast.note}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="finance-landing__panel" padding="lg">
          <div className="finance-landing__panel-header">
            <h2 className="finance-landing__panel-title">Retention schedule</h2>
            <Button variant="ghost">Release planner</Button>
          </div>
          <div className="finance-landing__list">
            {retentionSchedule.map((retention) => (
              <div key={retention.id} className="finance-landing__list-item">
                <div className="finance-landing__list-content">
                  <div className="finance-landing__list-title">{retention.project}</div>
                  <p className="finance-landing__list-subtitle">Hold {retention.hold}</p>
                  <div className="finance-landing__list-meta">
                    <span>{retention.release}</span>
                  </div>
                </div>
                <span className={`finance-landing__tag finance-landing__tag--${retention.status}`}>
                  {retention.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="finance-landing__panel" padding="lg" variant="muted">
          <div className="finance-landing__panel-header">
            <h2 className="finance-landing__panel-title">Finance insight</h2>
          </div>
          <p className="finance-landing__summary">
            Forecast blend suggests <strong>$620k</strong> savings if curtain wall overruns are offset by procurement
            rebates before <strong>10/31</strong>. Align billing cadence with crane contingency drawdown to maintain positive
            cash coverage.
          </p>
          <ul className="finance-landing__bullets">
            <li>Release partial retention on Logistics Hub post-inspection sign-off.</li>
            <li>Reconcile Tower 3 cost codes before Friday’s executive finance review.</li>
            <li>Coordinate with procurement on steel escalation claim submission.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
