import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Bell, 
  DollarSign, 
  BarChart3,
  ChevronRight,
  Filter,
  Repeat,
  ClipboardList,
  ListChecks,
  Scale,
  ArrowLeft,
  Download
} from 'lucide-react'
import './inventory-dashboard.css'

interface StockLevelMetrics {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  reorderAlerts: number
  totalValue: number
}

interface ABCDistribution {
  aItems: number
  bItems: number
  cItems: number
}

interface ReorderAlert {
  id: string
  itemName: string
  sku: string
  currentStock: number
  reorderPoint: number
  recommendedQuantity: number
  supplier: string
  leadTimeDays: number
}

interface ActivityItem {
  id: string
  type: 'movement' | 'transfer' | 'adjustment' | 'requisition'
  description: string
  timestamp: Date
  user: string
  quantity?: number
  location?: string
}

export default function InventoryDashboard() {
  const [metrics, setMetrics] = useState<StockLevelMetrics>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    reorderAlerts: 0,
    totalValue: 0
  })

  const [abcDistribution, setAbcDistribution] = useState<ABCDistribution>({
    aItems: 0,
    bItems: 0,
    cItems: 0
  })

  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [selectedWarehouse])

  const loadDashboardData = async () => {
    setLoading(true)
    
    // Simulate API call - replace with actual service calls
    setTimeout(() => {
      setMetrics({
        totalItems: 1247,
        lowStockItems: 34,
        outOfStockItems: 8,
        reorderAlerts: 42,
        totalValue: 2847650
      })

      setAbcDistribution({
        aItems: 249, // 20% - high value items
        bItems: 374, // 30% - medium value items
        cItems: 624  // 50% - low value items
      })

      setReorderAlerts([
        {
          id: '1',
          itemName: 'Steel Rebar #4',
          sku: 'REB-001',
          currentStock: 45,
          reorderPoint: 100,
          recommendedQuantity: 500,
          supplier: 'American Steel Co.',
          leadTimeDays: 7
        },
        {
          id: '2',
          itemName: 'Portland Cement Type I',
          sku: 'CEM-001',
          currentStock: 12,
          reorderPoint: 50,
          recommendedQuantity: 200,
          supplier: 'BuildRight Supply',
          leadTimeDays: 3
        },
        {
          id: '3',
          itemName: 'Safety Harness - Full Body',
          sku: 'SAF-045',
          currentStock: 3,
          reorderPoint: 15,
          recommendedQuantity: 30,
          supplier: 'SafetyFirst Inc.',
          leadTimeDays: 5
        },
        {
          id: '4',
          itemName: 'Hydraulic Fluid ISO 46',
          sku: 'HYD-012',
          currentStock: 8,
          reorderPoint: 20,
          recommendedQuantity: 50,
          supplier: 'Industrial Fluids Ltd.',
          leadTimeDays: 2
        }
      ])

      setRecentActivity([
        {
          id: '1',
          type: 'transfer',
          description: 'Transfer to Site B approved',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          user: 'John Smith',
          quantity: 150,
          location: 'Warehouse A → Site B'
        },
        {
          id: '2',
          type: 'requisition',
          description: 'Material requisition REQ-1234 fulfilled',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          user: 'Sarah Johnson',
          quantity: 75
        },
        {
          id: '3',
          type: 'movement',
          description: 'Stock receipt from supplier',
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
          user: 'Mike Davis',
          quantity: 500,
          location: 'Warehouse A'
        },
        {
          id: '4',
          type: 'adjustment',
          description: 'Cycle count adjustment',
          timestamp: new Date(Date.now() - 1000 * 60 * 180),
          user: 'Lisa Chen',
          quantity: -12,
          location: 'Warehouse B'
        }
      ])

      setLoading(false)
    }, 800)
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transfer': return <Repeat size={20} />
      case 'requisition': return <ClipboardList size={20} />
      case 'movement': return <Package size={20} />
      case 'adjustment': return <Scale size={20} />
      default: return <Package size={20} />
    }
  }

  const calculateABCPercentages = () => {
    const total = abcDistribution.aItems + abcDistribution.bItems + abcDistribution.cItems
    return {
      a: ((abcDistribution.aItems / total) * 100).toFixed(1),
      b: ((abcDistribution.bItems / total) * 100).toFixed(1),
      c: ((abcDistribution.cItems / total) * 100).toFixed(1)
    }
  }

  const percentages = calculateABCPercentages()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="inventory-dashboard inventory-dashboard--loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="inventory-dashboard">
      <div className="inventory-dashboard__header">
        <div className="inventory-dashboard__header-left">
          <button 
            className="inventory-dashboard__button inventory-dashboard__button--back"
            onClick={() => navigate('/inventory')}
            title="Back to Inventory"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="inventory-dashboard__label">INVENTORY MANAGEMENT</div>
            <h1 className="inventory-dashboard__title">Inventory Dashboard</h1>
          </div>
        </div>
        <div className="inventory-dashboard__header-actions">
          <div className="inventory-dashboard__filter">
            <Filter size={18} />
            <select 
              value={selectedWarehouse} 
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="inventory-dashboard__select"
            >
              <option value="all">All Warehouses</option>
              <option value="warehouse-a">Warehouse A</option>
              <option value="warehouse-b">Warehouse B</option>
              <option value="site-c">Site C</option>
            </select>
          </div>
          <button className="inventory-dashboard__button inventory-dashboard__button--primary">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="inventory-dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--neutral">
            <Package className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Total Items</div>
            <div className="stat-card__value">{metrics.totalItems.toLocaleString()}</div>
            <div className="stat-card__trend stat-card__trend--positive">
              <TrendingUp size={14} />
              <span>+3.2% from last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--warning">
            <TrendingDown className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Low Stock</div>
            <div className="stat-card__value">{metrics.lowStockItems}</div>
            <div className="stat-card__trend stat-card__trend--neutral">
              <span>Below reorder point</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--danger">
            <AlertTriangle className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Out of Stock</div>
            <div className="stat-card__value">{metrics.outOfStockItems}</div>
            <div className="stat-card__trend stat-card__trend--negative">
              <span>Requires immediate attention</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--info">
            <Bell className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Reorder Alerts</div>
            <div className="stat-card__value">{metrics.reorderAlerts}</div>
            <div className="stat-card__trend stat-card__trend--neutral">
              <span>Items need ordering</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--success">
            <DollarSign className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Inventory Value</div>
            <div className="stat-card__value">{formatCurrency(metrics.totalValue)}</div>
            <div className="stat-card__trend stat-card__trend--positive">
              <TrendingUp size={14} />
              <span>+5.8% from last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--abc">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--primary">
            <BarChart3 className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">ABC Distribution</div>
            <div className="abc-distribution">
              <div className="abc-distribution__bar">
                <div className="abc-distribution__label">A</div>
                <div className="abc-distribution__track">
                  <div className="abc-distribution__fill abc-distribution__fill--a" style={{ width: `${percentages.a}%` }}></div>
                </div>
                <div className="abc-distribution__value">{percentages.a}%</div>
              </div>
              <div className="abc-distribution__bar">
                <div className="abc-distribution__label">B</div>
                <div className="abc-distribution__track">
                  <div className="abc-distribution__fill abc-distribution__fill--b" style={{ width: `${percentages.b}%` }}></div>
                </div>
                <div className="abc-distribution__value">{percentages.b}%</div>
              </div>
              <div className="abc-distribution__bar">
                <div className="abc-distribution__label">C</div>
                <div className="abc-distribution__track">
                  <div className="abc-distribution__fill abc-distribution__fill--c" style={{ width: `${percentages.c}%` }}></div>
                </div>
                <div className="abc-distribution__value">{percentages.c}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="inventory-dashboard__quick-actions">
        <h3 className="inventory-dashboard__section-title">Quick Actions</h3>
        <div className="inventory-dashboard__quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate('/inventory/transfers')}>
            <div className="quick-action-card__icon">
              <Repeat size={24} />
            </div>
            <div className="quick-action-card__label">New Transfer</div>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/inventory/requisitions')}>
            <div className="quick-action-card__icon">
              <ClipboardList size={24} />
            </div>
            <div className="quick-action-card__label">Create Requisition</div>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/inventory/cycle-counts')}>
            <div className="quick-action-card__icon">
              <ListChecks size={24} />
            </div>
            <div className="quick-action-card__label">Cycle Count</div>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/inventory/warehouse')}>
            <div className="quick-action-card__icon">
              <Scale size={24} />
            </div>
            <div className="quick-action-card__label">Warehouse Ops</div>
          </button>
        </div>
      </div>

      <div className="inventory-dashboard__content">
        {/* Reorder Alerts */}
        <div className="inventory-dashboard__section">
          <div className="inventory-dashboard__section-header">
            <h2 className="inventory-dashboard__section-title">Reorder Alerts</h2>
            <button className="inventory-dashboard__link-button">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="inventory-dashboard__table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Reorder Point</th>
                  <th>Recommended Qty</th>
                  <th>Supplier</th>
                  <th>Lead Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reorderAlerts.map(alert => (
                  <tr key={alert.id}>
                    <td className="item-name">{alert.itemName}</td>
                    <td className="sku">{alert.sku}</td>
                    <td className="stock-level critical">{alert.currentStock}</td>
                    <td>{alert.reorderPoint}</td>
                    <td className="recommended">{alert.recommendedQuantity}</td>
                    <td>{alert.supplier}</td>
                    <td>{alert.leadTimeDays} days</td>
                    <td>
                      <button className="inventory-dashboard__action-button">Create PO</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="inventory-dashboard__section">
          <div className="inventory-dashboard__section-header">
            <h2 className="inventory-dashboard__section-title">Recent Activity</h2>
            <button className="inventory-dashboard__link-button">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="inventory-dashboard__activity">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-item__icon-wrapper">{getActivityIcon(activity.type)}</div>
                <div className="activity-item__content">
                  <div className="activity-item__description">{activity.description}</div>
                  <div className="activity-item__meta">
                    <span className="activity-item__user">{activity.user}</span>
                    {activity.location && (
                      <>
                        <span className="activity-item__separator">•</span>
                        <span className="activity-item__location">{activity.location}</span>
                      </>
                    )}
                    {activity.quantity && (
                      <>
                        <span className="activity-item__separator">•</span>
                        <span className={`activity-item__quantity ${activity.quantity > 0 ? 'activity-item__quantity--positive' : 'activity-item__quantity--negative'}`}>
                          {activity.quantity > 0 ? '+' : ''}{activity.quantity} units
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="activity-item__time">{formatTimeAgo(activity.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
