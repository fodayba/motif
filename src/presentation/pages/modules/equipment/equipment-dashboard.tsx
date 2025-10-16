import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Truck, 
  Activity, 
  CheckCircle, 
  Wrench, 
  MapPin, 
  AlertTriangle,
  Calendar,
  BarChart3,
  Plus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowLeft
} from 'lucide-react'
import './equipment-dashboard.css'

// Types
interface EquipmentStats {
  totalEquipment: number
  inUse: number
  available: number
  inMaintenance: number
  gpsTracked: number
  overdueMaintenance: number
  utilizationRate: number
  maintenanceCostThisMonth: number
}

interface NavigationCard {
  title: string
  description: string
  icon: React.ReactNode
  route: string
  color: string
}

interface RecentActivity {
  id: string
  equipmentName: string
  action: string
  timestamp: Date
  user: string
}

export const EquipmentDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EquipmentStats>({
    totalEquipment: 0,
    inUse: 0,
    available: 0,
    inMaintenance: 0,
    gpsTracked: 0,
    overdueMaintenance: 0,
    utilizationRate: 0,
    maintenanceCostThisMonth: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual equipment service calls
      // const equipmentService = useEquipmentService()
      // const allEquipment = await equipmentService.list()
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          totalEquipment: 156,
          inUse: 89,
          available: 52,
          inMaintenance: 15,
          gpsTracked: 142,
          overdueMaintenance: 8,
          utilizationRate: 72.5,
          maintenanceCostThisMonth: 42500
        })
        
        setRecentActivity([
          {
            id: '1',
            equipmentName: 'CAT 320 Excavator',
            action: 'Checked out to Project Alpha',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            user: 'John Smith'
          },
          {
            id: '2',
            equipmentName: 'Volvo Dump Truck',
            action: 'Maintenance completed',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            user: 'Sarah Johnson'
          },
          {
            id: '3',
            equipmentName: 'JCB Backhoe',
            action: 'Location updated',
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
            user: 'GPS System'
          }
        ])
        
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setLoading(false)
    }
  }

  const navigationCards: NavigationCard[] = [
    {
      title: 'All Equipment',
      description: 'View and manage all equipment assets',
      icon: <Truck className="navigation-card__icon" />,
      route: '/equipment/list',
      color: 'blue'
    },
    {
      title: 'GPS Tracking',
      description: 'Track equipment locations in real-time',
      icon: <MapPin className="navigation-card__icon" />,
      route: '/equipment/tracking',
      color: 'green'
    },
    {
      title: 'Maintenance Schedule',
      description: 'Manage maintenance and service records',
      icon: <Calendar className="navigation-card__icon" />,
      route: '/equipment/maintenance',
      color: 'purple'
    },
    {
      title: 'Utilization Reports',
      description: 'View equipment utilization and costs',
      icon: <BarChart3 className="navigation-card__icon" />,
      route: '/equipment/reports',
      color: 'orange'
    }
  ]

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="equipment-dashboard equipment-dashboard--loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="equipment-dashboard">
      {/* Header */}
      <header className="equipment-dashboard__header">
        <div className="equipment-dashboard__header-left">
          <button 
            className="equipment-dashboard__button equipment-dashboard__button--back"
            onClick={() => navigate('/equipment')}
            title="Back to Equipment"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="equipment-dashboard__label">Asset Management</p>
            <h1 className="equipment-dashboard__title">Equipment Dashboard</h1>
          </div>
        </div>
        <button 
          className="equipment-dashboard__button equipment-dashboard__button--primary"
          onClick={() => navigate('/equipment/add')}
        >
          <Plus size={20} />
          <span>Add Equipment</span>
        </button>
      </header>

      {/* KPI Stats Grid */}
      <section className="equipment-dashboard__stats">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--primary">
            <Truck className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Total Equipment</p>
            <p className="stat-card__value">{stats.totalEquipment}</p>
            <p className="stat-card__sublabel">Assets across fleet</p>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--success">
            <Activity className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">In Use</p>
            <p className="stat-card__value">{stats.inUse}</p>
            <p className="stat-card__sublabel">Currently deployed</p>
          </div>
        </div>

        <div className="stat-card stat-card--info">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--info">
            <CheckCircle className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Available</p>
            <p className="stat-card__value">{stats.available}</p>
            <p className="stat-card__sublabel">Ready and idle</p>
          </div>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--warning">
            <Wrench className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">In Maintenance</p>
            <p className="stat-card__value">{stats.inMaintenance}</p>
            <p className="stat-card__sublabel">Under service</p>
          </div>
        </div>

        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--accent">
            <MapPin className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">GPS Tracked</p>
            <p className="stat-card__value">{stats.gpsTracked}</p>
            <p className="stat-card__sublabel">Live telemetry</p>
          </div>
        </div>

        <div className="stat-card stat-card--danger">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--danger">
            <AlertTriangle className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Overdue Maintenance</p>
            <p className="stat-card__value">{stats.overdueMaintenance}</p>
            <p className="stat-card__sublabel">Needs attention</p>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="equipment-dashboard__metrics">
        <div className="metric-card">
          <div className="metric-card__header">
            <h3 className="metric-card__title">Utilization Rate</h3>
            <div className={`metric-card__trend ${stats.utilizationRate >= 70 ? 'metric-card__trend--up' : 'metric-card__trend--down'}`}>
              {stats.utilizationRate >= 70 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{stats.utilizationRate}%</span>
            </div>
          </div>
          <div className="metric-card__body">
            <div className="progress-bar">
              <div 
                className="progress-bar__fill"
                style={{ width: `${stats.utilizationRate}%` }}
              />
            </div>
            <p className="metric-card__description">
              {stats.utilizationRate >= 70 ? 'Strong' : 'Below target'} - Target: 70%
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card__header">
            <h3 className="metric-card__title">Maintenance Costs (MTD)</h3>
            <div className="metric-card__value">{formatCurrency(stats.maintenanceCostThisMonth)}</div>
          </div>
          <div className="metric-card__body">
            <div className="metric-card__breakdown">
              <div className="metric-card__breakdown-item">
                <span className="metric-card__breakdown-label">Preventive</span>
                <span className="metric-card__breakdown-value">{formatCurrency(stats.maintenanceCostThisMonth * 0.65)}</span>
              </div>
              <div className="metric-card__breakdown-item">
                <span className="metric-card__breakdown-label">Corrective</span>
                <span className="metric-card__breakdown-value">{formatCurrency(stats.maintenanceCostThisMonth * 0.35)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="equipment-dashboard__navigation">
        <h2 className="equipment-dashboard__section-title">Quick Actions</h2>
        <div className="navigation-grid">
          {navigationCards.map((card) => (
            <div
              key={card.route}
              className={`navigation-card navigation-card--${card.color}`}
              onClick={() => navigate(card.route)}
            >
              <div className="navigation-card__icon-wrapper">
                {card.icon}
              </div>
              <div className="navigation-card__content">
                <h3 className="navigation-card__title">{card.title}</h3>
                <p className="navigation-card__description">{card.description}</p>
              </div>
              <ChevronRight className="navigation-card__arrow" />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="equipment-dashboard__activity">
        <h2 className="equipment-dashboard__section-title">Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.length === 0 ? (
            <div className="activity-list__empty">
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-item__icon">
                  <Activity size={16} />
                </div>
                <div className="activity-item__content">
                  <p className="activity-item__title">
                    <strong>{activity.equipmentName}</strong> - {activity.action}
                  </p>
                  <p className="activity-item__meta">
                    {activity.user} • {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
