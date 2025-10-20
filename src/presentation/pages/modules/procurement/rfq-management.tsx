import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Send,
  Eye,
  BarChart3,
  Award,
  Clock,
  XCircle,
  Users,
  DollarSign,
} from 'lucide-react'
import { Button } from '../../../../shared/components/ui/button'
import './rfq-management.css'

type RFQStatus = 'draft' | 'published' | 'closed' | 'awarded' | 'cancelled'

type RFQBid = {
  id: string
  vendorId: string
  vendorName: string
  totalPrice: number
  currency: string
  deliveryDays: number
  warranty: string
  notes?: string
  submittedDate: Date
}

type RFQ = {
  id: string
  rfqNumber: string
  title: string
  description: string
  projectId: string
  projectName: string
  status: RFQStatus
  publishDate?: Date
  dueDate: Date
  closedDate?: Date
  vendorIds: string[]
  bids: RFQBid[]
  awardedBidId?: string
  awardedToVendorName?: string
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export function RFQManagement() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [filteredRfqs, setFilteredRfqs] = useState<RFQ[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RFQStatus | 'all'>('all')
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isBidsModalOpen, setIsBidsModalOpen] = useState(false)
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockRfqs: RFQ[] = [
      {
        id: '1',
        rfqNumber: 'RFQ-2025-001',
        title: 'Electrical Installation - Building A',
        description: 'Complete electrical installation for the new commercial building',
        projectId: 'proj-1',
        projectName: 'Downtown Tower',
        status: 'published',
        publishDate: new Date('2025-10-10'),
        dueDate: new Date('2025-10-30'),
        vendorIds: ['vendor-1', 'vendor-2', 'vendor-3'],
        bids: [
          {
            id: 'bid-1',
            vendorId: 'vendor-1',
            vendorName: 'ABC Electrical Contractors',
            totalPrice: 125000,
            currency: 'USD',
            deliveryDays: 45,
            warranty: '2 years',
            submittedDate: new Date('2025-10-12'),
          },
          {
            id: 'bid-2',
            vendorId: 'vendor-2',
            vendorName: 'Superior Electric LLC',
            totalPrice: 118000,
            currency: 'USD',
            deliveryDays: 50,
            warranty: '1 year',
            submittedDate: new Date('2025-10-14'),
          },
        ],
        createdBy: 'user-1',
        createdByName: 'John Doe',
        createdAt: new Date('2025-10-09'),
        updatedAt: new Date('2025-10-14'),
      },
      {
        id: '2',
        rfqNumber: 'RFQ-2025-002',
        title: 'HVAC System Installation',
        description: 'Complete HVAC system for all floors including ductwork',
        projectId: 'proj-1',
        projectName: 'Downtown Tower',
        status: 'awarded',
        publishDate: new Date('2025-09-15'),
        dueDate: new Date('2025-10-05'),
        closedDate: new Date('2025-10-06'),
        vendorIds: ['vendor-4', 'vendor-5'],
        bids: [
          {
            id: 'bid-3',
            vendorId: 'vendor-4',
            vendorName: 'Climate Control Systems',
            totalPrice: 285000,
            currency: 'USD',
            deliveryDays: 60,
            warranty: '3 years',
            submittedDate: new Date('2025-09-28'),
          },
          {
            id: 'bid-4',
            vendorId: 'vendor-5',
            vendorName: 'Superior Plumbing LLC',
            totalPrice: 295000,
            currency: 'USD',
            deliveryDays: 55,
            warranty: '2 years',
            submittedDate: new Date('2025-10-02'),
          },
        ],
        awardedBidId: 'bid-3',
        awardedToVendorName: 'Climate Control Systems',
        createdBy: 'user-1',
        createdByName: 'John Doe',
        createdAt: new Date('2025-09-14'),
        updatedAt: new Date('2025-10-06'),
      },
      {
        id: '3',
        rfqNumber: 'RFQ-2025-003',
        title: 'Structural Steel Fabrication',
        description: 'Fabrication and installation of structural steel framework',
        projectId: 'proj-2',
        projectName: 'Harbor Bridge',
        status: 'draft',
        dueDate: new Date('2025-11-15'),
        vendorIds: [],
        bids: [],
        createdBy: 'user-2',
        createdByName: 'Jane Smith',
        createdAt: new Date('2025-10-15'),
        updatedAt: new Date('2025-10-15'),
      },
      {
        id: '4',
        rfqNumber: 'RFQ-2025-004',
        title: 'Concrete Supply - Foundation',
        description: 'Ready-mix concrete supply for foundation pour',
        projectId: 'proj-3',
        projectName: 'Riverside Mall',
        status: 'closed',
        publishDate: new Date('2025-08-20'),
        dueDate: new Date('2025-09-10'),
        closedDate: new Date('2025-09-11'),
        vendorIds: ['vendor-6', 'vendor-7', 'vendor-8'],
        bids: [
          {
            id: 'bid-5',
            vendorId: 'vendor-6',
            vendorName: 'Precision Concrete Services',
            totalPrice: 95000,
            currency: 'USD',
            deliveryDays: 14,
            warranty: 'N/A',
            submittedDate: new Date('2025-09-05'),
          },
          {
            id: 'bid-6',
            vendorId: 'vendor-7',
            vendorName: 'Metro Mix Concrete',
            totalPrice: 89000,
            currency: 'USD',
            deliveryDays: 10,
            warranty: 'N/A',
            submittedDate: new Date('2025-09-08'),
          },
          {
            id: 'bid-7',
            vendorId: 'vendor-8',
            vendorName: 'BuildRight Suppliers',
            totalPrice: 92000,
            currency: 'USD',
            deliveryDays: 12,
            warranty: 'N/A',
            submittedDate: new Date('2025-09-09'),
          },
        ],
        createdBy: 'user-2',
        createdByName: 'Jane Smith',
        createdAt: new Date('2025-08-19'),
        updatedAt: new Date('2025-09-11'),
      },
    ]

    setRfqs(mockRfqs)
    setFilteredRfqs(mockRfqs)
  }, [])

  // Filter RFQs
  useEffect(() => {
    let filtered = rfqs

    if (searchTerm) {
      filtered = filtered.filter(
        (rfq) =>
          rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfq.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((rfq) => rfq.status === statusFilter)
    }

    setFilteredRfqs(filtered)
  }, [searchTerm, statusFilter, rfqs])

  const getStatusIcon = (status: RFQStatus) => {
    switch (status) {
      case 'draft':
        return <FileText className="status-icon draft" />
      case 'published':
        return <Send className="status-icon published" />
      case 'closed':
        return <Clock className="status-icon closed" />
      case 'awarded':
        return <Award className="status-icon awarded" />
      case 'cancelled':
        return <XCircle className="status-icon cancelled" />
    }
  }

  const getStatusLabel = (status: RFQStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getDaysRemaining = (dueDate: Date) => {
    const now = new Date()
    const diff = dueDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const handleViewDetails = (rfq: RFQ) => {
    setSelectedRfq(rfq)
    setIsDetailsModalOpen(true)
  }

  const handleViewBids = (rfq: RFQ) => {
    setSelectedRfq(rfq)
    setIsBidsModalOpen(true)
  }

  const handleCompareBids = (rfq: RFQ) => {
    setSelectedRfq(rfq)
    setIsComparisonModalOpen(true)
  }

  const getLowestBid = (bids: RFQBid[]) => {
    if (bids.length === 0) return null
    return bids.reduce((lowest, bid) => (bid.totalPrice < lowest.totalPrice ? bid : lowest))
  }

  return (
    <div className="rfq-management">
      <div className="rfq-management-header">
        <div>
          <h1>RFQ Management</h1>
          <p className="subtitle">
            Create RFQs, collect bids, and award contracts
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="button-icon" />
          Create RFQ
        </Button>
      </div>

      {/* Filters */}
      <div className="rfq-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search RFQs by number, title, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RFQStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
            <option value="awarded">Awarded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* RFQ Cards */}
      <div className="rfq-cards">
        {filteredRfqs.map((rfq) => {
          const daysRemaining = getDaysRemaining(rfq.dueDate)
          const lowestBid = getLowestBid(rfq.bids)

          return (
            <div key={rfq.id} className="rfq-card">
              <div className="rfq-card-header">
                <div className="rfq-title">
                  <FileText className="rfq-icon" />
                  <div>
                    <h3>{rfq.title}</h3>
                    <p className="rfq-number">{rfq.rfqNumber}</p>
                  </div>
                </div>
                <div className="rfq-status">
                  {getStatusIcon(rfq.status)}
                  <span>{getStatusLabel(rfq.status)}</span>
                </div>
              </div>

              <div className="rfq-details">
                <div className="detail-row">
                  <span className="detail-label">Project:</span>
                  <span>{rfq.projectName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Due Date:</span>
                  <span>
                    {rfq.dueDate.toLocaleDateString()}
                    {rfq.status === 'published' && daysRemaining >= 0 && (
                      <span className={`days-badge ${daysRemaining <= 3 ? 'urgent' : ''}`}>
                        {daysRemaining} days left
                      </span>
                    )}
                  </span>
                </div>
                {rfq.publishDate && (
                  <div className="detail-row">
                    <span className="detail-label">Published:</span>
                    <span>{rfq.publishDate.toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="rfq-metrics">
                <div className="metric">
                  <Users className="metric-icon" />
                  <div>
                    <span className="metric-value">{rfq.vendorIds.length}</span>
                    <span className="metric-label">Invited</span>
                  </div>
                </div>
                <div className="metric">
                  <FileText className="metric-icon" />
                  <div>
                    <span className="metric-value">{rfq.bids.length}</span>
                    <span className="metric-label">Bids</span>
                  </div>
                </div>
                {lowestBid && (
                  <div className="metric">
                    <DollarSign className="metric-icon" />
                    <div>
                      <span className="metric-value">
                        ${lowestBid.totalPrice.toLocaleString()}
                      </span>
                      <span className="metric-label">Lowest Bid</span>
                    </div>
                  </div>
                )}
              </div>

              {rfq.awardedToVendorName && (
                <div className="awarded-banner">
                  <Award className="award-icon" />
                  <span>Awarded to {rfq.awardedToVendorName}</span>
                </div>
              )}

              <div className="rfq-actions">
                <Button variant="secondary" onClick={() => handleViewDetails(rfq)}>
                  <Eye className="button-icon" />
                  Details
                </Button>
                {rfq.bids.length > 0 && (
                  <>
                    <Button variant="secondary" onClick={() => handleViewBids(rfq)}>
                      <FileText className="button-icon" />
                      Bids ({rfq.bids.length})
                    </Button>
                    {rfq.bids.length > 1 && (
                      <Button variant="secondary" onClick={() => handleCompareBids(rfq)}>
                        <BarChart3 className="button-icon" />
                        Compare
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredRfqs.length === 0 && (
        <div className="empty-state">
          <FileText className="empty-icon" />
          <h3>No RFQs found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Create RFQ Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New RFQ</h2>
              <button
                className="modal-close"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>RFQ creation form would go here...</p>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRfq && (
        <div className="modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRfq.rfqNumber} - Details</h2>
              <button
                className="modal-close"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>RFQ Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Title:</span>
                  <span>{selectedRfq.title}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span>{selectedRfq.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Project:</span>
                  <span>{selectedRfq.projectName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span>{getStatusLabel(selectedRfq.status)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Due Date:</span>
                  <span>{selectedRfq.dueDate.toLocaleDateString()}</span>
                </div>
                {selectedRfq.publishDate && (
                  <div className="detail-row">
                    <span className="detail-label">Published:</span>
                    <span>{selectedRfq.publishDate.toLocaleDateString()}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Created By:</span>
                  <span>{selectedRfq.createdByName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bids Modal */}
      {isBidsModalOpen && selectedRfq && (
        <div className="modal-overlay" onClick={() => setIsBidsModalOpen(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRfq.rfqNumber} - Bids</h2>
              <button
                className="modal-close"
                onClick={() => setIsBidsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <table className="bids-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Total Price</th>
                    <th>Delivery</th>
                    <th>Warranty</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRfq.bids.map((bid) => (
                    <tr key={bid.id}>
                      <td>{bid.vendorName}</td>
                      <td>
                        ${bid.totalPrice.toLocaleString()} {bid.currency}
                      </td>
                      <td>{bid.deliveryDays} days</td>
                      <td>{bid.warranty}</td>
                      <td>{bid.submittedDate.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isComparisonModalOpen && selectedRfq && (
        <div
          className="modal-overlay"
          onClick={() => setIsComparisonModalOpen(false)}
        >
          <div className="modal modal-xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRfq.rfqNumber} - Bid Comparison</h2>
              <button
                className="modal-close"
                onClick={() => setIsComparisonModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="comparison-grid">
                {selectedRfq.bids.map((bid) => {
                  const isLowest =
                    bid.totalPrice === Math.min(...selectedRfq.bids.map((b) => b.totalPrice))

                  return (
                    <div key={bid.id} className={`comparison-card ${isLowest ? 'lowest' : ''}`}>
                      {isLowest && (
                        <div className="best-value-badge">
                          <Award className="badge-icon" />
                          Best Value
                        </div>
                      )}
                      <h3>{bid.vendorName}</h3>
                      <div className="comparison-price">
                        ${bid.totalPrice.toLocaleString()}
                        <span className="currency">{bid.currency}</span>
                      </div>
                      <div className="comparison-details">
                        <div className="comparison-row">
                          <span className="label">Delivery:</span>
                          <span className="value">{bid.deliveryDays} days</span>
                        </div>
                        <div className="comparison-row">
                          <span className="label">Warranty:</span>
                          <span className="value">{bid.warranty}</span>
                        </div>
                        <div className="comparison-row">
                          <span className="label">Submitted:</span>
                          <span className="value">
                            {bid.submittedDate.toLocaleDateString()}
                          </span>
                        </div>
                        {bid.notes && (
                          <div className="comparison-notes">
                            <span className="label">Notes:</span>
                            <p>{bid.notes}</p>
                          </div>
                        )}
                      </div>
                      <Button block>
                        <Award className="button-icon" />
                        Award Bid
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
