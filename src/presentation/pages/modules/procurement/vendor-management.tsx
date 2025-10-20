import { useState, useEffect } from 'react'
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
} from 'lucide-react'
import { Button } from '../../../../shared/components/ui/button'
import './vendor-management.css'

type VendorStatus =
  | 'prequalifying'
  | 'qualified'
  | 'active'
  | 'suspended'
  | 'terminated'

type ComplianceDocumentType =
  | 'insurance-general-liability'
  | 'insurance-workers-comp'
  | 'insurance-auto'
  | 'license'
  | 'certification'
  | 'bond'
  | 'safety-manual'
  | 'training-record'
  | 'financial-statement'
  | 'reference'

type Vendor = {
  id: string
  companyName: string
  taxId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  address: string
  status: VendorStatus
  tradeSpecialties: string[]
  rating: number
  performanceMetrics: {
    onTimeCompletionRate: number
    qualityScore: number
    safetyScore: number
    complianceScore: number
    averagePaymentDays: number
    disputeCount: number
  }
  insuranceLimits: {
    generalLiability: number
    workersComp: number
    auto: number
  }
  bondingCapacity?: number
  paymentTerms: string
  totalDocuments: number
  verifiedDocuments: number
  expiringDocuments: number
  expiredDocuments: number
  createdAt: Date
  updatedAt: Date
}

type ComplianceDocument = {
  id: string
  type: ComplianceDocumentType
  documentName: string
  documentUrl: string
  issueDate: Date
  expiryDate?: Date
  verified: boolean
  verifiedBy?: string
  verifiedDate?: Date
  notes?: string
}

type SafetyRecord = {
  id: string
  recordDate: Date
  incidentType: 'injury' | 'near-miss' | 'violation' | 'observation'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  projectId?: string
  projectName?: string
  resolved: boolean
}

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all')
  const [tradeFilter, setTradeFilter] = useState<string>('all')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false)
  const [selectedVendorDocuments, setSelectedVendorDocuments] = useState<
    ComplianceDocument[]
  >([])
  const [selectedVendorSafety, setSelectedVendorSafety] = useState<
    SafetyRecord[]
  >([])

  // Mock data for demonstration
  useEffect(() => {
    const mockVendors: Vendor[] = [
      {
        id: '1',
        companyName: 'ABC Electrical Contractors',
        taxId: '12-3456789',
        contactName: 'John Smith',
        contactEmail: 'john@abcelectrical.com',
        contactPhone: '555-0101',
        address: '123 Industry St, City, ST 12345',
        status: 'active',
        tradeSpecialties: ['Electrical', 'Low Voltage'],
        rating: 4.5,
        performanceMetrics: {
          onTimeCompletionRate: 95,
          qualityScore: 92,
          safetyScore: 98,
          complianceScore: 100,
          averagePaymentDays: 28,
          disputeCount: 1,
        },
        insuranceLimits: {
          generalLiability: 2000000,
          workersComp: 1000000,
          auto: 1000000,
        },
        bondingCapacity: 5000000,
        paymentTerms: 'Net 30',
        totalDocuments: 12,
        verifiedDocuments: 12,
        expiringDocuments: 2,
        expiredDocuments: 0,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-12-01'),
      },
      {
        id: '2',
        companyName: 'Superior Plumbing LLC',
        taxId: '98-7654321',
        contactName: 'Mary Johnson',
        contactEmail: 'mary@superiorplumbing.com',
        contactPhone: '555-0202',
        address: '456 Trade Ave, City, ST 12345',
        status: 'active',
        tradeSpecialties: ['Plumbing', 'HVAC'],
        rating: 4.8,
        performanceMetrics: {
          onTimeCompletionRate: 98,
          qualityScore: 96,
          safetyScore: 100,
          complianceScore: 100,
          averagePaymentDays: 25,
          disputeCount: 0,
        },
        insuranceLimits: {
          generalLiability: 2000000,
          workersComp: 1000000,
          auto: 500000,
        },
        bondingCapacity: 3000000,
        paymentTerms: 'Net 30',
        totalDocuments: 10,
        verifiedDocuments: 10,
        expiringDocuments: 1,
        expiredDocuments: 0,
        createdAt: new Date('2022-08-20'),
        updatedAt: new Date('2024-11-28'),
      },
      {
        id: '3',
        companyName: 'Steel Frame Builders',
        taxId: '55-6677889',
        contactName: 'Robert Williams',
        contactEmail: 'robert@steelframe.com',
        contactPhone: '555-0303',
        address: '789 Builder Rd, City, ST 12345',
        status: 'qualified',
        tradeSpecialties: ['Structural Steel', 'Welding'],
        rating: 4.2,
        performanceMetrics: {
          onTimeCompletionRate: 90,
          qualityScore: 88,
          safetyScore: 95,
          complianceScore: 92,
          averagePaymentDays: 32,
          disputeCount: 2,
        },
        insuranceLimits: {
          generalLiability: 5000000,
          workersComp: 2000000,
          auto: 1000000,
        },
        bondingCapacity: 10000000,
        paymentTerms: 'Net 45',
        totalDocuments: 15,
        verifiedDocuments: 13,
        expiringDocuments: 3,
        expiredDocuments: 1,
        createdAt: new Date('2023-06-10'),
        updatedAt: new Date('2024-12-05'),
      },
      {
        id: '4',
        companyName: 'Precision Concrete Services',
        taxId: '33-4455667',
        contactName: 'Lisa Anderson',
        contactEmail: 'lisa@precisionconcrete.com',
        contactPhone: '555-0404',
        address: '321 Concrete Way, City, ST 12345',
        status: 'suspended',
        tradeSpecialties: ['Concrete', 'Formwork'],
        rating: 3.5,
        performanceMetrics: {
          onTimeCompletionRate: 78,
          qualityScore: 82,
          safetyScore: 75,
          complianceScore: 80,
          averagePaymentDays: 45,
          disputeCount: 5,
        },
        insuranceLimits: {
          generalLiability: 1000000,
          workersComp: 500000,
          auto: 500000,
        },
        paymentTerms: 'Net 30',
        totalDocuments: 8,
        verifiedDocuments: 5,
        expiringDocuments: 1,
        expiredDocuments: 2,
        createdAt: new Date('2022-03-15'),
        updatedAt: new Date('2024-10-20'),
      },
      {
        id: '5',
        companyName: 'Elite Painting Contractors',
        taxId: '77-8899001',
        contactName: 'David Martinez',
        contactEmail: 'david@elitepainting.com',
        contactPhone: '555-0505',
        address: '654 Painter Ln, City, ST 12345',
        status: 'prequalifying',
        tradeSpecialties: ['Painting', 'Drywall'],
        rating: 0,
        performanceMetrics: {
          onTimeCompletionRate: 0,
          qualityScore: 0,
          safetyScore: 100,
          complianceScore: 75,
          averagePaymentDays: 0,
          disputeCount: 0,
        },
        insuranceLimits: {
          generalLiability: 1000000,
          workersComp: 500000,
          auto: 500000,
        },
        paymentTerms: 'Net 30',
        totalDocuments: 6,
        verifiedDocuments: 4,
        expiringDocuments: 0,
        expiredDocuments: 0,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-12-01'),
      },
    ]

    setVendors(mockVendors)
    setFilteredVendors(mockVendors)
  }, [])

  // Filter vendors
  useEffect(() => {
    let filtered = vendors

    if (searchTerm) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.tradeSpecialties.some((trade) =>
            trade.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((vendor) => vendor.status === statusFilter)
    }

    if (tradeFilter !== 'all') {
      filtered = filtered.filter((vendor) =>
        vendor.tradeSpecialties.includes(tradeFilter),
      )
    }

    setFilteredVendors(filtered)
  }, [searchTerm, statusFilter, tradeFilter, vendors])

  const getStatusIcon = (status: VendorStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="vendor-status-icon active" />
      case 'qualified':
        return <Award className="vendor-status-icon qualified" />
      case 'prequalifying':
        return <Clock className="vendor-status-icon prequalifying" />
      case 'suspended':
        return <AlertCircle className="vendor-status-icon suspended" />
      case 'terminated':
        return <XCircle className="vendor-status-icon terminated" />
    }
  }

  const getStatusLabel = (status: VendorStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getComplianceStatus = (vendor: Vendor) => {
    if (vendor.expiredDocuments > 0) return 'expired'
    if (vendor.expiringDocuments > 0) return 'expiring'
    if (vendor.verifiedDocuments === vendor.totalDocuments) return 'compliant'
    return 'pending'
  }

  const getComplianceIcon = (vendor: Vendor) => {
    const status = getComplianceStatus(vendor)
    switch (status) {
      case 'compliant':
        return <Shield className="compliance-icon compliant" />
      case 'expiring':
        return <AlertCircle className="compliance-icon expiring" />
      case 'expired':
        return <XCircle className="compliance-icon expired" />
      case 'pending':
        return <Clock className="compliance-icon pending" />
    }
  }

  const getPerformanceTrend = (score: number) => {
    if (score >= 90) return <TrendingUp className="trend-icon positive" />
    if (score >= 70) return null
    return <TrendingDown className="trend-icon negative" />
  }

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDetailsModalOpen(true)
  }

  const handleViewDocuments = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    // Mock documents
    const mockDocs: ComplianceDocument[] = [
      {
        id: '1',
        type: 'insurance-general-liability',
        documentName: 'General Liability Insurance Certificate',
        documentUrl: '#',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        verified: true,
        verifiedBy: 'admin',
        verifiedDate: new Date('2024-01-02'),
      },
      {
        id: '2',
        type: 'insurance-workers-comp',
        documentName: "Workers' Compensation Insurance",
        documentUrl: '#',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        verified: true,
        verifiedBy: 'admin',
        verifiedDate: new Date('2024-01-02'),
      },
    ]
    setSelectedVendorDocuments(mockDocs)
    setIsDocumentsModalOpen(true)
  }

  const handleViewSafety = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    // Mock safety records
    const mockSafety: SafetyRecord[] = [
      {
        id: '1',
        recordDate: new Date('2024-11-15'),
        incidentType: 'near-miss',
        description: 'Worker nearly struck by falling object',
        severity: 'medium',
        projectId: 'proj-1',
        projectName: 'Downtown Tower',
        resolved: true,
      },
    ]
    setSelectedVendorSafety(mockSafety)
    setIsSafetyModalOpen(true)
  }

  const allTrades = Array.from(
    new Set(vendors.flatMap((v) => v.tradeSpecialties)),
  ).sort()

  return (
    <div className="vendor-management">
      <div className="vendor-management-header">
        <div>
          <h1>Vendor Management</h1>
          <p className="subtitle">
            Manage subcontractors, verify compliance, track performance
          </p>
        </div>
        <Button onClick={() => setIsAddVendorModalOpen(true)}>
          <Plus className="button-icon" />
          Add Vendor
        </Button>
      </div>

      {/* Filters */}
      <div className="vendor-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search vendors by name, contact, or trade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VendorStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="qualified">Qualified</option>
            <option value="prequalifying">Prequalifying</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>

          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
          >
            <option value="all">All Trades</option>
            {allTrades.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="vendor-cards">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="vendor-card">
            <div className="vendor-card-header">
              <div className="vendor-title">
                <Building2 className="vendor-icon" />
                <div>
                  <h3>{vendor.companyName}</h3>
                  <p className="vendor-contact">{vendor.contactName}</p>
                </div>
              </div>
              <div className="vendor-status">
                {getStatusIcon(vendor.status)}
                <span>{getStatusLabel(vendor.status)}</span>
              </div>
            </div>

            <div className="vendor-trades">
              {vendor.tradeSpecialties.map((trade) => (
                <span key={trade} className="trade-badge">
                  {trade}
                </span>
              ))}
            </div>

            <div className="vendor-metrics">
              <div className="metric">
                <span className="metric-label">Rating</span>
                <span className="metric-value">
                  {vendor.rating > 0 ? `${vendor.rating.toFixed(1)} ★` : 'N/A'}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">On-Time</span>
                <span className="metric-value">
                  {vendor.performanceMetrics.onTimeCompletionRate > 0
                    ? `${vendor.performanceMetrics.onTimeCompletionRate}%`
                    : 'N/A'}
                  {getPerformanceTrend(
                    vendor.performanceMetrics.onTimeCompletionRate,
                  )}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Quality</span>
                <span className="metric-value">
                  {vendor.performanceMetrics.qualityScore > 0
                    ? `${vendor.performanceMetrics.qualityScore}%`
                    : 'N/A'}
                  {getPerformanceTrend(vendor.performanceMetrics.qualityScore)}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Safety</span>
                <span className="metric-value">
                  {vendor.performanceMetrics.safetyScore}%
                  {getPerformanceTrend(vendor.performanceMetrics.safetyScore)}
                </span>
              </div>
            </div>

            <div className="vendor-compliance">
              {getComplianceIcon(vendor)}
              <div className="compliance-details">
                <span className="compliance-label">
                  {vendor.verifiedDocuments}/{vendor.totalDocuments} Documents
                  Verified
                </span>
                {vendor.expiringDocuments > 0 && (
                  <span className="compliance-warning">
                    {vendor.expiringDocuments} expiring soon
                  </span>
                )}
                {vendor.expiredDocuments > 0 && (
                  <span className="compliance-error">
                    {vendor.expiredDocuments} expired
                  </span>
                )}
              </div>
            </div>

            <div className="vendor-actions">
              <Button variant="secondary" onClick={() => handleViewDetails(vendor)}>
                <FileText className="button-icon" />
                Details
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleViewDocuments(vendor)}
              >
                <Shield className="button-icon" />
                Documents
              </Button>
              <Button variant="secondary" onClick={() => handleViewSafety(vendor)}>
                <AlertCircle className="button-icon" />
                Safety
              </Button>
              <Button variant="secondary">
                <Edit className="button-icon" />
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="empty-state">
          <Building2 className="empty-icon" />
          <h3>No vendors found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Vendor Modal */}
      {isAddVendorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddVendorModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Vendor</h2>
              <button
                className="modal-close"
                onClick={() => setIsAddVendorModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Add vendor form would go here...</p>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedVendor && (
        <div className="modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedVendor.companyName} - Details</h2>
              <button
                className="modal-close"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Contact Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Contact:</span>
                    <span>{selectedVendor.contactName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span>{selectedVendor.contactEmail}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span>{selectedVendor.contactPhone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span>{selectedVendor.address}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Insurance & Bonding</h3>
                  <div className="detail-row">
                    <span className="detail-label">General Liability:</span>
                    <span>
                      ${selectedVendor.insuranceLimits.generalLiability.toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Workers Comp:</span>
                    <span>
                      ${selectedVendor.insuranceLimits.workersComp.toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Auto:</span>
                    <span>
                      ${selectedVendor.insuranceLimits.auto.toLocaleString()}
                    </span>
                  </div>
                  {selectedVendor.bondingCapacity && (
                    <div className="detail-row">
                      <span className="detail-label">Bonding Capacity:</span>
                      <span>
                        ${selectedVendor.bondingCapacity.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {isDocumentsModalOpen && selectedVendor && (
        <div
          className="modal-overlay"
          onClick={() => setIsDocumentsModalOpen(false)}
        >
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedVendor.companyName} - Compliance Documents</h2>
              <button
                className="modal-close"
                onClick={() => setIsDocumentsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVendorDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.documentName}</td>
                      <td>{doc.type}</td>
                      <td>{doc.issueDate.toLocaleDateString()}</td>
                      <td>
                        {doc.expiryDate?.toLocaleDateString() ?? 'No expiry'}
                      </td>
                      <td>
                        {doc.verified ? (
                          <span className="status-badge verified">Verified</span>
                        ) : (
                          <span className="status-badge pending">Pending</span>
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

      {/* Safety Modal */}
      {isSafetyModalOpen && selectedVendor && (
        <div className="modal-overlay" onClick={() => setIsSafetyModalOpen(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedVendor.companyName} - Safety Records</h2>
              <button
                className="modal-close"
                onClick={() => setIsSafetyModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="safety-score">
                <h3>Safety Score: {selectedVendor.performanceMetrics.safetyScore}%</h3>
              </div>
              <table className="safety-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Severity</th>
                    <th>Project</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVendorSafety.map((record) => (
                    <tr key={record.id}>
                      <td>{record.recordDate.toLocaleDateString()}</td>
                      <td>{record.incidentType}</td>
                      <td>{record.description}</td>
                      <td>
                        <span className={`severity-badge ${record.severity}`}>
                          {record.severity}
                        </span>
                      </td>
                      <td>{record.projectName ?? 'N/A'}</td>
                      <td>
                        {record.resolved ? (
                          <span className="status-badge resolved">Resolved</span>
                        ) : (
                          <span className="status-badge open">Open</span>
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
    </div>
  )
}
