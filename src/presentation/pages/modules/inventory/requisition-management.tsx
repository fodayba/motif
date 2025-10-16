import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  User,
  Calendar,
  MapPin,
  TrendingUp,
  Download,
  Eye,
  ArrowLeft
} from 'lucide-react'
import './requisition-management.css'

interface Requisition {
  id: string
  requisitionNumber: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilling' | 'fulfilled' | 'cancelled'
  projectId: string
  projectName: string
  requestedBy: string
  requestedDate: Date
  requiredBy: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  items: RequisitionItem[]
  totalValue: number
  approvedBy?: string
  approvedDate?: Date
  notes?: string
  fulfillmentPercent: number
}

interface RequisitionItem {
  itemId: string
  itemName: string
  sku: string
  description: string
  quantity: number
  unit: string
  estimatedCost: number
  fulfilledQuantity: number
  status: 'pending' | 'partial' | 'fulfilled' | 'cancelled'
}

interface RequisitionStats {
  totalRequisitions: number
  pendingApprovals: number
  overdueRequests: number
  averageApprovalTime: number
  fulfillmentRate: number
  requisitionsByProject: Array<{
    projectName: string
    count: number
    totalValue: number
    avgFulfillmentTime: number
  }>
  requisitionsByPriority: Array<{
    priority: string
    count: number
    percentageOnTime: number
  }>
}

export default function RequisitionManagement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([])
  const [view, setView] = useState<'list' | 'kanban' | 'stats'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null)
  const [stats, setStats] = useState<RequisitionStats | null>(null)

  useEffect(() => {
    loadRequisitions()
  }, [])

  useEffect(() => {
    filterRequisitions()
  }, [requisitions, searchTerm, filterStatus, filterPriority, filterProject])

  const loadRequisitions = async () => {
    // Mock data
    const mockRequisitions: Requisition[] = [
      {
        id: 'req-1',
        requisitionNumber: 'REQ-2024-001',
        status: 'submitted',
        projectId: 'proj-1',
        projectName: 'Downtown Office Tower',
        requestedBy: 'John Smith',
        requestedDate: new Date('2024-10-10'),
        requiredBy: new Date('2024-10-25'),
        priority: 'high',
        totalValue: 45000,
        fulfillmentPercent: 0,
        items: [
          {
            itemId: 'item-1',
            itemName: 'Structural Steel I-Beams',
            sku: 'STL-IB-200',
            description: 'W12x50 structural steel I-beams',
            quantity: 25,
            unit: 'EA',
            estimatedCost: 1500,
            fulfilledQuantity: 0,
            status: 'pending'
          },
          {
            itemId: 'item-2',
            itemName: 'Concrete Mix',
            sku: 'CNC-MX-4000',
            description: '4000 PSI concrete mix',
            quantity: 150,
            unit: 'CY',
            estimatedCost: 150,
            fulfilledQuantity: 0,
            status: 'pending'
          }
        ]
      },
      {
        id: 'req-2',
        requisitionNumber: 'REQ-2024-002',
        status: 'fulfilling',
        projectId: 'proj-2',
        projectName: 'Riverside Apartments',
        requestedBy: 'Sarah Johnson',
        requestedDate: new Date('2024-10-08'),
        requiredBy: new Date('2024-10-20'),
        priority: 'medium',
        totalValue: 28500,
        approvedBy: 'Mike Davis',
        approvedDate: new Date('2024-10-09'),
        fulfillmentPercent: 65,
        items: [
          {
            itemId: 'item-3',
            itemName: 'Lumber 2x4x8',
            sku: 'LMB-2X4-8',
            description: 'Pressure-treated lumber',
            quantity: 500,
            unit: 'EA',
            estimatedCost: 12,
            fulfilledQuantity: 350,
            status: 'partial'
          },
          {
            itemId: 'item-4',
            itemName: 'Drywall Sheets',
            sku: 'DRY-4X8-5',
            description: '4x8 ft, 5/8 inch drywall',
            quantity: 200,
            unit: 'SH',
            estimatedCost: 18,
            fulfilledQuantity: 200,
            status: 'fulfilled'
          }
        ]
      },
      {
        id: 'req-3',
        requisitionNumber: 'REQ-2024-003',
        status: 'approved',
        projectId: 'proj-1',
        projectName: 'Downtown Office Tower',
        requestedBy: 'Tom Wilson',
        requestedDate: new Date('2024-10-12'),
        requiredBy: new Date('2024-10-28'),
        priority: 'urgent',
        totalValue: 62000,
        approvedBy: 'Mike Davis',
        approvedDate: new Date('2024-10-13'),
        fulfillmentPercent: 0,
        items: [
          {
            itemId: 'item-5',
            itemName: 'Electrical Wire',
            sku: 'ELC-WR-12G',
            description: '12 gauge copper wire',
            quantity: 5000,
            unit: 'FT',
            estimatedCost: 2.5,
            fulfilledQuantity: 0,
            status: 'pending'
          }
        ]
      }
    ]

    const mockStats: RequisitionStats = {
      totalRequisitions: 24,
      pendingApprovals: 5,
      overdueRequests: 2,
      averageApprovalTime: 1.8,
      fulfillmentRate: 87,
      requisitionsByProject: [
        { projectName: 'Downtown Office Tower', count: 8, totalValue: 245000, avgFulfillmentTime: 3.2 },
        { projectName: 'Riverside Apartments', count: 6, totalValue: 180000, avgFulfillmentTime: 2.8 },
        { projectName: 'Industrial Warehouse', count: 5, totalValue: 125000, avgFulfillmentTime: 4.1 },
        { projectName: 'Retail Center', count: 5, totalValue: 98000, avgFulfillmentTime: 2.5 }
      ],
      requisitionsByPriority: [
        { priority: 'Urgent', count: 4, percentageOnTime: 92 },
        { priority: 'High', count: 8, percentageOnTime: 88 },
        { priority: 'Medium', count: 10, percentageOnTime: 85 },
        { priority: 'Low', count: 2, percentageOnTime: 95 }
      ]
    }

    setRequisitions(mockRequisitions)
    setStats(mockStats)
    setLoading(false)
  }

  const filterRequisitions = () => {
    let filtered = [...requisitions]

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus)
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(req => req.priority === filterPriority)
    }

    if (filterProject !== 'all') {
      filtered = filtered.filter(req => req.projectName === filterProject)
    }

    setFilteredRequisitions(filtered)
  }

  const getStatusIcon = (status: Requisition['status']) => {
    switch (status) {
      case 'draft': return <FileText size={16} />
      case 'submitted': return <Send size={16} />
      case 'approved': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      case 'fulfilling': return <Clock size={16} />
      case 'fulfilled': return <CheckCircle size={16} />
      case 'cancelled': return <XCircle size={16} />
    }
  }

  const getPriorityIcon = (priority: Requisition['priority']) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertCircle size={16} />
    }
    return <Clock size={16} />
  }

  const handleApprove = (requisition: Requisition) => {
    console.log('Approve requisition:', requisition.id)
    // TODO: Implement approval logic
  }

  const handleReject = (requisition: Requisition) => {
    console.log('Reject requisition:', requisition.id)
    // TODO: Implement rejection logic
  }

  const handleViewDetails = (requisition: Requisition) => {
    setSelectedRequisition(requisition)
    setShowDetailsModal(true)
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading requisitions...</p>
      </div>
    )
  }

  const projects = Array.from(new Set(requisitions.map(r => r.projectName)))

  return (
    <div className="requisition-management">
      <div className="page-header">
        <div className="header-content">
          <button
            className="requisition-management__button requisition-management__button--back"
            onClick={() => navigate('/inventory')}
            title="Back to Inventory"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="header-icon">
            <Package size={32} />
          </div>
          <div>
            <h1>Requisition Management</h1>
            <p className="header-subtitle">
              Material requests and fulfillment tracking
            </p>
          </div>
        </div>
        <button className="btn btn--primary">
          <Plus size={20} />
          New Requisition
        </button>
      </div>

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
          <Package size={18} />
          Approval Board
        </button>
        <button
          className={`view-tab ${view === 'stats' ? 'view-tab--active' : ''}`}
          onClick={() => setView('stats')}
        >
          <TrendingUp size={18} />
          Statistics
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search requisitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="fulfilling">Fulfilling</option>
            <option value="fulfilled">Fulfilled</option>
          </select>

          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
        </div>

        <button className="btn btn--secondary">
          <Download size={18} />
          Export
        </button>
      </div>

      {view === 'list' && (
        <div className="requisition-list">
          <table className="requisition-table">
            <thead>
              <tr>
                <th>Requisition #</th>
                <th>Project</th>
                <th>Requested By</th>
                <th>Required By</th>
                <th>Priority</th>
                <th>Items</th>
                <th>Total Value</th>
                <th>Fulfillment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.map(req => (
                <tr key={req.id}>
                  <td>
                    <strong>{req.requisitionNumber}</strong>
                  </td>
                  <td>
                    <div className="project-cell">
                      <MapPin size={14} />
                      {req.projectName}
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      <User size={14} />
                      {req.requestedBy}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      {req.requiredBy.toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className={`priority-badge priority-badge--${req.priority}`}>
                      {getPriorityIcon(req.priority)}
                      {req.priority}
                    </span>
                  </td>
                  <td>{req.items.length} items</td>
                  <td>${req.totalValue.toLocaleString()}</td>
                  <td>
                    <div className="fulfillment-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill"
                          style={{ width: `${req.fulfillmentPercent}%` }}
                        ></div>
                      </div>
                      <span className="progress-label">{req.fulfillmentPercent}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${req.status}`}>
                      {getStatusIcon(req.status)}
                      {req.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {req.status === 'submitted' && (
                        <>
                          <button
                            className="btn-icon btn-icon--success"
                            onClick={() => handleApprove(req)}
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            className="btn-icon btn-icon--danger"
                            onClick={() => handleReject(req)}
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button
                        className="btn-icon"
                        onClick={() => handleViewDetails(req)}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'kanban' && (
        <div className="kanban-board">
          {['submitted', 'approved', 'fulfilling', 'fulfilled'].map(status => (
            <div key={status} className="kanban-column">
              <div className="kanban-column__header">
                <h3>{status}</h3>
                <span className="count">
                  {filteredRequisitions.filter(r => r.status === status).length}
                </span>
              </div>
              <div className="kanban-column__content">
                {filteredRequisitions
                  .filter(r => r.status === status)
                  .map(req => (
                    <div key={req.id} className="kanban-card">
                      <div className="kanban-card__header">
                        <strong>{req.requisitionNumber}</strong>
                        <span className={`priority-badge priority-badge--${req.priority}`}>
                          {req.priority}
                        </span>
                      </div>
                      <div className="kanban-card__project">
                        <MapPin size={14} />
                        {req.projectName}
                      </div>
                      <div className="kanban-card__meta">
                        <div className="meta-item">
                          <User size={14} />
                          {req.requestedBy}
                        </div>
                        <div className="meta-item">
                          <Calendar size={14} />
                          {req.requiredBy.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="kanban-card__items">
                        {req.items.length} items • ${req.totalValue.toLocaleString()}
                      </div>
                      {status === 'fulfilling' && (
                        <div className="kanban-card__progress">
                          <div className="progress-bar">
                            <div
                              className="progress-bar__fill"
                              style={{ width: `${req.fulfillmentPercent}%` }}
                            ></div>
                          </div>
                          <span className="progress-label">{req.fulfillmentPercent}%</span>
                        </div>
                      )}
                      <div className="kanban-card__actions">
                        {status === 'submitted' && (
                          <>
                            <button
                              className="btn btn--sm btn--success"
                              onClick={() => handleApprove(req)}
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              className="btn btn--sm btn--danger"
                              onClick={() => handleReject(req)}
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn--sm"
                          onClick={() => handleViewDetails(req)}
                        >
                          <Eye size={16} />
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'stats' && stats && (
        <div className="stats-view">
          <div className="stats-header">
            <h2>Requisition Statistics</h2>
          </div>

          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--primary">
                <FileText size={28} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Total Requisitions</span>
                <span className="stat-card__value">{stats.totalRequisitions}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--warning">
                <Clock size={28} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Pending Approvals</span>
                <span className="stat-card__value">{stats.pendingApprovals}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--danger">
                <AlertCircle size={28} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Overdue Requests</span>
                <span className="stat-card__value">{stats.overdueRequests}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--success">
                <TrendingUp size={28} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Avg Approval Time</span>
                <span className="stat-card__value">{stats.averageApprovalTime} days</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--success">
                <CheckCircle size={28} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Fulfillment Rate</span>
                <span className="stat-card__value">{stats.fulfillmentRate}%</span>
              </div>
            </div>
          </div>

          <div className="stats-tables">
            <div className="stats-table-container">
              <h3>Requisitions by Project</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Count</th>
                    <th>Total Value</th>
                    <th>Avg Fulfillment Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.requisitionsByProject.map((proj, idx) => (
                    <tr key={idx}>
                      <td><strong>{proj.projectName}</strong></td>
                      <td>{proj.count}</td>
                      <td>${proj.totalValue.toLocaleString()}</td>
                      <td>{proj.avgFulfillmentTime} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stats-table-container">
              <h3>Performance by Priority</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Count</th>
                    <th>On-Time %</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.requisitionsByPriority.map((pri, idx) => (
                    <tr key={idx}>
                      <td><strong>{pri.priority}</strong></td>
                      <td>{pri.count}</td>
                      <td>
                        <span className={`percentage ${pri.percentageOnTime >= 90 ? 'percentage--good' : 'percentage--warning'}`}>
                          {pri.percentageOnTime}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedRequisition && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Requisition Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Requisition Number</span>
                  <span className="detail-value">{selectedRequisition.requisitionNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge status-badge--${selectedRequisition.status}`}>
                    {getStatusIcon(selectedRequisition.status)}
                    {selectedRequisition.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Project</span>
                  <span className="detail-value">{selectedRequisition.projectName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  <span className={`priority-badge priority-badge--${selectedRequisition.priority}`}>
                    {getPriorityIcon(selectedRequisition.priority)}
                    {selectedRequisition.priority}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Requested By</span>
                  <span className="detail-value">{selectedRequisition.requestedBy}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Requested Date</span>
                  <span className="detail-value">
                    {selectedRequisition.requestedDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Required By</span>
                  <span className="detail-value">
                    {selectedRequisition.requiredBy.toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Value</span>
                  <span className="detail-value">
                    ${selectedRequisition.totalValue.toLocaleString()}
                  </span>
                </div>
                {selectedRequisition.approvedBy && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Approved By</span>
                      <span className="detail-value">{selectedRequisition.approvedBy}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Approved Date</span>
                      <span className="detail-value">
                        {selectedRequisition.approvedDate?.toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="items-section">
                <h3>Requisition Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Est. Cost</th>
                      <th>Fulfilled</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequisition.items.map(item => (
                      <tr key={item.itemId}>
                        <td><strong>{item.itemName}</strong></td>
                        <td>{item.sku}</td>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td>${item.estimatedCost.toFixed(2)}</td>
                        <td>{item.fulfilledQuantity} / {item.quantity}</td>
                        <td>
                          <span className={`item-status item-status--${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
