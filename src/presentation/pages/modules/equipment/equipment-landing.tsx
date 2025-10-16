import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Calendar, 
  Clipboard, 
  Activity, 
  MapPin, 
  TrendingUp
} from 'lucide-react'
import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './equipment-landing.css'

const summaryMetrics = [
  {
    id: 'utilization',
    label: 'Fleet utilization',
    value: '87%',
    trend: '+5.3% vs last month',
    tone: 'positive' as const,
  },
  {
    id: 'availability',
    label: 'Assets available',
    value: '142 units',
    trend: '21 on strategic standby',
    tone: 'neutral' as const,
  },
  {
    id: 'maintenance',
    label: 'Maintenance compliance',
    value: '92%',
    trend: '4 services overdue',
    tone: 'negative' as const,
  },
  {
    id: 'alerts',
    label: 'Active alerts',
    value: '6',
    trend: '2 require dispatch',
    tone: 'negative' as const,
  },
]

const utilizationSeries = [78, 80, 82, 83, 84, 86, 87]
const downtimeSeries = [7.4, 7.1, 6.8, 6.4, 6.2, 5.9, 5.7]
const maintenanceCompliance = 92
const telemetryMeta = {
  pendingInstalls: 4,
}

const maintenanceQueue = [
  {
    id: 'WO-4821',
    asset: 'CAT 336 Excavator',
    work: 'Hydraulic service · 750 hr interval',
    due: 'in 3 days',
    progress: 'Parts kit staged',
    status: 'critical' as const,
    statusLabel: 'Critical',
  },
  {
    id: 'WO-4812',
    asset: 'Genie S-85 Lift',
    work: 'Annual safety inspection',
    due: 'tomorrow',
    progress: 'Technician assigned',
    status: 'warning' as const,
    statusLabel: 'Due soon',
  },
  {
    id: 'WO-4808',
    asset: 'Komatsu WA380 Loader',
    work: 'Transmission diagnostics',
    due: 'in 6 days',
    progress: 'Telemetry review pending',
    status: 'warning' as const,
    statusLabel: 'Watch',
  },
  {
    id: 'WO-4799',
    asset: 'CAT D6 Dozer',
    work: 'Undercarriage torque check',
    due: 'in 12 days',
    progress: 'Waiting on bay availability',
    status: 'neutral' as const,
    statusLabel: 'Scheduled',
  },
]

const locationSnapshots = [
  {
    id: 'austin',
    site: 'Austin Logistics Hub',
    assets: 12,
    activeMissions: 5,
    readiness: 92,
    trend: '+2% vs last week',
  },
  {
    id: 'dallas',
    site: 'Dallas Central Yard',
    assets: 18,
    activeMissions: 7,
    readiness: 78,
    trend: '-4% after crane outage',
  },
  {
    id: 'houston',
    site: 'Houston Industrial Park',
    assets: 9,
    activeMissions: 3,
    readiness: 88,
    trend: '+1% post-inspection',
  },
]

const telemetryStream = [
  {
    id: 'evt-1',
    time: '08:22',
    asset: 'Komatsu WA380 Loader',
    message: 'Hydraulic temp spiked to 94°C on haul route.',
    level: 'warning' as const,
    levelLabel: 'Warning',
  },
  {
    id: 'evt-2',
    time: '07:58',
    asset: 'Liebherr LTM 1450 Crane',
    message: 'Boom angle sensor recalibrated successfully.',
    level: 'info' as const,
    levelLabel: 'Info',
  },
  {
    id: 'evt-3',
    time: '07:32',
    asset: 'CAT D6 Dozer',
    message: 'Crossed Austin South geofence without variance.',
    level: 'success' as const,
    levelLabel: 'OK',
  },
  {
    id: 'evt-4',
    time: '06:48',
    asset: 'Volvo EC480 Excavator',
    message: 'Unauthorized ignition attempt blocked by MFA lockout.',
    level: 'critical' as const,
    levelLabel: 'Critical',
  },
]

const complianceChecks = [
  {
    id: 'insurance',
    label: 'Insurance certificates',
    detail: '82 / 82 policies active; next renewal in 11 days.',
    status: 'success' as const,
    statusLabel: 'Current',
  },
  {
    id: 'osha',
    label: 'OSHA inspections',
    detail: '2 mobile elevating platforms due in < 7 days.',
    status: 'warning' as const,
    statusLabel: 'Due soon',
  },
  {
    id: 'operator',
    label: 'Operator qualifications',
    detail: '5 certifications expiring this month across 3 crews.',
    status: 'warning' as const,
    statusLabel: 'Action',
  },
  {
    id: 'telematics',
    label: 'Telemetry coverage',
    detail: '97% of fleet reporting in < 60 seconds.',
    status: 'success' as const,
    statusLabel: 'Healthy',
  },
]

const quickActions = [
  {
    id: 'dashboard',
    title: 'Equipment Dashboard',
    description: 'Detailed KPI view with statistics and performance metrics',
    icon: BarChart3,
    route: '/equipment/dashboard',
    color: 'blue' as const,
  },
  {
    id: 'gps',
    title: 'GPS Tracking',
    description: 'Real-time location tracking with geofencing and alerts',
    icon: MapPin,
    route: '/equipment/gps',
    color: 'green' as const,
  },
  {
    id: 'maintenance',
    title: 'Maintenance Calendar',
    description: 'Schedule and track preventive maintenance activities',
    icon: Calendar,
    route: '/equipment/maintenance',
    color: 'purple' as const,
  },
  {
    id: 'checkin',
    title: 'Check In/Out',
    description: 'Equipment checkout with digital signatures and condition reports',
    icon: Clipboard,
    route: '/equipment/check-in-out',
    color: 'orange' as const,
  },
  {
    id: 'sensors',
    title: 'IoT Sensors',
    description: 'Real-time sensor monitoring with anomaly detection',
    icon: Activity,
    route: '/equipment/sensors',
    color: 'red' as const,
  },
  {
    id: 'utilization',
    title: 'Utilization Reports',
    description: 'Analyze equipment usage, costs, and idle time',
    icon: TrendingUp,
    route: '/equipment/utilization',
    color: 'cyan' as const,
  },
  {
    id: 'roi',
    title: 'ROI & Depreciation',
    description: 'Financial analysis with depreciation and disposal recommendations',
    icon: BarChart3,
    route: '/equipment/roi',
    color: 'indigo' as const,
  },
]

export const EquipmentLanding = () => {
  const navigate = useNavigate()

  const handleNavigate = (route: string) => {
    navigate(route)
  }

  return (
    <div className="module-scaffold equipment-landing">
      <header className="equipment-landing__header">
        <div>
          <h1>Equipment Management</h1>
          <p className="equipment-landing__header-description">
            Real-time fleet tracking, predictive maintenance, and comprehensive asset analytics
          </p>
        </div>
      </header>

      <section className="equipment-landing__metrics">
        {summaryMetrics.map((metric) => (
          <Surface key={metric.id} className="equipment-landing__metric" padding="lg">
            <span className="equipment-landing__metric-label">{metric.label}</span>
            <span className="equipment-landing__metric-value">{metric.value}</span>
            <span
              className={`equipment-landing__metric-trend equipment-landing__metric-trend--${metric.tone}`}
            >
              {metric.trend}
            </span>
          </Surface>
        ))}
      </section>

      <section className="equipment-landing__quick-actions">
        <div className="equipment-landing__section-header">
          <h2>Equipment Management</h2>
          <p>Access detailed equipment tracking, maintenance, and analytics tools</p>
        </div>
        <div className="equipment-landing__actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Surface
                key={action.id}
                className={`equipment-landing__action-card equipment-landing__action-card--${action.color}`}
                padding="lg"
                onClick={() => handleNavigate(action.route)}
                style={{ cursor: 'pointer' }}
              >
                <div className="equipment-landing__action-icon">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div className="equipment-landing__action-content">
                  <h3 className="equipment-landing__action-title">{action.title}</h3>
                  <p className="equipment-landing__action-description">{action.description}</p>
                </div>
              </Surface>
            )
          })}
        </div>
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Fleet utilization</div>
            <div className="module-metrics__card-value">87%</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={2.1} suffix="%" label="vs. baseline" />
            </div>
            <Sparkline
              values={utilizationSeries}
              ariaLabel="Fleet utilization trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Unplanned downtime</div>
            <div className="module-metrics__card-value">5.7 hrs</div>
            <div className="module-metrics__card-meta">
              <TrendBadge
                delta={-0.8}
                suffix=" hrs"
                label="last 30 days"
                positiveIsGood={false}
              />
            </div>
            <Sparkline values={downtimeSeries} ariaLabel="Unplanned downtime trend" variant="positive" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Maintenance compliance</div>
            <RadialGauge
              value={maintenanceCompliance}
              label="On-schedule services"
              caption="Target ≥ 95%"
              tone="warning"
              size={140}
            />
            <p className="equipment-landing__metric-note">
              Clear the four overdue work orders to keep the GC compliance streak intact for the quarterly
              audit.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Telemetry rollout" meta="IoT coverage">
              <p className="equipment-landing__metric-note">
                {telemetryMeta.pendingInstalls} legacy assets await sensor retrofits. Once complete, predictive
                load balancing unlocks the dispatch optimizer beta.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="equipment-landing__grid">
        <Surface className="equipment-landing__panel" padding="lg">
          <div className="equipment-landing__panel-header">
            <h2 className="equipment-landing__panel-title">Maintenance queue</h2>
            <Button variant="ghost">View schedule</Button>
          </div>
          <div className="equipment-landing__list">
            {maintenanceQueue.map((item) => (
              <div key={item.id} className="equipment-landing__list-item">
                <div className="equipment-landing__list-content">
                  <div className="equipment-landing__list-title">{item.asset}</div>
                  <p className="equipment-landing__list-subtitle">{item.work}</p>
                  <div className="equipment-landing__list-meta">
                    <span>WO {item.id}</span>
                    <span>Due {item.due}</span>
                    {item.progress ? <span>{item.progress}</span> : null}
                  </div>
                </div>
                <span className={`equipment-landing__tag equipment-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="equipment-landing__panel" padding="lg">
          <div className="equipment-landing__panel-header">
            <h2 className="equipment-landing__panel-title">Site readiness</h2>
            <Button variant="ghost">Dispatch planner</Button>
          </div>
          <div className="equipment-landing__list equipment-landing__list--compact">
            {locationSnapshots.map((location) => (
              <div key={location.id} className="equipment-landing__location">
                <div>
                  <div className="equipment-landing__list-title">{location.site}</div>
                  <div className="equipment-landing__list-meta">
                    <span>{location.assets} assets on site</span>
                    <span>{location.activeMissions} active missions</span>
                  </div>
                </div>
                <span className="equipment-landing__location-value">
                  {location.readiness}% ready
                </span>
                <div className="equipment-landing__progress">
                  <div
                    className="equipment-landing__progress-value"
                    style={{ width: `${location.readiness}%` }}
                  />
                </div>
                <span className="equipment-landing__location-trend">{location.trend}</span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="equipment-landing__grid equipment-landing__grid--wide">
        <Surface className="equipment-landing__panel" padding="lg">
          <div className="equipment-landing__panel-header">
            <h2 className="equipment-landing__panel-title">Telemetry stream</h2>
            <Button variant="ghost">Open IoT console</Button>
          </div>
          <div className="equipment-landing__list equipment-landing__list--stream">
            {telemetryStream.map((event) => (
              <div key={event.id} className="equipment-landing__stream-item">
                <div className="equipment-landing__stream-time">{event.time}</div>
                <div className="equipment-landing__stream-body">
                  <div className="equipment-landing__list-title">{event.asset}</div>
                  <p className="equipment-landing__list-subtitle">{event.message}</p>
                </div>
                <span className={`equipment-landing__tag equipment-landing__tag--${event.level}`}>
                  {event.levelLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="equipment-landing__panel" padding="lg">
          <div className="equipment-landing__panel-header">
            <h2 className="equipment-landing__panel-title">Compliance checkpoints</h2>
            <Button variant="ghost">Manage certificates</Button>
          </div>
          <div className="equipment-landing__list">
            {complianceChecks.map((item) => (
              <div
                key={item.id}
                className="equipment-landing__list-item equipment-landing__list-item--stacked"
              >
                <div className="equipment-landing__list-content">
                  <div className="equipment-landing__list-title">{item.label}</div>
                  <p className="equipment-landing__list-subtitle">{item.detail}</p>
                </div>
                <span className={`equipment-landing__tag equipment-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="equipment-landing__panel" padding="lg" variant="muted">
          <div className="equipment-landing__panel-header">
            <h2 className="equipment-landing__panel-title">Predictive outlook</h2>
          </div>
          <p className="equipment-landing__summary">
            ML forecasts show a <strong>3.2%</strong> downtime reduction if the hydraulic service backlog
            clears by Friday. Avoided rental spend estimated at <strong>$42k</strong> this quarter.
          </p>
          <ul className="equipment-landing__bullets">
            <li>Top risk: <strong>Genie S-85</strong> battery health degraded to 68%.</li>
            <li>Opportunity: Reassign <strong>CAT 140M</strong> to Austin to balance load.</li>
            <li>Next action: Approve <strong>WO-4821</strong> procurement kit before 16:00.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
