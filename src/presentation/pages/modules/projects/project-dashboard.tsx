import { ArrowLeft, AlertTriangle, Target, Users, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Surface } from '@shared/components/ui'
import { Sparkline, TrendBadge } from '@shared/components/data-viz'
import './project-dashboard.css'

// Mock data - will be replaced with real data from services
const projectKPIs = [
  {
    id: 'spi',
    label: 'Schedule Performance',
    value: '0.97',
    subtitle: 'SPI',
    trend: 2.1,
    status: 'positive' as const,
  },
  {
    id: 'cpi',
    label: 'Cost Performance',
    value: '0.94',
    subtitle: 'CPI',
    trend: -1.5,
    status: 'warning' as const,
  },
  {
    id: 'milestones',
    label: 'Milestones On Track',
    value: '42 / 50',
    subtitle: '84%',
    trend: 0,
    status: 'neutral' as const,
  },
  {
    id: 'tasks',
    label: 'Active Tasks',
    value: '127',
    subtitle: '23 overdue',
    trend: -8.3,
    status: 'negative' as const,
  },
  {
    id: 'ev',
    label: 'Earned Value',
    value: '$2.4M',
    subtitle: 'vs $2.6M planned',
    trend: -7.7,
    status: 'negative' as const,
  },
  {
    id: 'resources',
    label: 'Resource Utilization',
    value: '89%',
    subtitle: '11 conflicts',
    trend: 5.2,
    status: 'warning' as const,
  },
]

const criticalPathTasks = [
  {
    id: 'task-1',
    name: 'Foundation pour - Tower 3',
    wbs: '1.2.3',
    status: 'delayed' as const,
    statusLabel: 'Delayed',
    daysOverdue: 3,
    assignee: 'Concrete Team A',
    impact: 'Critical path delay',
  },
  {
    id: 'task-2',
    name: 'Steel erection phase 2',
    wbs: '2.1.1',
    status: 'at-risk' as const,
    statusLabel: 'At Risk',
    daysOverdue: 0,
    assignee: 'Structural Crew',
    impact: 'Weather dependency',
  },
  {
    id: 'task-3',
    name: 'MEP rough-in - Floor 12',
    wbs: '3.4.5',
    status: 'on-track' as const,
    statusLabel: 'On Track',
    daysOverdue: 0,
    assignee: 'MEP Team B',
    impact: 'No issues',
  },
]

const upcomingMilestones = [
  {
    id: 'mil-1',
    name: 'Podium concrete completion',
    dueDate: '2025-10-21',
    daysUntil: 5,
    status: 'pending' as const,
    statusLabel: 'Upcoming',
    critical: true,
    dependencies: 3,
  },
  {
    id: 'mil-2',
    name: 'MEP rough-in inspection',
    dueDate: '2025-10-25',
    daysUntil: 9,
    status: 'pending' as const,
    statusLabel: 'Upcoming',
    critical: false,
    dependencies: 5,
  },
  {
    id: 'mil-3',
    name: 'Phase 2 steel complete',
    dueDate: '2025-10-18',
    daysUntil: 2,
    status: 'at-risk' as const,
    statusLabel: 'At Risk',
    critical: true,
    dependencies: 8,
  },
]

const resourceConflicts = [
  {
    id: 'conflict-1',
    resource: 'Electrical Crew A',
    type: 'overallocation',
    allocation: 145,
    tasks: ['MEP rough-in', 'Emergency generator install'],
    resolution: 'Schedule stagger recommended',
  },
  {
    id: 'conflict-2',
    resource: 'Concrete Team B',
    type: 'overallocation',
    allocation: 120,
    tasks: ['Foundation pour', 'Slab pour Floor 8'],
    resolution: 'Request additional crew',
  },
]

const recentActivities = [
  {
    id: 'act-1',
    type: 'task-complete',
    title: 'Task completed: Framing - Floor 11',
    user: 'John Smith',
    timestamp: '2 hours ago',
  },
  {
    id: 'act-2',
    type: 'change-order',
    title: 'Change order submitted: CO-2024-023',
    user: 'Sarah Johnson',
    timestamp: '4 hours ago',
  },
  {
    id: 'act-3',
    type: 'milestone',
    title: 'Milestone achieved: Structural inspection passed',
    user: 'System',
    timestamp: '1 day ago',
  },
  {
    id: 'act-4',
    type: 'task-start',
    title: 'Task started: HVAC installation - Zone 3',
    user: 'Mike Chen',
    timestamp: '1 day ago',
  },
]

const evmSeries = [0.91, 0.92, 0.93, 0.94, 0.94, 0.95, 0.97]

export const ProjectDashboard = () => {
  const navigate = useNavigate()

  return (
    <div className="project-dashboard">
      <header className="project-dashboard__header">
        <div className="project-dashboard__header-left">
          <button
            className="project-dashboard__button--back"
            onClick={() => navigate('/projects')}
            aria-label="Back to projects"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="project-dashboard__title">Downtown Skyline Tower</h1>
            <p className="project-dashboard__subtitle">Project Management Dashboard</p>
          </div>
        </div>
        <div className="project-dashboard__header-actions">
          <Button variant="secondary" onClick={() => navigate('/projects/schedule')}>
            View Schedule
          </Button>
          <Button onClick={() => navigate('/projects/change-orders')}>Create Change Order</Button>
        </div>
      </header>

      <section className="project-dashboard__kpis">
        {projectKPIs.map((kpi) => (
          <Surface key={kpi.id} className="project-dashboard__kpi" padding="lg">
            <div className="project-dashboard__kpi-header">
              <span className="project-dashboard__kpi-label">{kpi.label}</span>
              {kpi.trend !== 0 && (
                <TrendBadge
                  delta={kpi.trend}
                  label=""
                />
              )}
            </div>
            <div className="project-dashboard__kpi-value">{kpi.value}</div>
            <div className="project-dashboard__kpi-subtitle">{kpi.subtitle}</div>
            {kpi.id === 'spi' && (
              <div className="project-dashboard__kpi-chart">
                <Sparkline
                  values={evmSeries}
                  ariaLabel="SPI trend"
                  variant={kpi.status === 'negative' || kpi.status === 'warning' ? 'warning' : 'positive'}
                />
              </div>
            )}
          </Surface>
        ))}
      </section>

      <div className="project-dashboard__grid">
        <Surface className="project-dashboard__panel" padding="lg">
          <div className="project-dashboard__panel-header">
            <h2 className="project-dashboard__panel-title">Critical Path Tasks</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/projects/schedule')}
            >
              View All
            </Button>
          </div>
          <div className="project-dashboard__list">
            {criticalPathTasks.map((task) => (
              <div key={task.id} className="project-dashboard__list-item">
                <div className="project-dashboard__list-content">
                  <div className="project-dashboard__list-title">
                    {task.name}
                    {task.status === 'delayed' && (
                      <span className="project-dashboard__badge project-dashboard__badge--error">
                        {task.daysOverdue}d overdue
                      </span>
                    )}
                  </div>
                  <div className="project-dashboard__list-meta">
                    <span className="project-dashboard__wbs">WBS: {task.wbs}</span>
                    <span className="project-dashboard__separator">•</span>
                    <span>{task.assignee}</span>
                    <span className="project-dashboard__separator">•</span>
                    <span>{task.impact}</span>
                  </div>
                </div>
                <span className={`project-dashboard__tag project-dashboard__tag--${task.status}`}>
                  {task.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="project-dashboard__panel" padding="lg">
          <div className="project-dashboard__panel-header">
            <h2 className="project-dashboard__panel-title">Upcoming Milestones</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/projects/milestones')}
            >
              View All
            </Button>
          </div>
          <div className="project-dashboard__list">
            {upcomingMilestones.map((milestone) => (
              <div key={milestone.id} className="project-dashboard__list-item">
                <div className="project-dashboard__list-content">
                  <div className="project-dashboard__list-title">
                    {milestone.name}
                    {milestone.critical && (
                      <span className="project-dashboard__badge project-dashboard__badge--critical">
                        Critical
                      </span>
                    )}
                  </div>
                  <div className="project-dashboard__list-meta">
                    <Calendar size={14} />
                    <span>Due in {milestone.daysUntil} days</span>
                    <span className="project-dashboard__separator">•</span>
                    <span>{milestone.dependencies} dependencies</span>
                  </div>
                </div>
                <span className={`project-dashboard__tag project-dashboard__tag--${milestone.status}`}>
                  {milestone.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="project-dashboard__panel project-dashboard__panel--full" padding="lg">
          <div className="project-dashboard__panel-header">
            <h2 className="project-dashboard__panel-title">Resource Conflicts</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/projects/resources')}
            >
              Resolve
            </Button>
          </div>
          {resourceConflicts.length > 0 ? (
            <div className="project-dashboard__conflicts">
              {resourceConflicts.map((conflict) => (
                <div key={conflict.id} className="project-dashboard__conflict">
                  <div className="project-dashboard__conflict-header">
                    <div className="project-dashboard__conflict-title">
                      <AlertTriangle size={18} className="project-dashboard__conflict-icon" />
                      {conflict.resource}
                    </div>
                    <span className="project-dashboard__conflict-allocation">
                      {conflict.allocation}% allocated
                    </span>
                  </div>
                  <div className="project-dashboard__conflict-tasks">
                    <strong>Conflicting tasks:</strong> {conflict.tasks.join(', ')}
                  </div>
                  <div className="project-dashboard__conflict-resolution">
                    <strong>Resolution:</strong> {conflict.resolution}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="project-dashboard__empty">
              <Target size={32} />
              <p>No resource conflicts detected</p>
            </div>
          )}
        </Surface>

        <Surface className="project-dashboard__panel" padding="lg">
          <div className="project-dashboard__panel-header">
            <h2 className="project-dashboard__panel-title">Recent Activity</h2>
          </div>
          <div className="project-dashboard__activity">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="project-dashboard__activity-item">
                <div className="project-dashboard__activity-content">
                  <div className="project-dashboard__activity-title">{activity.title}</div>
                  <div className="project-dashboard__activity-meta">
                    <Users size={12} />
                    <span>{activity.user}</span>
                    <span className="project-dashboard__separator">•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  )
}
