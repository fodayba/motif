import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './procurement-landing.css'

const sourcingMetrics = [
  {
    id: 'cycle-time',
    label: 'Average cycle time',
    value: '6.2 days',
    annotation: 'Goal: < 7 days',
    tone: 'positive' as const,
  },
  {
    id: 'savings',
    label: 'Negotiated savings',
    value: '$182k',
    annotation: 'Q3 to date · 8.7% of spend',
    tone: 'positive' as const,
  },
  {
    id: 'maverick',
    label: 'Maverick spend',
    value: '3.1%',
    annotation: '2 POs bypassed contract last week',
    tone: 'negative' as const,
  },
  {
    id: 'compliance',
    label: 'Compliance score',
    value: '94',
    annotation: 'Vendor onboarding SLA met 96%',
    tone: 'neutral' as const,
  },
]

const requisitionPipeline = [
  {
    id: 'REQ-2204',
    requester: 'Projects · Tower 3',
    value: '$48,900',
    needBy: 'Needed in 5 days',
    status: 'approvals' as const,
    statusLabel: 'Awaiting approvals',
  },
  {
    id: 'REQ-2201',
    requester: 'Field Ops · Site C',
    value: '$12,450',
    needBy: 'Need by Friday',
    status: 'sourcing' as const,
    statusLabel: 'In sourcing',
  },
  {
    id: 'REQ-2197',
    requester: 'MEP · Hospital North',
    value: '$86,300',
    needBy: 'Need by 10/22',
    status: 'risk' as const,
    statusLabel: 'Budget overrun',
  },
]

const purchaseOrderCycle = [
  {
    id: 'PO-5810',
    supplier: 'Steelcraft Manufacturing',
    amount: '$126,400',
    eta: 'Arriving 10/16',
    status: 'receiving' as const,
    statusLabel: 'Receiving',
  },
  {
    id: 'PO-5804',
    supplier: 'Metro Safety Gear',
    amount: '$22,750',
    eta: 'Awaiting GR',
    status: 'matching' as const,
    statusLabel: '3-way match',
  },
  {
    id: 'PO-5798',
    supplier: 'Concrete Supply Co.',
    amount: '$94,680',
    eta: 'Delayed – carrier hold',
    status: 'exception' as const,
    statusLabel: 'Exception',
  },
]

const vendorScorecard = [
  {
    id: 'vendor-1',
    name: 'Steelcraft Manufacturing',
    score: 92,
    leadTime: '3.1 days avg',
    notes: 'Quality issues resolved · expedited credit applied.',
  },
  {
    id: 'vendor-2',
    name: 'Metro Safety Gear',
    score: 88,
    leadTime: '4.6 days avg',
    notes: 'Consignment inventory unlocked for PPE kits.',
  },
  {
    id: 'vendor-3',
    name: 'Precision Electrical Supply',
    score: 81,
    leadTime: '5.4 days avg',
    notes: 'Renew contract — pricing review due 11/01.',
  },
]

const contractWatchlist = [
  {
    id: 'contract-1',
    title: 'Concrete admixture framework',
    owner: 'Procurement · Materials',
    renewal: 'Renews 12/15',
    action: 'Run market benchmark before 10/30.',
    status: 'warning' as const,
    statusLabel: 'Action needed',
  },
  {
    id: 'contract-2',
    title: 'Equipment rental master',
    owner: 'Procurement · Equipment',
    renewal: 'Renews 11/20',
    action: 'Align with fleet utilisation forecast.',
    status: 'info' as const,
    statusLabel: 'Monitor',
  },
  {
    id: 'contract-3',
    title: 'MEP prefabrication agreement',
    owner: 'Projects · Prefab',
    renewal: 'Renews 01/05',
    action: 'Initiate design change clause review.',
    status: 'success' as const,
    statusLabel: 'On track',
  },
]

const cycleTimeSeries = [7.8, 7.5, 7.1, 6.9, 6.6, 6.4, 6.2]
const savingsSeries = [86, 98, 112, 129, 146, 168, 182]
const complianceScore = 94
const supplierRiskMeta = {
  escalations: 3,
  renewals: 12,
}

export const ProcurementLanding = () => {
  return (
    <div className="module-scaffold procurement-landing">
      <header className="module-scaffold__header">
        <div className="module-scaffold__title">
          <span className="module-scaffold__eyebrow">Procurement</span>
          <h1 className="module-scaffold__heading">Supplier collaboration and PO governance</h1>
          <p className="module-scaffold__summary">
            Control requisition flow, three-way match compliance, and supplier performance in a single
            command centre. Bid tabs, contract orchestration, and vendor portals from the Angular app will
            resurface here.
          </p>
        </div>
        <div className="module-scaffold__actions">
          <Button>Create requisition</Button>
          <Button variant="secondary">Invite vendor</Button>
        </div>
      </header>

      <section className="procurement-landing__metrics">
        {sourcingMetrics.map((metric) => (
          <Surface key={metric.id} className="procurement-landing__metric" padding="lg">
            <span className="procurement-landing__metric-label">{metric.label}</span>
            <span className="procurement-landing__metric-value">{metric.value}</span>
            <span className={`procurement-landing__metric-annotation metric-detail--${metric.tone}`}>
              {metric.annotation}
            </span>
          </Surface>
        ))}
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Sourcing cycle time</div>
            <div className="module-metrics__card-value">6.2 days</div>
            <div className="module-metrics__card-meta">
              <TrendBadge
                delta={-0.4}
                suffix=" days"
                label="vs. last sprint"
                positiveIsGood={false}
              />
            </div>
            <Sparkline values={cycleTimeSeries} ariaLabel="Sourcing cycle time trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Negotiated savings</div>
            <div className="module-metrics__card-value">$182k</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={18} suffix="k" label="QoQ captured" />
            </div>
            <Sparkline values={savingsSeries} ariaLabel="Negotiated savings trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Compliance score</div>
            <RadialGauge value={complianceScore} label="Policy aligned" caption="Target ≥ 92" tone="success" />
            <p className="procurement-landing__metric-note">
              Playbook updates kept onboarding within SLA for five straight weeks; continue spot-audits on
              vendor insurance packets.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Supplier risk" meta="From risk register rebuild">
              <p className="procurement-landing__metric-note">
                {supplierRiskMeta.escalations} escalations open and {supplierRiskMeta.renewals} renewals
                pending. Supplier sentiment scoring returns once the analytics pipeline is rehydrated.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="procurement-landing__grid">
        <Surface className="procurement-landing__panel" padding="lg">
          <div className="procurement-landing__panel-header">
            <h2 className="procurement-landing__panel-title">Requisition pipeline</h2>
            <Button variant="ghost">Approval matrix</Button>
          </div>
          <div className="procurement-landing__list">
            {requisitionPipeline.map((req) => (
              <div key={req.id} className="procurement-landing__list-item">
                <div className="procurement-landing__list-content">
                  <div className="procurement-landing__list-title">{req.id}</div>
                  <p className="procurement-landing__list-subtitle">{req.requester}</p>
                  <div className="procurement-landing__list-meta">
                    <span>{req.value}</span>
                    <span>{req.needBy}</span>
                  </div>
                </div>
                <span className={`procurement-landing__tag procurement-landing__tag--${req.status}`}>
                  {req.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="procurement-landing__panel" padding="lg">
          <div className="procurement-landing__panel-header">
            <h2 className="procurement-landing__panel-title">PO lifecycle</h2>
            <Button variant="ghost">Exception queue</Button>
          </div>
          <div className="procurement-landing__list">
            {purchaseOrderCycle.map((po) => (
              <div key={po.id} className="procurement-landing__list-item">
                <div className="procurement-landing__list-content">
                  <div className="procurement-landing__list-title">{po.id}</div>
                  <p className="procurement-landing__list-subtitle">{po.supplier}</p>
                  <div className="procurement-landing__list-meta">
                    <span>{po.amount}</span>
                    <span>{po.eta}</span>
                  </div>
                </div>
                <span className={`procurement-landing__tag procurement-landing__tag--${po.status}`}>
                  {po.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="procurement-landing__grid procurement-landing__grid--wide">
        <Surface className="procurement-landing__panel" padding="lg">
          <div className="procurement-landing__panel-header">
            <h2 className="procurement-landing__panel-title">Top vendors</h2>
            <Button variant="ghost">Scorecard</Button>
          </div>
          <div className="procurement-landing__list">
            {vendorScorecard.map((vendor) => (
              <div key={vendor.id} className="procurement-landing__list-item procurement-landing__list-item--stacked">
                <div className="procurement-landing__list-content">
                  <div className="procurement-landing__list-title">{vendor.name}</div>
                  <p className="procurement-landing__list-subtitle">Score {vendor.score}</p>
                  <div className="procurement-landing__list-meta">
                    <span>{vendor.leadTime}</span>
                    <span>{vendor.notes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="procurement-landing__panel" padding="lg">
          <div className="procurement-landing__panel-header">
            <h2 className="procurement-landing__panel-title">Contract watchlist</h2>
            <Button variant="ghost">Renewal calendar</Button>
          </div>
          <div className="procurement-landing__list">
            {contractWatchlist.map((contract) => (
              <div key={contract.id} className="procurement-landing__list-item">
                <div className="procurement-landing__list-content">
                  <div className="procurement-landing__list-title">{contract.title}</div>
                  <p className="procurement-landing__list-subtitle">{contract.owner}</p>
                  <div className="procurement-landing__list-meta">
                    <span>{contract.renewal}</span>
                    <span>{contract.action}</span>
                  </div>
                </div>
                <span className={`procurement-landing__tag procurement-landing__tag--${contract.status}`}>
                  {contract.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="procurement-landing__panel" padding="lg" variant="muted">
          <div className="procurement-landing__panel-header">
            <h2 className="procurement-landing__panel-title">Spend intelligence</h2>
          </div>
          <p className="procurement-landing__summary">
            Category optimisation indicates a <strong>9%</strong> savings opportunity on structural steel if
            alternate suppliers are engaged before <strong>10/21</strong>. Bundling PPE and safety consumables in the
            regional contract avoids <strong>$24k</strong> in expedited freight this quarter.
          </p>
          <ul className="procurement-landing__bullets">
            <li>Launch sourcing event for Tower 3 curtain wall package this week.</li>
            <li>Audit contract compliance on rental POs exceeding 14-day durations.</li>
            <li>Enable vendor portal messaging for upcoming supplier summit.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
