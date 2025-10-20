import { useState, useEffect } from 'react'
import {
  FileText,
  Package,
  TruckIcon,
  DollarSign,
  CheckCircle,
  Clock,
  Upload,
  Download,
  TrendingUp,
  Star,
  AlertCircle,
  Calendar,
  MapPin,
  Eye,
  Send,
  Check,
} from 'lucide-react'
import { Button } from '../../../../shared/components/ui/button'
import './supplier-portal.css'

type OrderStatus = 'pending_acknowledgment' | 'acknowledged' | 'in_production' | 'ready_to_ship' | 'shipped' | 'delivered'
type InvoiceStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'paid' | 'rejected'
type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed'

type PurchaseOrder = {
  id: string
  poNumber: string
  orderDate: Date
  requiredDate: Date
  status: OrderStatus
  total: number
  currency: string
  lineItems: {
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  deliveryAddress: string
  notes?: string
}

type Shipment = {
  id: string
  poNumber: string
  trackingNumber: string
  carrier: string
  status: ShipmentStatus
  shipDate: Date
  estimatedDelivery: Date
  actualDelivery?: Date
  currentLocation?: string
  items: {
    itemDescription: string
    quantity: number
  }[]
}

type Invoice = {
  id: string
  invoiceNumber: string
  poNumber: string
  status: InvoiceStatus
  invoiceDate: Date
  dueDate: Date
  amount: number
  currency: string
  attachmentUrl?: string
  notes?: string
  reviewNotes?: string
}

type PerformanceMetrics = {
  overallScore: number
  onTimeDelivery: number
  qualityScore: number
  communicationScore: number
  complianceScore: number
  totalOrders: number
  completedOrders: number
  averageLeadTime: number
  defectRate: number
}

export function SupplierPortal() {
  const [activeTab, setActiveTab] = useState<'orders' | 'shipments' | 'invoices' | 'performance'>('orders')
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  // Removed unused state variables
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false)
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [acknowledgmentNotes, setAcknowledgmentNotes] = useState('')
  const [expectedShipDate, setExpectedShipDate] = useState('')

  // Mock data
  useEffect(() => {
    // Purchase Orders
    const mockPOs: PurchaseOrder[] = [
      {
        id: '1',
        poNumber: 'PO-2025-001',
        orderDate: new Date('2025-10-10'),
        requiredDate: new Date('2025-10-25'),
        status: 'pending_acknowledgment',
        total: 50000,
        currency: 'USD',
        lineItems: [
          {
            id: 'L1',
            description: 'Structural Steel Beams - Grade A572',
            quantity: 50,
            unitPrice: 800,
            total: 40000,
          },
          {
            id: 'L2',
            description: 'Welding Equipment - Industrial Grade',
            quantity: 10,
            unitPrice: 1000,
            total: 10000,
          },
        ],
        deliveryAddress: '123 Construction Site, Downtown',
        notes: 'Rush order for project milestone',
      },
      {
        id: '2',
        poNumber: 'PO-2025-002',
        orderDate: new Date('2025-10-08'),
        requiredDate: new Date('2025-10-20'),
        status: 'acknowledged',
        total: 94700,
        currency: 'USD',
        lineItems: [
          {
            id: 'L3',
            description: 'Central Air Conditioning Unit - 50 Ton',
            quantity: 5,
            unitPrice: 15000,
            total: 75000,
          },
          {
            id: 'L4',
            description: 'Ductwork Components - Stainless Steel',
            quantity: 20,
            unitPrice: 500,
            total: 10000,
          },
        ],
        deliveryAddress: '123 Construction Site, Downtown',
      },
      {
        id: '3',
        poNumber: 'PO-2025-003',
        orderDate: new Date('2025-10-05'),
        requiredDate: new Date('2025-10-18'),
        status: 'in_production',
        total: 31100,
        currency: 'USD',
        lineItems: [
          {
            id: 'L5',
            description: 'Concrete Mix - High Strength',
            quantity: 100,
            unitPrice: 150,
            total: 15000,
          },
        ],
        deliveryAddress: '789 Project Site Rd',
      },
    ]

    // Shipments
    const mockShipments: Shipment[] = [
      {
        id: '1',
        poNumber: 'PO-2025-002',
        trackingNumber: 'TRK-2025-00123',
        carrier: 'Standard Freight Co.',
        status: 'in_transit',
        shipDate: new Date('2025-10-14'),
        estimatedDelivery: new Date('2025-10-19'),
        currentLocation: 'Distribution Center - Chicago',
        items: [
          {
            itemDescription: 'Central Air Conditioning Unit - 50 Ton',
            quantity: 3,
          },
          {
            itemDescription: 'Ductwork Components - Stainless Steel',
            quantity: 20,
          },
        ],
      },
      {
        id: '2',
        poNumber: 'PO-2024-089',
        trackingNumber: 'TRK-2025-00098',
        carrier: 'Express Logistics',
        status: 'delivered',
        shipDate: new Date('2025-10-01'),
        estimatedDelivery: new Date('2025-10-08'),
        actualDelivery: new Date('2025-10-07'),
        currentLocation: 'Delivered',
        items: [
          {
            itemDescription: 'Safety Equipment Bundle',
            quantity: 100,
          },
        ],
      },
    ]

    // Invoices
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2025-456',
        poNumber: 'PO-2024-089',
        status: 'approved',
        invoiceDate: new Date('2025-10-08'),
        dueDate: new Date('2025-11-07'),
        amount: 12500,
        currency: 'USD',
        notes: 'Payment terms: Net 30',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2025-457',
        poNumber: 'PO-2024-087',
        status: 'paid',
        invoiceDate: new Date('2025-09-15'),
        dueDate: new Date('2025-10-15'),
        amount: 45000,
        currency: 'USD',
      },
      {
        id: '3',
        invoiceNumber: 'INV-2025-458',
        poNumber: 'PO-2025-001',
        status: 'draft',
        invoiceDate: new Date('2025-10-16'),
        dueDate: new Date('2025-11-15'),
        amount: 50000,
        currency: 'USD',
      },
    ]

    // Performance Metrics
    const mockMetrics: PerformanceMetrics = {
      overallScore: 4.5,
      onTimeDelivery: 92,
      qualityScore: 4.7,
      communicationScore: 4.3,
      complianceScore: 4.6,
      totalOrders: 48,
      completedOrders: 45,
      averageLeadTime: 12,
      defectRate: 1.5,
    }

    setPurchaseOrders(mockPOs)
    setShipments(mockShipments)
    setInvoices(mockInvoices)
    setPerformanceMetrics(mockMetrics)
  }, [])

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const getOrderStatusLabel = (status: OrderStatus) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getInvoiceStatusLabel = (status: InvoiceStatus) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleAcknowledgeOrder = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setShowAcknowledgeModal(true)
  }

  const confirmAcknowledgment = () => {
    if (selectedPO) {
      // In real app, call API to acknowledge order
      console.log('Order acknowledged:', selectedPO.poNumber, acknowledgmentNotes, expectedShipDate)
      setShowAcknowledgeModal(false)
      setAcknowledgmentNotes('')
      setExpectedShipDate('')
    }
  }

  const handleUpdateShipment = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setShowShipmentModal(true)
  }

  const handleSubmitInvoice = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setShowInvoiceModal(true)
  }

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'excellent'
    if (score >= 4.0) return 'good'
    if (score >= 3.5) return 'fair'
    return 'poor'
  }

  const stats = {
    pendingAcknowledgment: purchaseOrders.filter((po) => po.status === 'pending_acknowledgment').length,
    activeShipments: shipments.filter((s) => s.status === 'in_transit').length,
    pendingInvoices: invoices.filter((inv) => inv.status === 'draft').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
  }

  return (
    <div className="supplier-portal">
      <div className="portal-header">
        <div>
          <h1>Supplier Portal</h1>
          <p className="subtitle">Manage your orders, shipments, and invoices</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="portal-stats">
        <div className="stat-card">
          <Clock className="stat-icon pending" />
          <div>
            <div className="stat-value">{stats.pendingAcknowledgment}</div>
            <div className="stat-label">Pending Acknowledgment</div>
          </div>
        </div>
        <div className="stat-card">
          <TruckIcon className="stat-icon active" />
          <div>
            <div className="stat-value">{stats.activeShipments}</div>
            <div className="stat-label">Active Shipments</div>
          </div>
        </div>
        <div className="stat-card">
          <FileText className="stat-icon invoice" />
          <div>
            <div className="stat-value">{stats.pendingInvoices}</div>
            <div className="stat-label">Pending Invoices</div>
          </div>
        </div>
        <div className="stat-card">
          <DollarSign className="stat-icon value" />
          <div>
            <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="stat-label">Total Order Value</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="portal-tabs">
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={20} />
          Purchase Orders
        </button>
        <button
          className={`tab-button ${activeTab === 'shipments' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipments')}
        >
          <TruckIcon size={20} />
          Shipments
        </button>
        <button
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <DollarSign size={20} />
          Invoices
        </button>
        <button
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <TrendingUp size={20} />
          Performance
        </button>
      </div>

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="tab-content">
          <div className="orders-grid">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="order-card">
                <div className="card-header">
                  <div>
                    <h3>{po.poNumber}</h3>
                    <p className="card-meta">Ordered {formatDate(po.orderDate)}</p>
                  </div>
                  <span className={`status-badge ${po.status}`}>{getOrderStatusLabel(po.status)}</span>
                </div>

                <div className="card-details">
                  <div className="detail-row">
                    <Calendar className="detail-icon" />
                    <div>
                      <span className="detail-label">Required By</span>
                      <span className="detail-value">{formatDate(po.requiredDate)}</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <MapPin className="detail-icon" />
                    <div>
                      <span className="detail-label">Delivery Address</span>
                      <span className="detail-value">{po.deliveryAddress}</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <DollarSign className="detail-icon" />
                    <div>
                      <span className="detail-label">Total Amount</span>
                      <span className="detail-value">
                        <strong>{formatCurrency(po.total, po.currency)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {po.notes && (
                  <div className="order-notes">
                    <AlertCircle size={16} />
                    <span>{po.notes}</span>
                  </div>
                )}

                <div className="line-items-summary">
                  <h4>Items ({po.lineItems.length})</h4>
                  {po.lineItems.map((item) => (
                    <div key={item.id} className="line-item">
                      <span className="item-description">{item.description}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="card-actions">
                  {po.status === 'pending_acknowledgment' && (
                    <Button variant="primary" onClick={() => handleAcknowledgeOrder(po)}>
                      <Check className="button-icon" />
                      Acknowledge Order
                    </Button>
                  )}
                  {['acknowledged', 'in_production', 'ready_to_ship'].includes(po.status) && (
                    <Button variant="secondary" onClick={() => handleUpdateShipment(po)}>
                      <TruckIcon className="button-icon" />
                      Update Shipment
                    </Button>
                  )}
                  {po.status === 'delivered' && (
                    <Button variant="primary" onClick={() => handleSubmitInvoice(po)}>
                      <Upload className="button-icon" />
                      Submit Invoice
                    </Button>
                  )}
                  <Button variant="secondary">
                    <Eye className="button-icon" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <div className="tab-content">
          <div className="shipments-list">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="shipment-card">
                <div className="shipment-header">
                  <div>
                    <h3>Tracking: {shipment.trackingNumber}</h3>
                    <p className="card-meta">PO: {shipment.poNumber}</p>
                  </div>
                  <span className={`status-badge ${shipment.status}`}>
                    {shipment.status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>

                <div className="shipment-timeline">
                  <div className="timeline-item">
                    <CheckCircle className="timeline-icon completed" />
                    <div>
                      <div className="timeline-label">Shipped</div>
                      <div className="timeline-value">{formatDate(shipment.shipDate)}</div>
                    </div>
                  </div>
                  <div className={`timeline-item ${shipment.status === 'in_transit' ? 'active' : 'completed'}`}>
                    <TruckIcon className="timeline-icon" />
                    <div>
                      <div className="timeline-label">In Transit</div>
                      <div className="timeline-value">{shipment.currentLocation}</div>
                    </div>
                  </div>
                  <div className={`timeline-item ${shipment.status === 'delivered' ? 'completed' : ''}`}>
                    <Package className="timeline-icon" />
                    <div>
                      <div className="timeline-label">
                        {shipment.status === 'delivered' ? 'Delivered' : 'Estimated Delivery'}
                      </div>
                      <div className="timeline-value">
                        {shipment.actualDelivery
                          ? formatDate(shipment.actualDelivery)
                          : formatDate(shipment.estimatedDelivery)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shipment-items">
                  <h4>Items</h4>
                  {shipment.items.map((item, idx) => (
                    <div key={idx} className="shipment-item">
                      <Package size={16} />
                      <span>
                        {item.itemDescription} (x{item.quantity})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="shipment-info">
                  <span>
                    <strong>Carrier:</strong> {shipment.carrier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Invoices</h2>
            <Button variant="primary">
              <Upload className="button-icon" />
              Submit New Invoice
            </Button>
          </div>

          <div className="invoices-table">
            <table>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>PO Number</th>
                  <th>Status</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.invoiceNumber}</strong>
                    </td>
                    <td>{invoice.poNumber}</td>
                    <td>
                      <span className={`status-badge ${invoice.status}`}>
                        {getInvoiceStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td>
                      <strong>{formatCurrency(invoice.amount, invoice.currency)}</strong>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" title="View">
                          <Eye size={16} />
                        </button>
                        {invoice.status === 'draft' && (
                          <button className="icon-button" title="Submit">
                            <Send size={16} />
                          </button>
                        )}
                        {invoice.attachmentUrl && (
                          <button className="icon-button" title="Download">
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && performanceMetrics && (
        <div className="tab-content">
          <div className="performance-header">
            <div className="overall-score">
              <Star className="score-icon" size={48} />
              <div>
                <div className={`score-value ${getScoreColor(performanceMetrics.overallScore)}`}>
                  {performanceMetrics.overallScore.toFixed(1)}
                </div>
                <div className="score-label">Overall Performance Score</div>
              </div>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <TruckIcon className="metric-icon" />
                <h3>On-Time Delivery</h3>
              </div>
              <div className="metric-value">{performanceMetrics.onTimeDelivery}%</div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill success"
                  style={{ width: `${performanceMetrics.onTimeDelivery}%` }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <CheckCircle className="metric-icon" />
                <h3>Quality Score</h3>
              </div>
              <div className="metric-value">{performanceMetrics.qualityScore.toFixed(1)} / 5.0</div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill success"
                  style={{ width: `${(performanceMetrics.qualityScore / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <FileText className="metric-icon" />
                <h3>Communication</h3>
              </div>
              <div className="metric-value">{performanceMetrics.communicationScore.toFixed(1)} / 5.0</div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill primary"
                  style={{ width: `${(performanceMetrics.communicationScore / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <AlertCircle className="metric-icon" />
                <h3>Compliance Score</h3>
              </div>
              <div className="metric-value">{performanceMetrics.complianceScore.toFixed(1)} / 5.0</div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill success"
                  style={{ width: `${(performanceMetrics.complianceScore / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="stats-summary">
            <div className="summary-item">
              <Package className="summary-icon" />
              <div>
                <div className="summary-value">{performanceMetrics.completedOrders}</div>
                <div className="summary-label">Completed Orders</div>
              </div>
            </div>
            <div className="summary-item">
              <Clock className="summary-icon" />
              <div>
                <div className="summary-value">{performanceMetrics.averageLeadTime} days</div>
                <div className="summary-label">Average Lead Time</div>
              </div>
            </div>
            <div className="summary-item">
              <AlertCircle className="summary-icon" />
              <div>
                <div className="summary-value">{performanceMetrics.defectRate}%</div>
                <div className="summary-label">Defect Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledge Order Modal */}
      {showAcknowledgeModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowAcknowledgeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Acknowledge Order</h2>
              <button className="modal-close" onClick={() => setShowAcknowledgeModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <div className="summary-item">
                  <label>PO Number</label>
                  <div>{selectedPO.poNumber}</div>
                </div>
                <div className="summary-item">
                  <label>Total Amount</label>
                  <div>
                    <strong>{formatCurrency(selectedPO.total, selectedPO.currency)}</strong>
                  </div>
                </div>
                <div className="summary-item">
                  <label>Required By</label>
                  <div>{formatDate(selectedPO.requiredDate)}</div>
                </div>
              </div>

              <div className="form-field">
                <label>Expected Ship Date</label>
                <input
                  type="date"
                  value={expectedShipDate}
                  onChange={(e) => setExpectedShipDate(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Notes (Optional)</label>
                <textarea
                  value={acknowledgmentNotes}
                  onChange={(e) => setAcknowledgmentNotes(e.target.value)}
                  placeholder="Add any notes or special instructions..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowAcknowledgeModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmAcknowledgment}>
                <Check className="button-icon" />
                Acknowledge Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Shipment Modal Placeholder */}
      {showShipmentModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowShipmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Shipment</h2>
              <button className="modal-close" onClick={() => setShowShipmentModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="info-message">
                <TruckIcon size={20} />
                Shipment tracking form will be implemented here.
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowShipmentModal(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                <Send className="button-icon" />
                Update Shipment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Invoice Modal Placeholder */}
      {showInvoiceModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Invoice</h2>
              <button className="modal-close" onClick={() => setShowInvoiceModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="info-message">
                <Upload size={20} />
                Invoice submission form with file upload will be implemented here.
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                <Upload className="button-icon" />
                Submit Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
