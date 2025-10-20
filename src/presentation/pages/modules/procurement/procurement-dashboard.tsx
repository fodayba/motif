import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Surface } from '@shared/components/ui'
import { PlaceholderChart, TrendBadge } from '@shared/components/data-viz'
import {
  ShoppingCart,
  Clock,
  DollarSign,
  CheckCircle,
} from 'lucide-react'
import './procurement-dashboard.css'

type KPICard = {
  id: string
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  icon: typeof ShoppingCart
  variant: 'success' | 'warning' | 'danger' | 'info'
}

type RequisitionItem = {
  id: string
  number: string
  requester: string
  amount: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  daysOpen: number
}

type PurchaseOrderItem = {
  id: string
  number: string
  vendor: string
  amount: number
  status: 'draft' | 'submitted' | 'approved' | 'sent' | 'received'
  deliveryDate: Date
}

type VendorItem = {
  id: string
  name: string
  rating: number
  onTimeDelivery: number
  activeOrders: number
  totalSpend: number
}

export default function ProcurementDashboard() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<KPICard[]>([])
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>([])
  const [topVendors, setTopVendors] = useState<VendorItem[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // TODO: Replace with actual API calls
    setKpis([
      {
        id: 'active-pos',
        label: 'Active Purchase Orders',
        value: 24,
        change: 12,
        trend: 'up',
        icon: ShoppingCart,
        variant: 'info',
      },
      {
        id: 'pending-approval',
        label: 'Pending Approval',
        value: 8,
        change: -3,
        trend: 'down',
        icon: Clock,
        variant: 'warning',
      },
      {
        id: 'monthly-spend',
        label: 'Monthly Spend',
        value: '$486.2k',
        change: 7,
        trend: 'up',
        icon: DollarSign,
        variant: 'success',
      },
      {
        id: 'vendor-compliance',
        label: 'Vendor Compliance',
        value: '94%',
        change: 2,
        trend: 'up',
        icon: CheckCircle,
        variant: 'success',
      },
    ])

    setRequisitions([
      {
        id: '1',
        number: 'REQ-2024-001',
        requester: 'Project Team Alpha',
        amount: 45600,
        status: 'submitted',
        daysOpen: 2,
      },
      {
        id: '2',
        number: 'REQ-2024-002',
        requester: 'Field Operations',
        amount: 12850,
        status: 'approved',
        daysOpen: 1,
      },
      {
        id: '3',
        number: 'REQ-2024-003',
        requester: 'Maintenance Team',
        amount: 8920,
        status: 'draft',
        daysOpen: 5,
      },
    ])

    setPurchaseOrders([
      {
        id: '1',
        number: 'PO-2024-0156',
        vendor: 'Steelcraft Manufacturing',
        amount: 126400,
        status: 'sent',
        deliveryDate: new Date('2024-10-20'),
      },
      {
        id: '2',
        number: 'PO-2024-0157',
        vendor: 'Metro Safety Gear',
        amount: 22750,
        status: 'approved',
        deliveryDate: new Date('2024-10-18'),
      },
      {
        id: '3',
        number: 'PO-2024-0158',
        vendor: 'Concrete Supply Co.',
        amount: 94680,
        status: 'received',
        deliveryDate: new Date('2024-10-16'),
      },
    ])

    setTopVendors([
      {
        id: '1',
        name: 'Steelcraft Manufacturing',
        rating: 4.8,
        onTimeDelivery: 96,
        activeOrders: 5,
        totalSpend: 456200,
      },
      {
        id: '2',
        name: 'Metro Safety Gear',
        rating: 4.6,
        onTimeDelivery: 92,
        activeOrders: 3,
        totalSpend: 234100,
      },
      {
        id: '3',
        name: 'Concrete Supply Co.',
        rating: 4.4,
        onTimeDelivery: 89,
        activeOrders: 4,
        totalSpend: 398500,
      },
    ])

    setLoading(false)
  }

  const getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      draft: 'procurement-dashboard__status--draft',
      submitted: 'procurement-dashboard__status--submitted',
      approved: 'procurement-dashboard__status--approved',
      rejected: 'procurement-dashboard__status--rejected',
      sent: 'procurement-dashboard__status--sent',
      received: 'procurement-dashboard__status--received',
    }
    return statusMap[status] || ''
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="procurement-dashboard__loading">
        <div className="procurement-dashboard__spinner" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="procurement-dashboard">
      <header className="procurement-dashboard__header">
        <div>
          <h1 className="procurement-dashboard__title">Procurement Dashboard</h1>
          <p className="procurement-dashboard__subtitle">
            Manage purchase orders, vendors, and sourcing activities
          </p>
        </div>
        <div className="procurement-dashboard__header-actions">
          <Link to="/procurement/requisitions">
            <Button variant="secondary">New Requisition</Button>
          </Link>
          <Link to="/procurement/purchase-orders">
            <Button>New Purchase Order</Button>
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="procurement-dashboard__kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Surface key={kpi.id} className="procurement-dashboard__kpi-card" padding="lg">
              <div className="procurement-dashboard__kpi-header">
                <div className={`procurement-dashboard__kpi-icon procurement-dashboard__kpi-icon--${kpi.variant}`}>
                  <Icon size={24} />
                </div>
                <div className="procurement-dashboard__kpi-content">
                  <p className="procurement-dashboard__kpi-label">{kpi.label}</p>
                  <h3 className="procurement-dashboard__kpi-value">{kpi.value}</h3>
                  {kpi.change !== undefined && (
                    <div className="procurement-dashboard__kpi-change">
                      <TrendBadge
                        delta={kpi.change}
                        suffix="%"
                        label="vs last month"
                        positiveIsGood={kpi.trend === 'up'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Surface>
          )
        })}
      </section>

      {/* Main Content Grid */}
      <div className="procurement-dashboard__grid">
        {/* Requisitions */}
        <Surface className="procurement-dashboard__panel" padding="lg">
          <div className="procurement-dashboard__panel-header">
            <h2 className="procurement-dashboard__panel-title">Recent Requisitions</h2>
            <Link to="/procurement/requisitions">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="procurement-dashboard__table">
            <table>
              <thead>
                <tr>
                  <th>Requisition</th>
                  <th>Requester</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Days Open</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req) => (
                  <tr key={req.id}>
                    <td className="procurement-dashboard__table-primary">{req.number}</td>
                    <td>{req.requester}</td>
                    <td>{formatCurrency(req.amount)}</td>
                    <td>
                      <span className={`procurement-dashboard__status ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>{req.daysOpen}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        {/* Purchase Orders */}
        <Surface className="procurement-dashboard__panel" padding="lg">
          <div className="procurement-dashboard__panel-header">
            <h2 className="procurement-dashboard__panel-title">Active Purchase Orders</h2>
            <Link to="/procurement/purchase-orders">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="procurement-dashboard__table">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td className="procurement-dashboard__table-primary">{po.number}</td>
                    <td>{po.vendor}</td>
                    <td>{formatCurrency(po.amount)}</td>
                    <td>{formatDate(po.deliveryDate)}</td>
                    <td>
                      <span className={`procurement-dashboard__status ${getStatusBadgeClass(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        {/* Top Vendors */}
        <Surface className="procurement-dashboard__panel procurement-dashboard__panel--wide" padding="lg">
          <div className="procurement-dashboard__panel-header">
            <h2 className="procurement-dashboard__panel-title">Top Vendors</h2>
            <Link to="/procurement/vendors">
              <Button variant="ghost">Manage Vendors</Button>
            </Link>
          </div>
          <div className="procurement-dashboard__vendors">
            {topVendors.map((vendor) => (
              <div key={vendor.id} className="procurement-dashboard__vendor-card">
                <div className="procurement-dashboard__vendor-header">
                  <h4 className="procurement-dashboard__vendor-name">{vendor.name}</h4>
                  <div className="procurement-dashboard__vendor-rating">
                    ★ {vendor.rating.toFixed(1)}
                  </div>
                </div>
                <div className="procurement-dashboard__vendor-stats">
                  <div className="procurement-dashboard__vendor-stat">
                    <span className="procurement-dashboard__vendor-stat-label">On-Time Delivery</span>
                    <span className="procurement-dashboard__vendor-stat-value">{vendor.onTimeDelivery}%</span>
                  </div>
                  <div className="procurement-dashboard__vendor-stat">
                    <span className="procurement-dashboard__vendor-stat-label">Active Orders</span>
                    <span className="procurement-dashboard__vendor-stat-value">{vendor.activeOrders}</span>
                  </div>
                  <div className="procurement-dashboard__vendor-stat">
                    <span className="procurement-dashboard__vendor-stat-label">Total Spend</span>
                    <span className="procurement-dashboard__vendor-stat-value">
                      {formatCurrency(vendor.totalSpend)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        {/* Spend Analysis */}
        <Surface className="procurement-dashboard__panel" padding="lg">
          <div className="procurement-dashboard__panel-header">
            <h2 className="procurement-dashboard__panel-title">Spend Analysis</h2>
          </div>
          <PlaceholderChart title="Monthly Spend Trend" meta="Last 6 months">
            <p className="procurement-dashboard__placeholder-text">
              Spend trend visualization will show monthly procurement spending patterns,
              category breakdowns, and budget variance analysis.
            </p>
          </PlaceholderChart>
        </Surface>
      </div>
    </div>
  )
}
