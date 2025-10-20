import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Package,
  Receipt,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Button } from '../../../../shared/components/ui/button'
import './three-way-match.css'

type ThreeWayMatchStatus = 'pending' | 'matched' | 'discrepancy' | 'approved' | 'rejected'
type DiscrepancyType = 'quantity' | 'price' | 'total'

type LineItemMatch = {
  purchaseOrderLineId: string
  itemDescription: string
  poQuantity: number
  grQuantity: number
  invoiceQuantity: number
  poUnitPrice: number
  invoiceUnitPrice: number
  poLineTotal: number
  invoiceLineTotal: number
  quantityVariance: number
  priceVariance: number
  totalVariance: number
  discrepancies: DiscrepancyType[]
  matched: boolean
}

type ThreeWayMatch = {
  id: string
  matchNumber: string
  purchaseOrderNumber: string
  goodsReceiptNumber: string
  invoiceNumber: string
  vendorName: string
  projectName: string
  status: ThreeWayMatchStatus
  lineItems: LineItemMatch[]
  poTotal: number
  grTotal: number
  invoiceTotal: number
  totalVariance: number
  tolerancePercentage: number
  withinTolerance: boolean
  hasDiscrepancies: boolean
  reviewedBy?: string
  reviewedByName?: string
  reviewedDate?: Date
  reviewNotes?: string
  approvedBy?: string
  approvedByName?: string
  approvedDate?: Date
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

export function ThreeWayMatchReview() {
  const [matches, setMatches] = useState<ThreeWayMatch[]>([])
  const [filteredMatches, setFilteredMatches] = useState<ThreeWayMatch[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ThreeWayMatchStatus | 'all'>('all')
  const [discrepancyFilter, setDiscrepancyFilter] = useState<'all' | 'with-discrepancies'>('all')
  const [selectedMatch, setSelectedMatch] = useState<ThreeWayMatch | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')

  // Mock data for demonstration
  useEffect(() => {
    const mockMatches: ThreeWayMatch[] = [
      {
        id: '1',
        matchNumber: '3WM-2025-001',
        purchaseOrderNumber: 'PO-2025-101',
        goodsReceiptNumber: 'GR-2025-201',
        invoiceNumber: 'INV-ABC-5678',
        vendorName: 'ABC Electrical Contractors',
        projectName: 'Downtown Tower',
        status: 'matched',
        lineItems: [
          {
            purchaseOrderLineId: '1',
            itemDescription: 'Electrical cable 12AWG',
            poQuantity: 1000,
            grQuantity: 1000,
            invoiceQuantity: 1000,
            poUnitPrice: 2.5,
            invoiceUnitPrice: 2.5,
            poLineTotal: 2500,
            invoiceLineTotal: 2500,
            quantityVariance: 0,
            priceVariance: 0,
            totalVariance: 0,
            discrepancies: [],
            matched: true,
          },
          {
            purchaseOrderLineId: '2',
            itemDescription: 'Junction boxes',
            poQuantity: 50,
            grQuantity: 50,
            invoiceQuantity: 50,
            poUnitPrice: 15,
            invoiceUnitPrice: 15,
            poLineTotal: 750,
            invoiceLineTotal: 750,
            quantityVariance: 0,
            priceVariance: 0,
            totalVariance: 0,
            discrepancies: [],
            matched: true,
          },
        ],
        poTotal: 3250,
        grTotal: 3250,
        invoiceTotal: 3250,
        totalVariance: 0,
        tolerancePercentage: 5,
        withinTolerance: true,
        hasDiscrepancies: false,
        createdAt: new Date('2025-10-10'),
        updatedAt: new Date('2025-10-10'),
      },
      {
        id: '2',
        matchNumber: '3WM-2025-002',
        purchaseOrderNumber: 'PO-2025-102',
        goodsReceiptNumber: 'GR-2025-202',
        invoiceNumber: 'INV-SUP-9012',
        vendorName: 'Superior Plumbing LLC',
        projectName: 'Downtown Tower',
        status: 'discrepancy',
        lineItems: [
          {
            purchaseOrderLineId: '1',
            itemDescription: 'Copper pipes 3/4"',
            poQuantity: 200,
            grQuantity: 195,
            invoiceQuantity: 200,
            poUnitPrice: 8.5,
            invoiceUnitPrice: 8.5,
            poLineTotal: 1700,
            invoiceLineTotal: 1700,
            quantityVariance: 5,
            priceVariance: 0,
            totalVariance: 42.5,
            discrepancies: ['quantity'],
            matched: false,
          },
          {
            purchaseOrderLineId: '2',
            itemDescription: 'Pipe fittings assorted',
            poQuantity: 100,
            grQuantity: 100,
            invoiceQuantity: 100,
            poUnitPrice: 3.2,
            invoiceUnitPrice: 3.8,
            poLineTotal: 320,
            invoiceLineTotal: 380,
            quantityVariance: 0,
            priceVariance: 0.6,
            totalVariance: 60,
            discrepancies: ['price', 'total'],
            matched: false,
          },
        ],
        poTotal: 2020,
        grTotal: 1985.5,
        invoiceTotal: 2080,
        totalVariance: 60,
        tolerancePercentage: 5,
        withinTolerance: false,
        hasDiscrepancies: true,
        createdAt: new Date('2025-10-12'),
        updatedAt: new Date('2025-10-12'),
      },
      {
        id: '3',
        matchNumber: '3WM-2025-003',
        purchaseOrderNumber: 'PO-2025-103',
        goodsReceiptNumber: 'GR-2025-203',
        invoiceNumber: 'INV-STL-3456',
        vendorName: 'Steel Frame Builders',
        projectName: 'Harbor Bridge',
        status: 'pending',
        lineItems: [
          {
            purchaseOrderLineId: '1',
            itemDescription: 'Structural I-beams W12x26',
            poQuantity: 50,
            grQuantity: 48,
            invoiceQuantity: 48,
            poUnitPrice: 450,
            invoiceUnitPrice: 465,
            poLineTotal: 22500,
            invoiceLineTotal: 22320,
            quantityVariance: 2,
            priceVariance: 15,
            totalVariance: 180,
            discrepancies: ['quantity', 'price'],
            matched: false,
          },
        ],
        poTotal: 22500,
        grTotal: 21600,
        invoiceTotal: 22320,
        totalVariance: 180,
        tolerancePercentage: 5,
        withinTolerance: true,
        hasDiscrepancies: true,
        createdAt: new Date('2025-10-14'),
        updatedAt: new Date('2025-10-14'),
      },
      {
        id: '4',
        matchNumber: '3WM-2025-004',
        purchaseOrderNumber: 'PO-2025-104',
        goodsReceiptNumber: 'GR-2025-204',
        invoiceNumber: 'INV-CON-7890',
        vendorName: 'Precision Concrete Services',
        projectName: 'Riverside Mall',
        status: 'approved',
        lineItems: [
          {
            purchaseOrderLineId: '1',
            itemDescription: 'Ready-mix concrete 3000 PSI',
            poQuantity: 150,
            grQuantity: 150,
            invoiceQuantity: 150,
            poUnitPrice: 120,
            invoiceUnitPrice: 118,
            poLineTotal: 18000,
            invoiceLineTotal: 17700,
            quantityVariance: 0,
            priceVariance: 2,
            totalVariance: 300,
            discrepancies: ['price', 'total'],
            matched: false,
          },
        ],
        poTotal: 18000,
        grTotal: 18000,
        invoiceTotal: 17700,
        totalVariance: 300,
        tolerancePercentage: 5,
        withinTolerance: true,
        hasDiscrepancies: true,
        reviewedBy: 'user-1',
        reviewedByName: 'John Doe',
        reviewedDate: new Date('2025-10-13'),
        reviewNotes: 'Vendor provided early payment discount',
        approvedBy: 'user-2',
        approvedByName: 'Jane Smith',
        approvedDate: new Date('2025-10-13'),
        createdAt: new Date('2025-10-11'),
        updatedAt: new Date('2025-10-13'),
      },
      {
        id: '5',
        matchNumber: '3WM-2025-005',
        purchaseOrderNumber: 'PO-2025-105',
        goodsReceiptNumber: 'GR-2025-205',
        invoiceNumber: 'INV-PAI-2345',
        vendorName: 'Elite Painting Contractors',
        projectName: 'Downtown Tower',
        status: 'rejected',
        lineItems: [
          {
            purchaseOrderLineId: '1',
            itemDescription: 'Premium interior paint - white',
            poQuantity: 100,
            grQuantity: 80,
            invoiceQuantity: 100,
            poUnitPrice: 45,
            invoiceUnitPrice: 52,
            poLineTotal: 4500,
            invoiceLineTotal: 5200,
            quantityVariance: 20,
            priceVariance: 7,
            totalVariance: 700,
            discrepancies: ['quantity', 'price', 'total'],
            matched: false,
          },
        ],
        poTotal: 4500,
        grTotal: 3600,
        invoiceTotal: 5200,
        totalVariance: 700,
        tolerancePercentage: 5,
        withinTolerance: false,
        hasDiscrepancies: true,
        reviewedBy: 'user-1',
        reviewedByName: 'John Doe',
        reviewedDate: new Date('2025-10-15'),
        rejectionReason: 'Invoice quantity does not match received quantity, and price increase was not authorized',
        createdAt: new Date('2025-10-14'),
        updatedAt: new Date('2025-10-15'),
      },
    ]

    setMatches(mockMatches)
    setFilteredMatches(mockMatches)
  }, [])

  // Filter matches
  useEffect(() => {
    let filtered = matches

    if (searchTerm) {
      filtered = filtered.filter(
        (match) =>
          match.matchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((match) => match.status === statusFilter)
    }

    if (discrepancyFilter === 'with-discrepancies') {
      filtered = filtered.filter((match) => match.hasDiscrepancies)
    }

    setFilteredMatches(filtered)
  }, [searchTerm, statusFilter, discrepancyFilter, matches])

  const getStatusIcon = (status: ThreeWayMatchStatus) => {
    switch (status) {
      case 'pending':
        return <FileText className="status-icon pending" />
      case 'matched':
        return <CheckCircle className="status-icon matched" />
      case 'discrepancy':
        return <AlertTriangle className="status-icon discrepancy" />
      case 'approved':
        return <ThumbsUp className="status-icon approved" />
      case 'rejected':
        return <ThumbsDown className="status-icon rejected" />
    }
  }

  const getStatusLabel = (status: ThreeWayMatchStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getVarianceIcon = (variance: number) => {
    if (variance === 0) return <Minus className="variance-icon neutral" />
    if (variance > 0) return <TrendingUp className="variance-icon negative" />
    return <TrendingDown className="variance-icon positive" />
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getVariancePercentage = (variance: number, total: number) => {
    if (total === 0) return 0
    return ((Math.abs(variance) / total) * 100).toFixed(2)
  }

  const handleViewDetails = (match: ThreeWayMatch) => {
    setSelectedMatch(match)
    setIsDetailsModalOpen(true)
  }

  const handleReview = (match: ThreeWayMatch) => {
    setSelectedMatch(match)
    setReviewNotes('')
    setIsReviewModalOpen(true)
  }

  const handleApprove = () => {
    if (!selectedMatch) return
    // In real implementation, this would call the service
    console.log('Approve match:', selectedMatch.id, 'with notes:', reviewNotes)
    setIsReviewModalOpen(false)
  }

  const handleReject = () => {
    if (!selectedMatch) return
    // In real implementation, this would call the service
    console.log('Reject match:', selectedMatch.id, 'with reason:', reviewNotes)
    setIsReviewModalOpen(false)
  }

  return (
    <div className="three-way-match">
      <div className="three-way-match-header">
        <div>
          <h1>Three-Way Match Review</h1>
          <p className="subtitle">
            Verify PO-GR-Invoice alignment and resolve discrepancies
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="match-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by match number, PO, invoice, vendor, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ThreeWayMatchStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="matched">Matched</option>
            <option value="discrepancy">Discrepancy</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={discrepancyFilter}
            onChange={(e) => setDiscrepancyFilter(e.target.value as 'all' | 'with-discrepancies')}
          >
            <option value="all">All Matches</option>
            <option value="with-discrepancies">With Discrepancies</option>
          </select>
        </div>
      </div>

      {/* Match Cards */}
      <div className="match-cards">
        {filteredMatches.map((match) => {
          const variancePct = getVariancePercentage(match.totalVariance, match.poTotal)

          return (
            <div key={match.id} className={`match-card ${match.hasDiscrepancies ? 'has-discrepancy' : ''}`}>
              <div className="match-card-header">
                <div className="match-title">
                  <FileText className="match-icon" />
                  <div>
                    <h3>{match.matchNumber}</h3>
                    <p className="match-meta">
                      {match.vendorName} • {match.projectName}
                    </p>
                  </div>
                </div>
                <div className="match-status">
                  {getStatusIcon(match.status)}
                  <span>{getStatusLabel(match.status)}</span>
                </div>
              </div>

              <div className="document-references">
                <div className="doc-ref">
                  <Package className="doc-icon" />
                  <div>
                    <span className="doc-label">PO</span>
                    <span className="doc-number">{match.purchaseOrderNumber}</span>
                  </div>
                </div>
                <div className="doc-ref">
                  <Receipt className="doc-icon" />
                  <div>
                    <span className="doc-label">GR</span>
                    <span className="doc-number">{match.goodsReceiptNumber}</span>
                  </div>
                </div>
                <div className="doc-ref">
                  <FileText className="doc-icon" />
                  <div>
                    <span className="doc-label">Invoice</span>
                    <span className="doc-number">{match.invoiceNumber}</span>
                  </div>
                </div>
              </div>

              <div className="match-summary">
                <div className="summary-row">
                  <span className="summary-label">PO Total:</span>
                  <span className="summary-value">{formatCurrency(match.poTotal)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Invoice Total:</span>
                  <span className="summary-value">{formatCurrency(match.invoiceTotal)}</span>
                </div>
                <div className="summary-row variance-row">
                  <span className="summary-label">Variance:</span>
                  <span className={`summary-value ${match.totalVariance !== 0 ? 'has-variance' : ''}`}>
                    {getVarianceIcon(match.totalVariance)}
                    {formatCurrency(Math.abs(match.totalVariance))}
                    {match.totalVariance !== 0 && (
                      <span className="variance-pct">({variancePct}%)</span>
                    )}
                  </span>
                </div>
              </div>

              {match.hasDiscrepancies && (
                <div className="discrepancy-banner">
                  <AlertTriangle className="banner-icon" />
                  <span>
                    {match.lineItems.filter((item) => !item.matched).length} line item(s) with discrepancies
                  </span>
                </div>
              )}

              {match.withinTolerance && match.totalVariance !== 0 && (
                <div className="tolerance-badge">
                  Within {match.tolerancePercentage}% tolerance
                </div>
              )}

              {match.reviewNotes && (
                <div className="review-notes">
                  <strong>Review Notes:</strong> {match.reviewNotes}
                </div>
              )}

              {match.rejectionReason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {match.rejectionReason}
                </div>
              )}

              <div className="match-actions">
                <Button variant="secondary" onClick={() => handleViewDetails(match)}>
                  <Eye className="button-icon" />
                  View Details
                </Button>
                {(match.status === 'pending' || match.status === 'discrepancy' || match.status === 'matched') && (
                  <Button onClick={() => handleReview(match)}>
                    <ThumbsUp className="button-icon" />
                    Review
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredMatches.length === 0 && (
        <div className="empty-state">
          <FileText className="empty-icon" />
          <h3>No matches found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedMatch && (
        <div className="modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="modal modal-xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedMatch.matchNumber} - Line Item Details</h2>
              <button
                className="modal-close"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>PO Qty</th>
                    <th>GR Qty</th>
                    <th>Inv Qty</th>
                    <th>PO Price</th>
                    <th>Inv Price</th>
                    <th>PO Total</th>
                    <th>Inv Total</th>
                    <th>Variance</th>
                    <th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMatch.lineItems.map((item, index) => (
                    <tr key={index} className={!item.matched ? 'has-discrepancy' : ''}>
                      <td>{item.itemDescription}</td>
                      <td>{item.poQuantity}</td>
                      <td className={item.quantityVariance !== 0 ? 'highlight' : ''}>
                        {item.grQuantity}
                      </td>
                      <td className={item.quantityVariance !== 0 ? 'highlight' : ''}>
                        {item.invoiceQuantity}
                      </td>
                      <td>{formatCurrency(item.poUnitPrice)}</td>
                      <td className={item.priceVariance !== 0 ? 'highlight' : ''}>
                        {formatCurrency(item.invoiceUnitPrice)}
                      </td>
                      <td>{formatCurrency(item.poLineTotal)}</td>
                      <td className={item.totalVariance !== 0 ? 'highlight' : ''}>
                        {formatCurrency(item.invoiceLineTotal)}
                      </td>
                      <td className={item.totalVariance !== 0 ? 'has-variance' : ''}>
                        {formatCurrency(Math.abs(item.totalVariance))}
                      </td>
                      <td>
                        {item.discrepancies.length > 0 ? (
                          <div className="discrepancy-badges">
                            {item.discrepancies.map((disc) => (
                              <span key={disc} className={`disc-badge ${disc}`}>
                                {disc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="matched-badge">✓ Matched</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && selectedMatch && (
        <div className="modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review {selectedMatch.matchNumber}</h2>
              <button
                className="modal-close"
                onClick={() => setIsReviewModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="review-summary">
                <div className="review-item">
                  <span className="label">Vendor:</span>
                  <span className="value">{selectedMatch.vendorName}</span>
                </div>
                <div className="review-item">
                  <span className="label">Total Variance:</span>
                  <span className={`value ${selectedMatch.totalVariance !== 0 ? 'has-variance' : ''}`}>
                    {formatCurrency(Math.abs(selectedMatch.totalVariance))}
                  </span>
                </div>
                <div className="review-item">
                  <span className="label">Within Tolerance:</span>
                  <span className={`value ${selectedMatch.withinTolerance ? 'success' : 'error'}`}>
                    {selectedMatch.withinTolerance ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="review-item">
                  <span className="label">Discrepancies:</span>
                  <span className="value">
                    {selectedMatch.lineItems.filter((item) => !item.matched).length} line item(s)
                  </span>
                </div>
              </div>

              <div className="review-notes-section">
                <label htmlFor="reviewNotes">Review Notes / Reason:</label>
                <textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter notes or reason for approval/rejection..."
                  rows={4}
                />
              </div>

              <div className="review-actions">
                <Button variant="secondary" onClick={handleReject}>
                  <ThumbsDown className="button-icon" />
                  Reject Match
                </Button>
                <Button onClick={handleApprove}>
                  <ThumbsUp className="button-icon" />
                  Approve Match
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
