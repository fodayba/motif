import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  TruckIcon,
  DollarSign,
  Calendar,
  Building,
  ShoppingCart,
  AlertCircle,
  Download,
  Send,
  Check,
  X,
} from 'lucide-react'
import { Button } from '../../../../shared/components/ui/button'
import './purchase-order-management.css'

type POStatus = 'draft' | 'pending_approval' | 'approved' | 'issued' | 'partially_received' | 'received' | 'closed' | 'cancelled'
type POPriority = 'low' | 'medium' | 'high' | 'urgent'

type POLineItem = {
  id: string
  itemDescription: string
  quantity: number
  unitPrice: number
  uom: string
  requestedDeliveryDate: Date
  lineTotal: number
  taxAmount: number
  receivedQuantity: number
  notes?: string
}

type PurchaseOrder = {
  id: string
  poNumber: string
  status: POStatus
  priority: POPriority
  vendorId: string
  vendorName: string
  projectId?: string
  projectName?: string
  requisitionId?: string
  orderDate: Date
  requiredDate: Date
  expectedDeliveryDate?: Date
  deliveryAddress: string
  billToAddress: string
  subtotal: number
  taxTotal: number
  shippingCost: number
  total: number
  currency: string
  paymentTerms: string
  shippingMethod: string
  lineItems: POLineItem[]
  approvedBy?: string
  approvedDate?: Date
  issuedBy?: string
  issuedDate?: Date
  notes?: string
  attachments?: string[]
  createdBy: string
  createdDate: Date
}

export function PurchaseOrderManagement() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<POPriority | 'all'>('all')
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [currentStep] = useState(1)
  const [approvalNotes, setApprovalNotes] = useState('')

  // Mock data
  useEffect(() => {
    const mockPOs: PurchaseOrder[] = [
      {
        id: '1',
        poNumber: 'PO-2025-001',
        status: 'approved',
        priority: 'high',
        vendorId: 'V1',
        vendorName: 'ABC Construction Supplies',
        projectId: 'P1',
        projectName: 'Downtown Office Tower',
        requisitionId: 'REQ-2025-045',
        orderDate: new Date('2025-10-10'),
        requiredDate: new Date('2025-10-25'),
        expectedDeliveryDate: new Date('2025-10-24'),
        deliveryAddress: '123 Construction Site, Downtown',
        billToAddress: '456 Corporate Ave, Suite 100',
        subtotal: 45000,
        taxTotal: 4500,
        shippingCost: 500,
        total: 50000,
        currency: 'USD',
        paymentTerms: 'Net 30',
        shippingMethod: 'Standard Freight',
        lineItems: [
          {
            id: 'L1',
            itemDescription: 'Structural Steel Beams - Grade A572',
            quantity: 50,
            unitPrice: 800,
            uom: 'EA',
            requestedDeliveryDate: new Date('2025-10-25'),
            lineTotal: 40000,
            taxAmount: 4000,
            receivedQuantity: 0,
          },
          {
            id: 'L2',
            itemDescription: 'Welding Equipment - Industrial Grade',
            quantity: 10,
            unitPrice: 500,
            uom: 'EA',
            requestedDeliveryDate: new Date('2025-10-25'),
            lineTotal: 5000,
            taxAmount: 500,
            receivedQuantity: 0,
          },
        ],
        approvedBy: 'John Manager',
        approvedDate: new Date('2025-10-12'),
        issuedBy: 'Sarah Procurement',
        issuedDate: new Date('2025-10-13'),
        notes: 'Rush order for project milestone',
        createdBy: 'Mike Buyer',
        createdDate: new Date('2025-10-10'),
      },
      {
        id: '2',
        poNumber: 'PO-2025-002',
        status: 'pending_approval',
        priority: 'medium',
        vendorId: 'V2',
        vendorName: 'Quality Building Materials',
        projectId: 'P2',
        projectName: 'Residential Complex Phase 2',
        orderDate: new Date('2025-10-14'),
        requiredDate: new Date('2025-10-30'),
        deliveryAddress: '789 Project Site Rd',
        billToAddress: '456 Corporate Ave, Suite 100',
        subtotal: 28000,
        taxTotal: 2800,
        shippingCost: 300,
        total: 31100,
        currency: 'USD',
        paymentTerms: 'Net 45',
        shippingMethod: 'Express Delivery',
        lineItems: [
          {
            id: 'L3',
            itemDescription: 'Concrete Mix - High Strength',
            quantity: 100,
            unitPrice: 150,
            uom: 'BAG',
            requestedDeliveryDate: new Date('2025-10-30'),
            lineTotal: 15000,
            taxAmount: 1500,
            receivedQuantity: 0,
          },
          {
            id: 'L4',
            itemDescription: 'Rebar - 1/2 inch Grade 60',
            quantity: 200,
            unitPrice: 65,
            uom: 'PC',
            requestedDeliveryDate: new Date('2025-10-30'),
            lineTotal: 13000,
            taxAmount: 1300,
            receivedQuantity: 0,
          },
        ],
        createdBy: 'Anna Buyer',
        createdDate: new Date('2025-10-14'),
      },
      {
        id: '3',
        poNumber: 'PO-2025-003',
        status: 'partially_received',
        priority: 'high',
        vendorId: 'V3',
        vendorName: 'Premium HVAC Systems',
        projectId: 'P1',
        projectName: 'Downtown Office Tower',
        orderDate: new Date('2025-10-08'),
        requiredDate: new Date('2025-10-20'),
        expectedDeliveryDate: new Date('2025-10-19'),
        deliveryAddress: '123 Construction Site, Downtown',
        billToAddress: '456 Corporate Ave, Suite 100',
        subtotal: 85000,
        taxTotal: 8500,
        shippingCost: 1200,
        total: 94700,
        currency: 'USD',
        paymentTerms: 'Net 30',
        shippingMethod: 'Special Handling',
        lineItems: [
          {
            id: 'L5',
            itemDescription: 'Central Air Conditioning Unit - 50 Ton',
            quantity: 5,
            unitPrice: 15000,
            uom: 'EA',
            requestedDeliveryDate: new Date('2025-10-20'),
            lineTotal: 75000,
            taxAmount: 7500,
            receivedQuantity: 3,
          },
          {
            id: 'L6',
            itemDescription: 'Ductwork Components - Stainless Steel',
            quantity: 20,
            unitPrice: 500,
            uom: 'SET',
            requestedDeliveryDate: new Date('2025-10-20'),
            lineTotal: 10000,
            taxAmount: 1000,
            receivedQuantity: 20,
          },
        ],
        approvedBy: 'John Manager',
        approvedDate: new Date('2025-10-09'),
        issuedBy: 'Sarah Procurement',
        issuedDate: new Date('2025-10-09'),
        createdBy: 'Mike Buyer',
        createdDate: new Date('2025-10-08'),
      },
      {
        id: '4',
        poNumber: 'PO-2025-004',
        status: 'draft',
        priority: 'low',
        vendorId: 'V4',
        vendorName: 'Office Furniture Plus',
        projectId: 'P3',
        projectName: 'Corporate Headquarters Renovation',
        orderDate: new Date('2025-10-16'),
        requiredDate: new Date('2025-11-15'),
        deliveryAddress: '321 Office Park Blvd',
        billToAddress: '456 Corporate Ave, Suite 100',
        subtotal: 12000,
        taxTotal: 1200,
        shippingCost: 200,
        total: 13400,
        currency: 'USD',
        paymentTerms: 'Net 60',
        shippingMethod: 'Standard Ground',
        lineItems: [
          {
            id: 'L7',
            itemDescription: 'Executive Desk - Mahogany',
            quantity: 15,
            unitPrice: 600,
            uom: 'EA',
            requestedDeliveryDate: new Date('2025-11-15'),
            lineTotal: 9000,
            taxAmount: 900,
            receivedQuantity: 0,
          },
          {
            id: 'L8',
            itemDescription: 'Ergonomic Office Chair',
            quantity: 30,
            unitPrice: 100,
            uom: 'EA',
            requestedDeliveryDate: new Date('2025-11-15'),
            lineTotal: 3000,
            taxAmount: 300,
            receivedQuantity: 0,
          },
        ],
        createdBy: 'Lisa Buyer',
        createdDate: new Date('2025-10-16'),
      },
      {
        id: '5',
        poNumber: 'PO-2025-005',
        status: 'issued',
        priority: 'urgent',
        vendorId: 'V5',
        vendorName: 'Emergency Equipment Co.',
        projectId: 'P2',
        projectName: 'Residential Complex Phase 2',
        orderDate: new Date('2025-10-15'),
        requiredDate: new Date('2025-10-18'),
        expectedDeliveryDate: new Date('2025-10-17'),
        deliveryAddress: '789 Project Site Rd',
        billToAddress: '456 Corporate Ave, Suite 100',
        subtotal: 8500,
        taxTotal: 850,
        shippingCost: 150,
        total: 9500,
        currency: 'USD',
        paymentTerms: 'Due on Receipt',
        shippingMethod: 'Express Overnight',
        lineItems: [
          {
            id: 'L9',
            itemDescription: 'Safety Harnesses - Full Body',
            quantity: 50,
            unitPrice: 120,
            uom: 'EA',
            requestedDeliveryDate: new Date('2025-10-18'),
            lineTotal: 6000,
            taxAmount: 600,
            receivedQuantity: 0,
          },
          {
            id: 'L10',
            itemDescription: 'Hard Hats - ANSI Certified',
            quantity: 100,
            unitPrice: 25,
            uom: 'EA',
            requestedDeliveryDate: new Date('2025-10-18'),
            lineTotal: 2500,
            taxAmount: 250,
            receivedQuantity: 0,
          },
        ],
        approvedBy: 'John Manager',
        approvedDate: new Date('2025-10-15'),
        issuedBy: 'Sarah Procurement',
        issuedDate: new Date('2025-10-15'),
        notes: 'URGENT: Safety equipment needed immediately',
        createdBy: 'Mike Buyer',
        createdDate: new Date('2025-10-15'),
      },
    ]

    setPurchaseOrders(mockPOs)
    setFilteredOrders(mockPOs)
  }, [])

  // Filter logic
  useEffect(() => {
    let filtered = purchaseOrders

    if (searchTerm) {
      filtered = filtered.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((po) => po.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((po) => po.priority === priorityFilter)
    }

    setFilteredOrders(filtered)
  }, [searchTerm, statusFilter, priorityFilter, purchaseOrders])

  const getStatusIcon = (status: POStatus) => {
    switch (status) {
      case 'draft':
        return <Edit className="status-icon draft" />
      case 'pending_approval':
        return <Clock className="status-icon pending" />
      case 'approved':
        return <CheckCircle className="status-icon approved" />
      case 'issued':
        return <Send className="status-icon issued" />
      case 'partially_received':
        return <Package className="status-icon partial" />
      case 'received':
        return <Check className="status-icon received" />
      case 'closed':
        return <CheckCircle className="status-icon closed" />
      case 'cancelled':
        return <XCircle className="status-icon cancelled" />
    }
  }

  const getStatusLabel = (status: POStatus) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getPriorityBadge = (priority: POPriority) => {
    return (
      <span className={`priority-badge ${priority}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

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

  const handleViewDetails = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setShowDetailsModal(true)
  }

  const handleApprove = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setShowApprovalModal(true)
  }

  const handleReceive = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setShowReceiveModal(true)
  }

  const confirmApproval = (approved: boolean) => {
    if (selectedPO) {
      // In real app, call approval service
      console.log(`PO ${selectedPO.poNumber} ${approved ? 'approved' : 'rejected'}`, approvalNotes)
      setShowApprovalModal(false)
      setApprovalNotes('')
    }
  }

  const getReceivingProgress = (po: PurchaseOrder) => {
    const totalQty = po.lineItems.reduce((sum, item) => sum + item.quantity, 0)
    const receivedQty = po.lineItems.reduce((sum, item) => sum + item.receivedQuantity, 0)
    return totalQty > 0 ? (receivedQty / totalQty) * 100 : 0
  }

  const stats = {
    totalPOs: purchaseOrders.length,
    pendingApproval: purchaseOrders.filter((po) => po.status === 'pending_approval').length,
    activeOrders: purchaseOrders.filter((po) =>
      ['approved', 'issued', 'partially_received'].includes(po.status)
    ).length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
  }

  return (
    <div className="purchase-order-management">
      <div className="po-header">
        <div>
          <h1>Purchase Order Management</h1>
          <p className="subtitle">Create, track, and manage purchase orders</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="button-icon" />
          Create PO
        </Button>
      </div>

      {/* Statistics */}
      <div className="po-stats">
        <div className="stat-card">
          <ShoppingCart className="stat-icon" />
          <div>
            <div className="stat-value">{stats.totalPOs}</div>
            <div className="stat-label">Total Purchase Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <Clock className="stat-icon pending" />
          <div>
            <div className="stat-value">{stats.pendingApproval}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
        </div>
        <div className="stat-card">
          <TruckIcon className="stat-icon active" />
          <div>
            <div className="stat-value">{stats.activeOrders}</div>
            <div className="stat-label">Active Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <DollarSign className="stat-icon value" />
          <div>
            <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="po-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by PO number, vendor, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter className="filter-icon" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}>
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="issued">Issued</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as POPriority | 'all')}>
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="po-table-container">
        <table className="po-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Vendor</th>
              <th>Project</th>
              <th>Order Date</th>
              <th>Required Date</th>
              <th>Total</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-row">
                  <div className="empty-state">
                    <FileText className="empty-icon" />
                    <p>No purchase orders found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((po) => (
                <tr key={po.id}>
                  <td>
                    <strong>{po.poNumber}</strong>
                    {po.requisitionId && <div className="text-muted">{po.requisitionId}</div>}
                  </td>
                  <td>
                    <div className="status-badge">
                      {getStatusIcon(po.status)}
                      <span>{getStatusLabel(po.status)}</span>
                    </div>
                  </td>
                  <td>{getPriorityBadge(po.priority)}</td>
                  <td>{po.vendorName}</td>
                  <td>{po.projectName || '-'}</td>
                  <td>{formatDate(po.orderDate)}</td>
                  <td>{formatDate(po.requiredDate)}</td>
                  <td>
                    <strong>{formatCurrency(po.total, po.currency)}</strong>
                  </td>
                  <td>
                    {['issued', 'partially_received', 'received'].includes(po.status) && (
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${getReceivingProgress(po)}%` }}
                          />
                        </div>
                        <span className="progress-text">{Math.round(getReceivingProgress(po))}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="icon-button" onClick={() => handleViewDetails(po)} title="View Details">
                        <Eye size={16} />
                      </button>
                      {po.status === 'pending_approval' && (
                        <button className="icon-button approve" onClick={() => handleApprove(po)} title="Approve">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {['issued', 'partially_received'].includes(po.status) && (
                        <button className="icon-button receive" onClick={() => handleReceive(po)} title="Receive Items">
                          <Package size={16} />
                        </button>
                      )}
                      <button className="icon-button" title="Download PDF">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Purchase Order Details - {selectedPO.poNumber}</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* PO Header Info */}
              <div className="po-details-header">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Status</label>
                    <div className="status-badge">
                      {getStatusIcon(selectedPO.status)}
                      <span>{getStatusLabel(selectedPO.status)}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Priority</label>
                    {getPriorityBadge(selectedPO.priority)}
                  </div>
                  <div className="detail-item">
                    <label>Total Amount</label>
                    <strong className="amount">{formatCurrency(selectedPO.total, selectedPO.currency)}</strong>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <Building className="detail-icon" />
                    <div>
                      <label>Vendor</label>
                      <div>{selectedPO.vendorName}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FileText className="detail-icon" />
                    <div>
                      <label>Project</label>
                      <div>{selectedPO.projectName || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <Calendar className="detail-icon" />
                    <div>
                      <label>Order Date</label>
                      <div>{formatDate(selectedPO.orderDate)}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <Calendar className="detail-icon" />
                    <div>
                      <label>Required Date</label>
                      <div>{formatDate(selectedPO.requiredDate)}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <TruckIcon className="detail-icon" />
                    <div>
                      <label>Shipping Method</label>
                      <div>{selectedPO.shippingMethod}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <DollarSign className="detail-icon" />
                    <div>
                      <label>Payment Terms</label>
                      <div>{selectedPO.paymentTerms}</div>
                    </div>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div className="po-notes">
                    <AlertCircle size={16} />
                    <strong>Notes:</strong> {selectedPO.notes}
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="line-items-section">
                <h3>Line Items</h3>
                <table className="line-items-table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Quantity</th>
                      <th>UOM</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                      <th>Received</th>
                      <th>Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.itemDescription}</td>
                        <td>{item.quantity}</td>
                        <td>{item.uom}</td>
                        <td>{formatCurrency(item.unitPrice, selectedPO.currency)}</td>
                        <td>
                          <strong>{formatCurrency(item.lineTotal, selectedPO.currency)}</strong>
                        </td>
                        <td>
                          <span className={item.receivedQuantity > 0 ? 'received-qty' : ''}>
                            {item.receivedQuantity} / {item.quantity}
                          </span>
                        </td>
                        <td>{formatDate(item.requestedDeliveryDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-right">
                        <strong>Subtotal:</strong>
                      </td>
                      <td colSpan={3}>
                        <strong>{formatCurrency(selectedPO.subtotal, selectedPO.currency)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right">
                        Tax:
                      </td>
                      <td colSpan={3}>{formatCurrency(selectedPO.taxTotal, selectedPO.currency)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right">
                        Shipping:
                      </td>
                      <td colSpan={3}>{formatCurrency(selectedPO.shippingCost, selectedPO.currency)}</td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan={4} className="text-right">
                        <strong>Total:</strong>
                      </td>
                      <td colSpan={3}>
                        <strong className="total-amount">
                          {formatCurrency(selectedPO.total, selectedPO.currency)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Approval/Issue History */}
              {(selectedPO.approvedBy || selectedPO.issuedBy) && (
                <div className="approval-history">
                  <h3>Approval & Issue History</h3>
                  <div className="history-timeline">
                    {selectedPO.approvedBy && (
                      <div className="history-item">
                        <CheckCircle className="history-icon approved" />
                        <div>
                          <div className="history-label">Approved by</div>
                          <div>
                            <strong>{selectedPO.approvedBy}</strong> on{' '}
                            {selectedPO.approvedDate && formatDate(selectedPO.approvedDate)}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedPO.issuedBy && (
                      <div className="history-item">
                        <Send className="history-icon issued" />
                        <div>
                          <div className="history-label">Issued by</div>
                          <div>
                            <strong>{selectedPO.issuedBy}</strong> on{' '}
                            {selectedPO.issuedDate && formatDate(selectedPO.issuedDate)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button variant="primary">
                <Download className="button-icon" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Approve Purchase Order</h2>
              <button className="modal-close" onClick={() => setShowApprovalModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="approval-summary">
                <div className="summary-item">
                  <label>PO Number</label>
                  <div>{selectedPO.poNumber}</div>
                </div>
                <div className="summary-item">
                  <label>Vendor</label>
                  <div>{selectedPO.vendorName}</div>
                </div>
                <div className="summary-item">
                  <label>Total Amount</label>
                  <div>
                    <strong>{formatCurrency(selectedPO.total, selectedPO.currency)}</strong>
                  </div>
                </div>
                <div className="summary-item">
                  <label>Required Date</label>
                  <div>{formatDate(selectedPO.requiredDate)}</div>
                </div>
              </div>

              <div className="approval-notes-section">
                <label>Approval Notes (Optional)</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => confirmApproval(false)}>
                <X className="button-icon" />
                Reject
              </Button>
              <Button variant="primary" onClick={() => confirmApproval(true)}>
                <Check className="button-icon" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Items Modal Placeholder */}
      {showReceiveModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Receive Items - {selectedPO.poNumber}</h2>
              <button className="modal-close" onClick={() => setShowReceiveModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="info-message">
                <Package size={20} />
                Goods receipt functionality will integrate with the ThreeWayMatch system.
              </p>
              {/* Line items with receive quantities would go here */}
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowReceiveModal(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                <Check className="button-icon" />
                Complete Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal Placeholder */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Purchase Order</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="wizard-steps">
                <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Vendor & Project</div>
                </div>
                <div className={`wizard-step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Line Items</div>
                </div>
                <div className={`wizard-step ${currentStep >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-label">Delivery & Terms</div>
                </div>
                <div className={`wizard-step ${currentStep >= 4 ? 'active' : ''}`}>
                  <div className="step-number">4</div>
                  <div className="step-label">Review</div>
                </div>
              </div>

              <p className="info-message" style={{ marginTop: '2rem' }}>
                <FileText size={20} />
                PO creation wizard with multi-step form will be implemented here.
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary">Next Step</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
