import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Calendar, 
  GitBranch, 
  FileText, 
  Activity, 
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { PlaceholderChart, RadialGauge, Sparkline, TrendBadge } from '@shared/components/data-viz'
import { Button, Surface } from '@shared/components/ui'
import '../module-scaffold.css'
import './project-landing.css'

const summaryMetrics = [
  {
    id: 'performance',
    label: 'Schedule performance (SPI)',
    value: '1.08',
    trend: '+0.03 vs last month',
    tone: 'positive' as const,
  },
  {
    id: 'cost',
    label: 'Cost performance (CPI)',
    value: '0.94',
    trend: '6% over budget',
    tone: 'negative' as const,
  },
  {
    id: 'active',
    label: 'Active projects',
    value: '18',
    trend: '4 in planning phase',
    tone: 'neutral' as const,
  },
  {
    id: 'changes',
    label: 'Pending change orders',
    value: '12',
    trend: '$342k total impact',
    tone: 'negative' as const,
  },
]

const spiSeries = [1.02, 1.03, 1.05, 1.06, 1.07, 1.08, 1.08]
const budgetVarianceSeries = [2.1, 3.2, 4.1, 5.3, 5.8, 6.2, 6.0]
const portfolioHealth = 78
const criticalPathMeta = {
  tasksAtRisk: 8,
}

const criticalTasks = [
  {
    id: 'TSK-2841',
    project: 'Downtown Office Complex',
    task: 'Foundation pour · Phase 2 structural',
    due: 'in 2 days',
    progress: 'Weather delay possible',
    status: 'critical' as const,
    statusLabel: 'Critical',
  },
  {
    id: 'TSK-2812',
    project: 'Riverfront Apartments',
    task: 'MEP rough-in inspection',
    due: 'tomorrow',
    progress: 'Inspector confirmed',
    status: 'warning' as const,
    statusLabel: 'Due soon',
  },
  {
    id: 'TSK-2808',
    project: 'Industrial Warehouse',
    task: 'Steel erection milestone',
    due: 'in 5 days',
    progress: 'Material delivery pending',
    status: 'warning' as const,
    statusLabel: 'Watch',
  },
  {
    id: 'TSK-2799',
    project: 'Medical Center Expansion',
    task: 'HVAC equipment installation',
    due: 'in 10 days',
    progress: 'Equipment staged on site',
    status: 'neutral' as const,
    statusLabel: 'On track',
  },
]

const projectSnapshots = [
  {
    id: 'downtown',
    project: 'Downtown Office Complex',
    budget: '$12.4M',
    completion: 68,
    spi: 1.12,
    cpi: 0.89,
    trend: 'Ahead of schedule, over budget',
  },
  {
    id: 'riverfront',
    project: 'Riverfront Apartments',
    budget: '$8.2M',
    completion: 42,
    spi: 0.96,
    cpi: 1.03,
    trend: 'Slight delay, under budget',
  },
  {
    id: 'warehouse',
    project: 'Industrial Warehouse',
    budget: '$5.8M',
    completion: 85,
    spi: 1.05,
    cpi: 0.98,
    trend: 'On track for completion',
  },
]

const recentActivity = [
  {
    id: 'evt-1',
    time: '14:22',
    project: 'Downtown Office Complex',
    message: 'Change order CO-0042 approved: Add loading dock entrance.',
    level: 'success' as const,
    levelLabel: 'Approved',
  },
  {
    id: 'evt-2',
    time: '12:58',
    project: 'Riverfront Apartments',
    message: 'Milestone MLS-108 achieved: Building envelope completed.',
    level: 'success' as const,
    levelLabel: 'Milestone',
  },
  {
    id: 'evt-3',
    time: '11:32',
    project: 'Industrial Warehouse',
    message: 'Task dependency conflict detected in electrical rough-in.',
    level: 'warning' as const,
    levelLabel: 'Warning',
  },
  {
    id: 'evt-4',
    time: '09:48',
    project: 'Medical Center Expansion',
    message: 'Critical path extended by 3 days due to permit delay.',
    level: 'critical' as const,
    levelLabel: 'Critical',
  },
]

const changeOrderQueue = [
  {
    id: 'co-042',
    label: 'Add loading dock entrance',
    detail: 'Downtown Office Complex · +$48k cost, +5 days schedule',
    status: 'success' as const,
    statusLabel: 'Approved',
  },
  {
    id: 'co-039',
    label: 'Upgrade HVAC system',
    detail: 'Medical Center · +$125k cost, no schedule impact',
    status: 'warning' as const,
    statusLabel: 'Review',
  },
  {
    id: 'co-038',
    label: 'Modify parking layout',
    detail: 'Riverfront Apartments · +$32k cost, -2 days schedule',
    status: 'warning' as const,
    statusLabel: 'Pending',
  },
  {
    id: 'co-035',
    label: 'Add fire sprinkler zone',
    detail: 'Industrial Warehouse · +$18k cost, +3 days schedule',
    status: 'neutral' as const,
    statusLabel: 'Draft',
  },
]

const quickActions = [
  {
    id: 'dashboard',
    title: 'Project Dashboard',
    description: 'EVM metrics with SPI, CPI, variance analysis, and forecasts',
    icon: BarChart3,
    route: '/projects/dashboard',
    color: 'blue' as const,
  },
  {
    id: 'gantt',
    title: 'Gantt Chart',
    description: 'Interactive timeline with dependencies and critical path',
    icon: Calendar,
    route: '/projects/gantt',
    color: 'green' as const,
  },
  {
    id: 'dependencies',
    title: 'Task Dependencies',
    description: 'Manage task relationships and detect circular dependencies',
    icon: GitBranch,
    route: '/projects/gantt',
    color: 'purple' as const,
  },
  {
    id: 'changes',
    title: 'Change Orders',
    description: 'Track change requests with cost and schedule impact analysis',
    icon: FileText,
    route: '/projects/change-orders',
    color: 'orange' as const,
  },
  {
    id: 'milestones',
    title: 'Milestones',
    description: 'Track project milestones with evidence and critical path flags',
    icon: AlertTriangle,
    route: '/projects/gantt',
    color: 'red' as const,
  },
  {
    id: 'resources',
    title: 'Resource Allocation',
    description: 'Optimize resource leveling and allocation across projects',
    icon: Activity,
    route: '/projects/dashboard',
    color: 'cyan' as const,
  },
  {
    id: 'reports',
    title: 'Project Reports',
    description: 'Generate EVM reports, schedule variance, and portfolio analytics',
    icon: TrendingUp,
    route: '/projects/dashboard',
    color: 'indigo' as const,
  },
]

export const ProjectLanding = () => {
  const navigate = useNavigate()

  const handleNavigate = (route: string) => {
    navigate(route)
  }

  return (
    <div className="module-scaffold project-landing">
      <header className="project-landing__header">
        <div>
          <h1>Project Management</h1>
          <p className="project-landing__header-description">
            Earned value management, critical path scheduling, and comprehensive project analytics
          </p>
        </div>
      </header>

      <section className="project-landing__metrics">
        {summaryMetrics.map((metric) => (
          <Surface key={metric.id} className="project-landing__metric" padding="lg">
            <span className="project-landing__metric-label">{metric.label}</span>
            <span className="project-landing__metric-value">{metric.value}</span>
            <span
              className={`project-landing__metric-trend project-landing__metric-trend--${metric.tone}`}
            >
              {metric.trend}
            </span>
          </Surface>
        ))}
      </section>

      <section className="project-landing__quick-actions">
        <div className="project-landing__section-header">
          <h2>Project Management</h2>
          <p>Access project scheduling, earned value management, and change control tools</p>
        </div>
        <div className="project-landing__actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Surface
                key={action.id}
                className={`project-landing__action-card project-landing__action-card--${action.color}`}
                padding="lg"
                onClick={() => handleNavigate(action.route)}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-landing__action-icon">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div className="project-landing__action-content">
                  <h3 className="project-landing__action-title">{action.title}</h3>
                  <p className="project-landing__action-description">{action.description}</p>
                </div>
              </Surface>
            )
          })}
        </div>
      </section>

      <section className="module-metrics">
        <div className="module-metrics__grid">
          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Schedule performance</div>
            <div className="module-metrics__card-value">1.08</div>
            <div className="module-metrics__card-meta">
              <TrendBadge delta={3.2} suffix="%" label="vs. baseline" />
            </div>
            <Sparkline
              values={spiSeries}
              ariaLabel="Schedule performance trend"
              variant="positive"
            />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Budget variance</div>
            <div className="module-metrics__card-value">6.0%</div>
            <div className="module-metrics__card-meta">
              <TrendBadge
                delta={-0.8}
                suffix="%"
                label="last 30 days"
                positiveIsGood={false}
              />
            </div>
            <Sparkline values={budgetVarianceSeries} ariaLabel="Budget variance trend" variant="negative" />
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <div className="module-metrics__card-label">Portfolio health</div>
            <RadialGauge
              value={portfolioHealth}
              label="Projects on track"
              caption="Target ≥ 85%"
              tone="warning"
              size={140}
            />
            <p className="project-landing__metric-note">
              Address the 4 projects with critical path delays to improve portfolio health score before
              quarterly review.
            </p>
          </Surface>

          <Surface className="module-metrics__card" padding="lg">
            <PlaceholderChart title="Critical path analysis" meta="Task dependencies">
              <p className="project-landing__metric-note">
                {criticalPathMeta.tasksAtRisk} tasks on critical path at risk. Schedule compression
                analysis shows crashing opportunities to recover 5-7 days.
              </p>
            </PlaceholderChart>
          </Surface>
        </div>
      </section>

      <section className="project-landing__grid">
        <Surface className="project-landing__panel" padding="lg">
          <div className="project-landing__panel-header">
            <h2 className="project-landing__panel-title">Critical path tasks</h2>
            <Button variant="ghost">View Gantt</Button>
          </div>
          <div className="project-landing__list">
            {criticalTasks.map((item) => (
              <div key={item.id} className="project-landing__list-item">
                <div className="project-landing__list-content">
                  <div className="project-landing__list-title">{item.project}</div>
                  <p className="project-landing__list-subtitle">{item.task}</p>
                  <div className="project-landing__list-meta">
                    <span>Task {item.id}</span>
                    <span>Due {item.due}</span>
                    {item.progress ? <span>{item.progress}</span> : null}
                  </div>
                </div>
                <span className={`project-landing__tag project-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="project-landing__panel" padding="lg">
          <div className="project-landing__panel-header">
            <h2 className="project-landing__panel-title">Project portfolio</h2>
            <Button variant="ghost">View all projects</Button>
          </div>
          <div className="project-landing__list project-landing__list--compact">
            {projectSnapshots.map((project) => (
              <div key={project.id} className="project-landing__location">
                <div>
                  <div className="project-landing__list-title">{project.project}</div>
                  <div className="project-landing__list-meta">
                    <span>{project.budget} budget</span>
                    <span>SPI: {project.spi} · CPI: {project.cpi}</span>
                  </div>
                </div>
                <span className="project-landing__location-value">
                  {project.completion}% complete
                </span>
                <div className="project-landing__progress">
                  <div
                    className="project-landing__progress-value"
                    style={{ width: `${project.completion}%` }}
                  />
                </div>
                <span className="project-landing__location-trend">{project.trend}</span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="project-landing__grid project-landing__grid--wide">
        <Surface className="project-landing__panel" padding="lg">
          <div className="project-landing__panel-header">
            <h2 className="project-landing__panel-title">Recent activity</h2>
            <Button variant="ghost">View timeline</Button>
          </div>
          <div className="project-landing__list project-landing__list--stream">
            {recentActivity.map((event) => (
              <div key={event.id} className="project-landing__stream-item">
                <div className="project-landing__stream-time">{event.time}</div>
                <div className="project-landing__stream-body">
                  <div className="project-landing__list-title">{event.project}</div>
                  <p className="project-landing__list-subtitle">{event.message}</p>
                </div>
                <span className={`project-landing__tag project-landing__tag--${event.level}`}>
                  {event.levelLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="project-landing__panel" padding="lg">
          <div className="project-landing__panel-header">
            <h2 className="project-landing__panel-title">Change order queue</h2>
            <Button variant="ghost">Manage changes</Button>
          </div>
          <div className="project-landing__list">
            {changeOrderQueue.map((item) => (
              <div
                key={item.id}
                className="project-landing__list-item project-landing__list-item--stacked"
              >
                <div className="project-landing__list-content">
                  <div className="project-landing__list-title">{item.label}</div>
                  <p className="project-landing__list-subtitle">{item.detail}</p>
                </div>
                <span className={`project-landing__tag project-landing__tag--${item.status}`}>
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="project-landing__panel" padding="lg" variant="muted">
          <div className="project-landing__panel-header">
            <h2 className="project-landing__panel-title">EVM forecast</h2>
          </div>
          <p className="project-landing__summary">
            Current portfolio EAC shows <strong>$1.2M</strong> variance at completion. Resource leveling
            optimization could recover <strong>$340k</strong> through improved allocation efficiency.
          </p>
          <ul className="project-landing__bullets">
            <li>Top risk: <strong>Downtown Office</strong> CPI at 0.89, needs corrective action.</li>
            <li>Opportunity: <strong>Riverfront Apts</strong> running under budget, reallocate savings.</li>
            <li>Next action: Review <strong>CO-039</strong> HVAC upgrade before approval deadline.</li>
          </ul>
        </Surface>
      </section>
    </div>
  )
}
