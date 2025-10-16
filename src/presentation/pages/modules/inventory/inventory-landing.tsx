import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  ArrowLeftRight, 
  ClipboardList, 
  ShoppingBag, 
  Package,
  Layers
} from 'lucide-react'
import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './inventory-landing.css'

const summaryMetrics = [
  {
    id: 'turnover',
    label: 'Inventory turnover',
    value: '6.2x',
    trend: '+0.8x vs last quarter',
    tone: 'positive' as const,
  },
  {
    id: 'stockout',
    label: 'Stockout rate',
    value: '2.1%',
    trend: '-0.6% improvement',
    tone: 'positive' as const,
  },
  {
    id: 'accuracy',
    label: 'Count accuracy',
    value: '98.3%',
    trend: 'Target ≥ 95%',
    tone: 'positive' as const,
  },
  {
    id: 'obsolete',
    label: 'Obsolete inventory',
    value: '$87k',
    trend: '3.2% of total value',
    tone: 'neutral' as const,
  },
]

const turnoverSeries = [5.2, 5.4, 5.7, 5.9, 6.0, 6.1, 6.2]
const stockoutSeries = [3.8, 3.5, 3.2, 2.9, 2.6, 2.3, 2.1]
const fillRate = 97.9
const abcMeta = {
  aCount: 124,
  bCount: 312,
  cCount: 1580,
}

const reorderAlerts = [
  {
    id: 'ITM-2847',
    item: 'Structural steel beam (W14x90)',
    current: 8,
    reorder: 25,
    recommended: 120,
    status: 'critical' as const,
    statusLabel: 'Critical',
    supplier: 'Allied Steel Supply',
  },
  {
    id: 'ITM-1923',
    item: 'Concrete rebar (#5, Grade 60)',
    current: 240,
    reorder: 500,
    recommended: 850,
    status: 'warning' as const,
    statusLabel: 'Low stock',
    supplier: 'Metro Building Materials',
  },
  {
    id: 'ITM-3412',
    item: 'HVAC ductwork (galvanized)',
    current: 12,
    reorder: 30,
    recommended: 60,
    status: 'warning' as const,
    statusLabel: 'Low stock',
    supplier: 'Climate Systems Inc',
  },
  {
    id: 'ITM-0891',
    item: 'Electrical conduit (EMT, 2")',
    current: 82,
    reorder: 150,
    recommended: 200,
    status: 'neutral' as const,
    statusLabel: 'Monitor',
    supplier: 'Electrical Wholesale',
  },
]

const warehouseSnapshots = [
  {
    id: 'central',
    warehouse: 'Central Distribution',
    skus: 847,
    value: '$2.4M',
    utilization: 78,
    trend: '+3% vs last month',
  },
  {
    id: 'north',
    warehouse: 'North Site Yard',
    skus: 412,
    value: '$890K',
    utilization: 92,
    trend: 'Near capacity',
  },
  {
    id: 'south',
    warehouse: 'South Staging Area',
    skus: 268,
    value: '$520K',
    utilization: 64,
    trend: '+8% pending transfers',
  },
]

const recentActivity = [
  {
    id: 'act-1',
    time: '14:32',
    type: 'Transfer',
    message: 'Transfer TRN-8847 received at North Site Yard (24 items)',
    level: 'success' as const,
    levelLabel: 'Complete',
  },
  {
    id: 'act-2',
    time: '13:18',
    type: 'Cycle Count',
    message: 'Variance detected: Plumbing fixtures zone (-8 units)',
    level: 'warning' as const,
    levelLabel: 'Review',
  },
  {
    id: 'act-3',
    time: '11:45',
    type: 'Requisition',
    message: 'REQ-4821 approved: Downtown Tower electrical materials',
    level: 'info' as const,
    levelLabel: 'Approved',
  },
  {
    id: 'act-4',
    time: '09:22',
    type: 'Batch',
    message: 'Batch BATCH-2847 expiring in 14 days (cement mix, 180 bags)',
    level: 'warning' as const,
    levelLabel: 'Alert',
  },
]

const expiringBatches = [
  {
    id: 'BATCH-2847',
    item: 'Portland cement mix',
    quantity: 180,
    unit: 'bags',
    expiry: 'in 14 days',
    location: 'Central Distribution, Zone B-4',
    status: 'warning' as const,
    statusLabel: 'Expiring soon',
  },
  {
    id: 'BATCH-1903',
    item: 'Epoxy resin adhesive',
    quantity: 24,
    unit: 'gallons',
    expiry: 'in 21 days',
    location: 'North Site Yard, Chem storage',
    status: 'warning' as const,
    statusLabel: 'Monitor',
  },
  {
    id: 'BATCH-3412',
    item: 'Hydraulic fluid ISO 68',
    quantity: 12,
    unit: 'drums',
    expiry: 'in 8 days',
    location: 'South Staging, Fluid bay',
    status: 'critical' as const,
    statusLabel: 'Critical',
  },
]

const quickActions = [
  {
    id: 'dashboard',
    title: 'Inventory Dashboard',
    description: 'Stock level KPIs with ABC analysis and reorder alerts',
    icon: BarChart3,
    route: '/inventory/dashboard',
    color: 'blue' as const,
  },
  {
    id: 'batches',
    title: 'Batch Tracking',
    description: 'Expiration management with FIFO/FEFO allocation and recall reporting',
    icon: Layers,
    route: '/inventory/batches',
    color: 'green' as const,
  },
  {
    id: 'transfers',
    title: 'Transfer Management',
    description: 'Inter-site transfers with route optimization and cost analysis',
    icon: ArrowLeftRight,
    route: '/inventory/transfers',
    color: 'purple' as const,
  },
  {
    id: 'cycle-counts',
    title: 'Cycle Counts',
    description: 'Inventory accuracy tracking with variance analysis',
    icon: ClipboardList,
    route: '/inventory/cycle-counts',
    color: 'orange' as const,
  },
  {
    id: 'requisitions',
    title: 'Requisition Management',
    description: 'Material requests with approval workflows and fulfillment tracking',
    icon: ShoppingBag,
    route: '/inventory/requisitions',
    color: 'red' as const,
  },
  {
    id: 'warehouse',
    title: 'Warehouse Operations',
    description: 'Pick/pack/ship workflows with bin location management',
    icon: Package,
    route: '/inventory/warehouse',
    color: 'cyan' as const,
  },
]

export const InventoryLanding = () => {
  const navigate = useNavigate()

  const handleNavigate = (route: string) => {
    navigate(route)
  }

  return (
    <div className="module-scaffold inventory-landing">
      <header className="inventory-landing__header">
        <div>
          <h1>Inventory & Materials Management</h1>
          <p className="inventory-landing__header-description">
            Optimize stock levels, streamline transfers, and maintain accurate inventory control
          </p>
        </div>
      </header>

      <section className="inventory-landing__metrics">
        {summaryMetrics.map((metric) => (
          <Surface key={metric.id} className="inventory-landing__metric" padding="lg">
            <span className="inventory-landing__metric-label">{metric.label}</span>
            <span className="inventory-landing__metric-value">{metric.value}</span>
            <span
              className={`inventory-landing__metric-trend inventory-landing__metric-trend--${metric.tone}`}
            >
              {metric.trend}
            </span>
          </Surface>
        ))}
      </section>

      <section className="inventory-landing__quick-actions">
        <div className="inventory-landing__section-header">
          <h2>Inventory Management</h2>
          <p>Access detailed stock tracking, batch management, and warehouse operations tools</p>
        </div>
        <div className="inventory-landing__actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Surface
                key={action.id}
                className={`inventory-landing__action-card inventory-landing__action-card--${action.color}`}
                padding="lg"
                onClick={() => handleNavigate(action.route)}
                style={{ cursor: 'pointer' }}
              >
                <div className="inventory-landing__action-icon">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div className="inventory-landing__action-content">
                  <h3 className="inventory-landing__action-title">{action.title}</h3>
                  <p className="inventory-landing__action-description">{action.description}</p>
                </div>
              </Surface>
            )
          })}
        </div>
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Inventory turnover</div>
            <div className="module-metrics__card-value">6.2x</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={0.8} suffix="x" label="vs. last quarter" />
            </div>
            <Sparkline
              values={turnoverSeries}
              ariaLabel="Inventory turnover trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Stockout rate</div>
            <div className="module-metrics__card-value">2.1%</div>
            <div className="module-metrics__card-meta">
              <TrendBadge
                delta={-0.6}
                suffix="%"
                label="improvement"
                positiveIsGood={false}
              />
            </div>
            <Sparkline values={stockoutSeries} ariaLabel="Stockout rate trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Order fill rate</div>
            <RadialGauge
              value={fillRate}
              label="Complete orders"
              caption="Target ≥ 95%"
              tone="success"
              size={140}
            />
            <p className="inventory-landing__metric-note">
              Exceptional fill rate maintained despite 18% volume increase in Q4. JIT replenishment
              strategy proving effective.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="ABC classification" meta="Inventory optimization">
              <p className="inventory-landing__metric-note">
                Class A: {abcMeta.aCount} items (80% value) • Class B: {abcMeta.bCount} items (15%) 
                • Class C: {abcMeta.cCount} items (5%). Rebalancing in progress.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="inventory-landing__grid">
        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Reorder alerts</h2>
            <Button variant="ghost">Manage procurement</Button>
          </div>
          <div className="inventory-landing__list">
            {reorderAlerts.map((item) => (
              <div key={item.id} className="inventory-landing__list-item">
                <div className="inventory-landing__list-content">
                  <div className="inventory-landing__list-title">{item.item}</div>
                  <p className="inventory-landing__list-subtitle">{item.supplier}</p>
                  <div className="inventory-landing__list-meta">
                    <span>SKU {item.id}</span>
                    <span>Current: {item.current} units</span>
                    <span>Reorder: {item.recommended} units</span>
                  </div>
                </div>
                <span className={`inventory-landing__tag inventory-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Warehouse status</h2>
            <Button variant="ghost">View all locations</Button>
          </div>
          <div className="inventory-landing__list inventory-landing__list--compact">
            {warehouseSnapshots.map((warehouse) => (
              <div key={warehouse.id} className="inventory-landing__location">
                <div>
                  <div className="inventory-landing__list-title">{warehouse.warehouse}</div>
                  <div className="inventory-landing__list-meta">
                    <span>{warehouse.skus} SKUs</span>
                    <span>{warehouse.value} inventory value</span>
                  </div>
                </div>
                <span className="inventory-landing__location-value">
                  {warehouse.utilization}% utilized
                </span>
                <div className="inventory-landing__progress">
                  <div
                    className="inventory-landing__progress-value"
                    style={{ width: `${warehouse.utilization}%` }}
                  />
                </div>
                <span className="inventory-landing__location-trend">{warehouse.trend}</span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="inventory-landing__grid inventory-landing__grid--wide">
        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Recent activity</h2>
            <Button variant="ghost">View full log</Button>
          </div>
          <div className="inventory-landing__list inventory-landing__list--stream">
            {recentActivity.map((event) => (
              <div key={event.id} className="inventory-landing__stream-item">
                <div className="inventory-landing__stream-time">{event.time}</div>
                <div className="inventory-landing__stream-body">
                  <div className="inventory-landing__list-title">{event.type}</div>
                  <p className="inventory-landing__list-subtitle">{event.message}</p>
                </div>
                <span className={`inventory-landing__tag inventory-landing__tag--${event.level}`}>
                  {event.levelLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="inventory-landing__panel" padding="lg">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Expiring batches</h2>
            <Button variant="ghost">Batch management</Button>
          </div>
          <div className="inventory-landing__list">
            {expiringBatches.map((item) => (
              <div
                key={item.id}
                className="inventory-landing__list-item inventory-landing__list-item--stacked"
              >
                <div className="inventory-landing__list-content">
                  <div className="inventory-landing__list-title">{item.item}</div>
                  <p className="inventory-landing__list-subtitle">{item.location}</p>
                  <div className="inventory-landing__list-meta">
                    <span>Batch {item.id}</span>
                    <span>{item.quantity} {item.unit}</span>
                    <span>Expires {item.expiry}</span>
                  </div>
                </div>
                <span className={`inventory-landing__tag inventory-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="inventory-landing__panel" padding="lg" variant="muted">
          <div className="inventory-landing__panel-header">
            <h2 className="inventory-landing__panel-title">Inventory insights</h2>
          </div>
          <p className="inventory-landing__summary">
            Q4 demand forecasting suggests <strong>12% increase</strong> in structural steel requirements.
            EOQ models recommend adjusting order quantities to optimize carrying costs.
          </p>
          <ul className="inventory-landing__bullets">
            <li>
              Top priority: Clear <strong>BATCH-3412</strong> hydraulic fluid before expiry (8 days).
            </li>
            <li>
              Opportunity: Consolidate <strong>North Site Yard</strong> inventory to free 15% capacity.
            </li>
            <li>
              Next action: Review <strong>TRN-8901</strong> transfer approval for Downtown Tower project.
            </li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
