import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './inventory-landing.css'

const coverageMetrics = [
  {
    id: 'coverage',
    label: 'Average coverage',
    value: '41 days',
    detail: '+6 day buffer vs target',
    tone: 'positive' as const,
  },
  {
    id: 'stockouts',
    label: 'Open stockouts',
    value: '3 SKUs',
    detail: 'High-risk: epoxy resin, rebar #6, PPE kits',
    tone: 'negative' as const,
  },
  {
    id: 'turns',
    label: 'Inventory turns (FYTD)',
    value: '7.8×',
    detail: 'Up 0.6× vs last quarter',
    tone: 'positive' as const,
  },
  {
    id: 'inbound',
    label: 'Inbound shipments',
    value: '24 loads',
    detail: '18 on-time · 6 monitored',
    tone: 'neutral' as const,
  },
]

const transferQueue = [
  {
    id: 'TR-1942',
    from: 'Dallas Central Yard',
    to: 'Austin Site B',
    items: 540,
    eta: 'Arrives in 4h',
    status: 'in-transit' as const,
    statusLabel: 'In transit',
  },
  {
    id: 'TR-1941',
    from: 'Houston Industrial Park',
    to: 'Dallas Central Yard',
    items: 320,
    eta: 'Loading dock 3',
    status: 'loading' as const,
    statusLabel: 'Loading',
  },
  {
    id: 'TR-1937',
    from: 'Austin Logistics Hub',
    to: 'Site C (Downtown)',
    items: 210,
    eta: 'Delayed · weather hold',
    status: 'delayed' as const,
    statusLabel: 'Delayed',
  },
]

const reorderAlerts = [
  {
    id: 'SKU-4411',
    sku: 'Steel studs · 20ga',
    location: 'Austin Site B',
    coverage: '12 days',
    recommendation: 'Rush supplier PO · maintain 98% service level',
  },
  {
    id: 'SKU-3290',
    sku: 'Concrete admixture A2',
    location: 'Dallas Central Yard',
    coverage: '9 days',
    recommendation: 'Auto-create PO · lot expiry 11/14',
  },
  {
    id: 'SKU-1204',
    sku: 'PPE kits · Safety v5',
    location: 'Houston Industrial Park',
    coverage: '6 days',
    recommendation: 'Trigger vendor consignment drawdown',
  },
]

const serviceLevelSeries = [95.2, 95.8, 96.1, 96.8, 97.1, 97.4, 97.6]
const coverageSeries = [38, 39, 40, 41, 42, 41, 41]
const transferReliability = 76

const inventoryHeatmap = [
  {
    id: 'dallas',
    region: 'Dallas Metro',
    turns: 8.4,
    replenishment: 'Green · 2 days ahead',
    slowMovers: 4,
    notes: 'Rebar coils accumulating in zone D',
  },
  {
    id: 'austin',
    region: 'Austin Corridor',
    turns: 6.9,
    replenishment: 'Amber · align with weekly pour schedule',
    slowMovers: 7,
    notes: 'Electrical conduit oversupply · coordinate with procurement',
  },
  {
    id: 'houston',
    region: 'Houston Coastal',
    turns: 5.8,
    replenishment: 'Green · balanced',
    slowMovers: 2,
    notes: 'Anchor bolts trending higher usage post storm repairs',
  },
]

const receivingBacklog = [
  {
    id: 'RCV-8821',
    supplier: 'Concrete Supply Co.',
    dock: 'Dock 1',
    eta: '08:45',
    items: 4,
    status: 'scheduled' as const,
    statusLabel: 'Scheduled',
  },
  {
    id: 'RCV-8820',
    supplier: 'Steelcraft Manufacturing',
    dock: 'Dock 2',
    eta: 'Waiting',
    items: 12,
    status: 'arrived' as const,
    statusLabel: 'Arrived',
  },
  {
    id: 'RCV-8817',
    supplier: 'Metro Safety Gear',
    dock: 'Dock 4',
    eta: 'Deferred to 14:30',
    items: 6,
    status: 'delayed' as const,
    statusLabel: 'Delayed',
  },
]

export const InventoryLanding = () => {
  return (
    <div className="module-scaffold inventory-landing">
      <header className="module-scaffold__header">
        <div className="module-scaffold__title">
          <span className="module-scaffold__eyebrow">Inventory Control</span>
          <h1 className="module-scaffold__heading">Material visibility and transfer orchestration</h1>
          <p className="module-scaffold__summary">
            Synchronise jobsite demand with central stock through proactive transfers, reorder alerts, and
            receiving discipline. Advanced forecasting and slotting logic from the Angular client will be
            rebuilt here.
          </p>
        </div>
        <div className="module-scaffold__actions">
          <Button>New transfer</Button>
          <Button variant="secondary">Update stock</Button>
        </div>
      </header>

      <section className="inventory-landing__metrics">
        {coverageMetrics.map((metric) => (
          <Surface key={metric.id} className="inventory-landing__metric" padding="lg">
            <span className="inventory-landing__metric-label">{metric.label}</span>
            <span className="inventory-landing__metric-value">{metric.value}</span>
            <span className={`inventory-landing__metric-detail metric-detail--${metric.tone}`}>
              {metric.detail}
            </span>
          </Surface>
        ))}
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Service level</div>
            <div className="module-metrics__card-value">97.6%</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={1.2} suffix="%" label="vs. last cycle" />
            </div>
            <Sparkline
              values={serviceLevelSeries}
              ariaLabel="Service level trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Average coverage</div>
            <div className="module-metrics__card-value">41 days</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={0.8} suffix=" days" label="buffer change" />
            </div>
            <Sparkline values={coverageSeries} ariaLabel="Coverage days trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Transfer reliability</div>
            <RadialGauge
              value={transferReliability}
              label="On-time"
              caption="Target 84%"
              tone="warning"
              size={140}
            />
            <p className="inventory-landing__region-notes">
              Weather delays across the Austin corridor hold <strong>3 loads</strong>. Crew reassignment and
              dynamic dock booking are queued for the next release.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Slotting optimisation" meta="Coming from IoT feeds">
              <p className="inventory-landing__region-notes">
                Reintroduce heatmaps once live telemetry returns. The placeholder reflects where the pick
                path density chart reappears after the Firebase sync refactor.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="inventory-landing__grid">
        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Transfer board</h2>
            <Button variant="ghost">Open planner</Button>
          </div>
          <div className="inventory-landing__list">
            {transferQueue.map((transfer) => (
              <div key={transfer.id} className="inventory-landing__list-item">
                <div className="inventory-landing__list-content">
                  <div className="inventory-landing__list-title">{transfer.id}</div>
                  <p className="inventory-landing__list-subtitle">
                    {transfer.from} → {transfer.to}
                  </p>
                  <div className="inventory-landing__list-meta">
                    <span>{transfer.items} line items</span>
                    <span>{transfer.eta}</span>
                  </div>
                </div>
                <span className={`inventory-landing__tag inventory-landing__tag--${transfer.status}`}>
                  {transfer.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Reorder alerts</h2>
            <Button variant="ghost">Review MRP</Button>
          </div>
          <div className="inventory-landing__list">
            {reorderAlerts.map((alert) => (
              <div key={alert.id} className="inventory-landing__list-item inventory-landing__list-item--stacked">
                <div className="inventory-landing__list-content">
                  <div className="inventory-landing__list-title">{alert.sku}</div>
                  <p className="inventory-landing__list-subtitle">{alert.location}</p>
                  <div className="inventory-landing__list-meta">
                    <span>Coverage {alert.coverage}</span>
                    <span>{alert.recommendation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="inventory-landing__grid inventory-landing__grid--wide">
        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Network performance</h2>
            <Button variant="ghost">Slotting rules</Button>
          </div>
          <div className="inventory-landing__list">
            {inventoryHeatmap.map((region) => (
              <div key={region.id} className="inventory-landing__region">
                <div className="inventory-landing__region-header">
                  <div className="inventory-landing__list-title">{region.region}</div>
                  <span className="inventory-landing__region-turns">{region.turns}× turns</span>
                </div>
                <div className="inventory-landing__list-meta">
                  <span>{region.replenishment}</span>
                  <span>{region.slowMovers} slow-movers</span>
                </div>
                <p className="inventory-landing__region-notes">{region.notes}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Receiving backlog</h2>
            <Button variant="ghost">Assign crews</Button>
          </div>
          <div className="inventory-landing__list">
            {receivingBacklog.map((load) => (
              <div key={load.id} className="inventory-landing__list-item">
                <div className="inventory-landing__list-content">
                  <div className="inventory-landing__list-title">{load.supplier}</div>
                  <p className="inventory-landing__list-subtitle">{load.dock}</p>
                  <div className="inventory-landing__list-meta">
                    <span>{load.items} pallets</span>
                    <span>{load.eta}</span>
                  </div>
                </div>
                <span className={`inventory-landing__tag inventory-landing__tag--${load.status}`}>
                  {load.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="inventory-landing__panel" padding="lg" variant="muted">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Forecast insight</h2>
          </div>
          <p className="inventory-landing__summary">
            Demand models anticipate a <strong>14%</strong> surge in structural steel over the next 21 days
            driven by tower crane sequencing. Balancing transfers now avoids <strong>$68k</strong>
            expediting spend and keeps service levels above <strong>97%</strong>.
          </p>
          <ul className="inventory-landing__bullets">
            <li>Coordinate cross-dock waves to cover Austin pour schedule on 10/22.</li>
            <li>Release vendor managed inventory for PPE kits before the weekend.</li>
            <li>Apply slow-mover markdown to conduit SKUs in Dallas zone D.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
