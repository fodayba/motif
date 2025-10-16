import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Truck,
  Package,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  User,
  FileText,
  TrendingUp,
  BarChart3,
  ArrowLeft
} from 'lucide-react'
import './transfer-management.css'

interface TransferItem {
  itemId: string
  itemName: string
  sku: string
  quantity: number
  unitCost: number
  totalCost: number
}

interface Transfer {
  id: string
  transferNumber: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'in-transit' | 'received' | 'cancelled'
  sourceLocation: string
  destinationLocation: string
  items: TransferItem[]
  totalValue: number
  requestedBy: string
  requestedDate: Date
  approver?: string
  approvalDate?: Date
  shippedDate?: Date
  receivedDate?: Date
  estimatedDelivery?: Date
  carrier?: string
  trackingNumber?: string
  notes?: string
  rejectionReason?: string
}

interface TransferCostAnalysis {
  totalTransferValue: number
  transportationCost: number
  averageCostPerTransfer: number
  monthlyTransferCost: number
  costByRoute: Array<{
    route: string
    transferCount: number
    totalCost: number
    averageCost: number
  }>
}

export default function TransferManagement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([])
  const [costAnalysis, setCostAnalysis] = useState<TransferCostAnalysis | null>(null)
  
  const [view, setView] = useState<'list' | 'kanban' | 'cost-analysis'>('list')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)

  useEffect(() => {
    loadTransfers()
  }, [])

  useEffect(() => {
    filterTransfers()
  }, [transfers, selectedStatus, searchTerm])

  const loadTransfers = async () => {
    setLoading(true)
    
    // Mock data
    const mockTransfers: Transfer[] = [
      {
        id: 'TRF-001',
        transferNumber: 'TRF-2025-001',
        status: 'submitted',
        sourceLocation: 'Main Warehouse',
        destinationLocation: 'Site A - Construction',
        items: [
          { itemId: 'ITM-001', itemName: 'Portland Cement - Type I', sku: 'CEM-001', quantity: 100, unitCost: 12.50, totalCost: 1250 },
          { itemId: 'ITM-002', itemName: 'Rebar #4 - 20ft', sku: 'REB-004', quantity: 50, unitCost: 8.75, totalCost: 437.50 }
        ],
        totalValue: 1687.50,
        requestedBy: 'John Smith',
        requestedDate: new Date('2025-10-15'),
        estimatedDelivery: new Date('2025-10-18'),
        notes: 'Urgent delivery needed for foundation work'
      },
      {
        id: 'TRF-002',
        transferNumber: 'TRF-2025-002',
        status: 'approved',
        sourceLocation: 'Site B - Warehouse',
        destinationLocation: 'Site C - Construction',
        items: [
          { itemId: 'ITM-003', itemName: 'Lumber 2x4x8', sku: 'LUM-001', quantity: 200, unitCost: 6.25, totalCost: 1250 }
        ],
        totalValue: 1250,
        requestedBy: 'Sarah Johnson',
        requestedDate: new Date('2025-10-14'),
        approver: 'Mike Davis',
        approvalDate: new Date('2025-10-15'),
        estimatedDelivery: new Date('2025-10-17')
      },
      {
        id: 'TRF-003',
        transferNumber: 'TRF-2025-003',
        status: 'in-transit',
        sourceLocation: 'Main Warehouse',
        destinationLocation: 'Site D - Construction',
        items: [
          { itemId: 'ITM-004', itemName: 'Electrical Wire - 12 AWG', sku: 'ELE-012', quantity: 1000, unitCost: 0.85, totalCost: 850 },
          { itemId: 'ITM-005', itemName: 'PVC Pipe - 2" Schedule 40', sku: 'PVC-002', quantity: 75, unitCost: 4.50, totalCost: 337.50 }
        ],
        totalValue: 1187.50,
        requestedBy: 'Tom Wilson',
        requestedDate: new Date('2025-10-12'),
        approver: 'Mike Davis',
        approvalDate: new Date('2025-10-13'),
        shippedDate: new Date('2025-10-14'),
        estimatedDelivery: new Date('2025-10-16'),
        carrier: 'FastFreight Logistics',
        trackingNumber: 'FF123456789'
      },
      {
        id: 'TRF-004',
        transferNumber: 'TRF-2025-004',
        status: 'received',
        sourceLocation: 'Site A - Construction',
        destinationLocation: 'Main Warehouse',
        items: [
          { itemId: 'ITM-006', itemName: 'Safety Harness - Standard', sku: 'SAF-001', quantity: 10, unitCost: 125, totalCost: 1250 }
        ],
        totalValue: 1250,
        requestedBy: 'John Smith',
        requestedDate: new Date('2025-10-10'),
        approver: 'Mike Davis',
        approvalDate: new Date('2025-10-11'),
        shippedDate: new Date('2025-10-12'),
        receivedDate: new Date('2025-10-13'),
        carrier: 'Express Delivery Co',
        trackingNumber: 'EDC987654321'
      },
      {
        id: 'TRF-005',
        transferNumber: 'TRF-2025-005',
        status: 'rejected',
        sourceLocation: 'Site B - Warehouse',
        destinationLocation: 'Site A - Construction',
        items: [
          { itemId: 'ITM-007', itemName: 'Concrete Mix - 80lb', sku: 'CON-080', quantity: 150, unitCost: 8.50, totalCost: 1275 }
        ],
        totalValue: 1275,
        requestedBy: 'Sarah Johnson',
        requestedDate: new Date('2025-10-14'),
        approver: 'Mike Davis',
        approvalDate: new Date('2025-10-15'),
        rejectionReason: 'Insufficient stock at source location'
      }
    ]

    setTransfers(mockTransfers)

    // Mock cost analysis
    const mockCostAnalysis: TransferCostAnalysis = {
      totalTransferValue: 6650,
      transportationCost: 1250,
      averageCostPerTransfer: 1330,
      monthlyTransferCost: 3750,
      costByRoute: [
        { route: 'Main Warehouse → Site A', transferCount: 8, totalCost: 12500, averageCost: 1562.50 },
        { route: 'Site B → Site C', transferCount: 5, totalCost: 6250, averageCost: 1250 },
        { route: 'Main Warehouse → Site D', transferCount: 6, totalCost: 7125, averageCost: 1187.50 },
        { route: 'Site A → Main Warehouse', transferCount: 3, totalCost: 3750, averageCost: 1250 }
      ]
    }

    setCostAnalysis(mockCostAnalysis)
    setLoading(false)
  }

  const filterTransfers = () => {
    let filtered = [...transfers]

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sourceLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.destinationLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTransfers(filtered)
  }

  const getStatusBadgeClass = (status: Transfer['status']) => {
    const baseClass = 'status-badge'
    switch (status) {
      case 'draft': return `${baseClass} ${baseClass}--draft`
      case 'submitted': return `${baseClass} ${baseClass}--submitted`
      case 'approved': return `${baseClass} ${baseClass}--approved`
      case 'rejected': return `${baseClass} ${baseClass}--rejected`
      case 'in-transit': return `${baseClass} ${baseClass}--in-transit`
      case 'received': return `${baseClass} ${baseClass}--received`
      case 'cancelled': return `${baseClass} ${baseClass}--cancelled`
      default: return baseClass
    }
  }

  const getStatusIcon = (status: Transfer['status']) => {
    switch (status) {
      case 'submitted': return <Clock size={16} />
      case 'approved': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      case 'in-transit': return <Truck size={16} />
      case 'received': return <CheckCircle size={16} />
      case 'cancelled': return <XCircle size={16} />
      default: return <FileText size={16} />
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const handleCreateTransfer = () => {
    // TODO: Implement transfer creation wizard
    console.log('Create transfer clicked')
  }

  const handleViewDetails = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setShowDetailsModal(true)
  }

  const handleApproveTransfer = (transferId: string) => {
    console.log('Approving transfer:', transferId)
    // TODO: Implement approval logic
  }

  const handleRejectTransfer = (transferId: string) => {
    console.log('Rejecting transfer:', transferId)
    // TODO: Implement rejection logic
  }

  if (loading) {
    return (
      <div className="transfer-management transfer-management--loading">
        <div className="spinner"></div>
        <p>Loading transfers...</p>
      </div>
    )
  }

  return (
    <div className="transfer-management">
      {/* Header */}
      <div className="transfer-management__header">
        <div className="header-left">
          <button
            className="transfer-management__button transfer-management__button--back"
            onClick={() => navigate('/inventory')}
            title="Back to Inventory"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">Transfer Management</h1>
          <p className="page-subtitle">Manage inter-warehouse material transfers</p>
        </div>
        <button className="btn btn--primary" onClick={handleCreateTransfer}>
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={`view-tab ${view === 'list' ? 'view-tab--active' : ''}`}
          onClick={() => setView('list')}
        >
          <FileText size={18} />
          List View
        </button>
        <button
          className={`view-tab ${view === 'kanban' ? 'view-tab--active' : ''}`}
          onClick={() => setView('kanban')}
        >
          <BarChart3 size={18} />
          Workflow Board
        </button>
        <button
          className={`view-tab ${view === 'cost-analysis' ? 'view-tab--active' : ''}`}
          onClick={() => setView('cost-analysis')}
        >
          <DollarSign size={18} />
          Cost Analysis
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search transfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in-transit">In Transit</option>
            <option value="received">Received</option>
          </select>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="transfers-list">
          <table className="transfers-table">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>Status</th>
                <th>Route</th>
                <th>Items</th>
                <th>Value</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map(transfer => (
                <tr key={transfer.id} onClick={() => handleViewDetails(transfer)}>
                  <td>
                    <strong>{transfer.transferNumber}</strong>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(transfer.status)}>
                      {getStatusIcon(transfer.status)}
                      {transfer.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="route">
                      <MapPin size={14} />
                      <span>{transfer.sourceLocation}</span>
                      <ArrowRight size={14} />
                      <MapPin size={14} />
                      <span>{transfer.destinationLocation}</span>
                    </div>
                  </td>
                  <td>
                    <span className="item-count">{transfer.items.length} items</span>
                  </td>
                  <td>
                    <strong>{formatCurrency(transfer.totalValue)}</strong>
                  </td>
                  <td>
                    <div className="user-info">
                      <User size={14} />
                      {transfer.requestedBy}
                    </div>
                  </td>
                  <td>{formatDate(transfer.requestedDate)}</td>
                  <td>
                    <div className="action-buttons">
                      {transfer.status === 'submitted' && (
                        <>
                          <button
                            className="btn-icon btn-icon--success"
                            onClick={(e) => { e.stopPropagation(); handleApproveTransfer(transfer.id); }}
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon--danger"
                            onClick={(e) => { e.stopPropagation(); handleRejectTransfer(transfer.id); }}
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {['submitted', 'approved', 'in-transit', 'received'].map(status => (
            <div key={status} className="kanban-column">
              <div className="kanban-column__header">
                <h3>{status.replace('-', ' ')}</h3>
                <span className="badge">{transfers.filter(t => t.status === status).length}</span>
              </div>
              <div className="kanban-column__content">
                {transfers.filter(t => t.status === status).map(transfer => (
                  <div key={transfer.id} className="kanban-card" onClick={() => handleViewDetails(transfer)}>
                    <div className="kanban-card__header">
                      <strong>{transfer.transferNumber}</strong>
                      <span className={getStatusBadgeClass(transfer.status)}>
                        {getStatusIcon(transfer.status)}
                      </span>
                    </div>
                    <div className="kanban-card__route">
                      <MapPin size={14} />
                      <span>{transfer.sourceLocation}</span>
                      <ArrowRight size={12} />
                      <MapPin size={14} />
                      <span>{transfer.destinationLocation}</span>
                    </div>
                    <div className="kanban-card__meta">
                      <span className="meta-item">
                        <Package size={14} />
                        {transfer.items.length} items
                      </span>
                      <span className="meta-item">
                        <DollarSign size={14} />
                        {formatCurrency(transfer.totalValue)}
                      </span>
                    </div>
                    <div className="kanban-card__footer">
                      <span className="user-info">
                        <User size={12} />
                        {transfer.requestedBy}
                      </span>
                      <span className="date">{formatDate(transfer.requestedDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cost Analysis View */}
      {view === 'cost-analysis' && costAnalysis && (
        <div className="cost-analysis">
          <div className="cost-metrics">
            <div className="metric-card">
              <div className="metric-card__icon-wrapper metric-card__icon-wrapper--primary">
                <DollarSign size={24} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Total Transfer Value</span>
                <span className="metric-card__value">{formatCurrency(costAnalysis.totalTransferValue)}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-card__icon-wrapper metric-card__icon-wrapper--warning">
                <Truck size={24} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Transportation Cost</span>
                <span className="metric-card__value">{formatCurrency(costAnalysis.transportationCost)}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-card__icon-wrapper metric-card__icon-wrapper--info">
                <TrendingUp size={24} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Avg Cost per Transfer</span>
                <span className="metric-card__value">{formatCurrency(costAnalysis.averageCostPerTransfer)}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-card__icon-wrapper metric-card__icon-wrapper--success">
                <Calendar size={24} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Monthly Transfer Cost</span>
                <span className="metric-card__value">{formatCurrency(costAnalysis.monthlyTransferCost)}</span>
              </div>
            </div>
          </div>

          <div className="cost-by-route">
            <h3>Cost by Route</h3>
            <table className="route-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Transfer Count</th>
                  <th>Total Cost</th>
                  <th>Average Cost</th>
                </tr>
              </thead>
              <tbody>
                {costAnalysis.costByRoute.map((route, index) => (
                  <tr key={index}>
                    <td>
                      <div className="route">
                        <MapPin size={14} />
                        {route.route}
                      </div>
                    </td>
                    <td>{route.transferCount}</td>
                    <td><strong>{formatCurrency(route.totalCost)}</strong></td>
                    <td>{formatCurrency(route.averageCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Details Modal */}
      {showDetailsModal && selectedTransfer && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transfer Details</h2>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="transfer-details">
                <div className="detail-section">
                  <h3>Transfer Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Transfer Number:</span>
                      <strong>{selectedTransfer.transferNumber}</strong>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={getStatusBadgeClass(selectedTransfer.status)}>
                        {getStatusIcon(selectedTransfer.status)}
                        {selectedTransfer.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Requested By:</span>
                      <span>{selectedTransfer.requestedBy}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Requested Date:</span>
                      <span>{formatDate(selectedTransfer.requestedDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Route Information</h3>
                  <div className="route-visualization">
                    <div className="route-point">
                      <MapPin size={20} />
                      <div>
                        <strong>Source</strong>
                        <p>{selectedTransfer.sourceLocation}</p>
                      </div>
                    </div>
                    <ArrowRight size={24} className="route-arrow" />
                    <div className="route-point">
                      <MapPin size={20} />
                      <div>
                        <strong>Destination</strong>
                        <p>{selectedTransfer.destinationLocation}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Items ({selectedTransfer.items.length})</h3>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Quantity</th>
                        <th>Unit Cost</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTransfer.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.itemName}</td>
                          <td>{item.sku}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unitCost)}</td>
                          <td><strong>{formatCurrency(item.totalCost)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4}><strong>Total Value:</strong></td>
                        <td><strong>{formatCurrency(selectedTransfer.totalValue)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedTransfer.trackingNumber && (
                  <div className="detail-section">
                    <h3>Shipping Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Carrier:</span>
                        <span>{selectedTransfer.carrier}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tracking Number:</span>
                        <strong>{selectedTransfer.trackingNumber}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTransfer.notes && (
                  <div className="detail-section">
                    <h3>Notes</h3>
                    <p>{selectedTransfer.notes}</p>
                  </div>
                )}

                {selectedTransfer.rejectionReason && (
                  <div className="detail-section detail-section--warning">
                    <h3>Rejection Reason</h3>
                    <p>{selectedTransfer.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
