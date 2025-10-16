import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  AlertCircle,
  FileText,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Shield
} from 'lucide-react'
import './batch-tracking.css'

interface Batch {
  id: string
  batchNumber: string
  lotNumber: string
  itemId: string
  itemName: string
  sku: string
  quantity: number
  unit: string
  manufacturedDate: Date
  expirationDate: Date
  location: string
  supplier: string
  status: 'active' | 'expiring-soon' | 'expired' | 'recalled'
  certificates: Certificate[]
  usageHistory: UsageRecord[]
}

interface Certificate {
  id: string
  name: string
  type: 'coa' | 'msds' | 'compliance' | 'testing'
  issueDate: Date
  fileUrl: string
}

interface UsageRecord {
  id: string
  date: Date
  quantity: number
  type: 'issued' | 'returned' | 'adjusted'
  reference: string
  user: string
}

interface AllocationResult {
  batchNumber: string
  availableQty: number
  allocatedQty: number
  expirationDate: Date
  daysUntilExpiry: number
}

type AllocationStrategy = 'fifo' | 'fefo'

export default function BatchTracking() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [allocationStrategy, setAllocationStrategy] = useState<AllocationStrategy>('fefo')
  const [allocationQty, setAllocationQty] = useState<number>(100)
  const [allocationResults, setAllocationResults] = useState<AllocationResult[]>([])
  const [showRecallReport, setShowRecallReport] = useState(false)

  useEffect(() => {
    loadBatches()
  }, [])

  useEffect(() => {
    filterBatches()
  }, [batches, searchTerm, statusFilter])

  const loadBatches = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      const mockBatches: Batch[] = [
        {
          id: '1',
          batchNumber: 'BTH-2024-001',
          lotNumber: 'LOT-2024-A',
          itemId: 'item-1',
          itemName: 'Portland Cement Type I',
          sku: 'CEM-001',
          quantity: 450,
          unit: 'bags',
          manufacturedDate: new Date('2024-08-15'),
          expirationDate: new Date('2025-02-15'),
          location: 'Warehouse A - Zone 1',
          supplier: 'BuildRight Supply',
          status: 'expiring-soon',
          certificates: [
            { id: 'c1', name: 'Certificate of Analysis', type: 'coa', issueDate: new Date('2024-08-15'), fileUrl: '#' },
            { id: 'c2', name: 'MSDS Document', type: 'msds', issueDate: new Date('2024-08-15'), fileUrl: '#' }
          ],
          usageHistory: [
            { id: 'u1', date: new Date('2024-10-01'), quantity: 50, type: 'issued', reference: 'REQ-1001', user: 'John Smith' },
            { id: 'u2', date: new Date('2024-10-10'), quantity: 25, type: 'issued', reference: 'REQ-1002', user: 'Sarah Jones' }
          ]
        },
        {
          id: '2',
          batchNumber: 'BTH-2024-002',
          lotNumber: 'LOT-2024-B',
          itemId: 'item-2',
          itemName: 'Steel Rebar #4',
          sku: 'REB-001',
          quantity: 850,
          unit: 'pieces',
          manufacturedDate: new Date('2024-09-01'),
          expirationDate: new Date('2027-09-01'),
          location: 'Warehouse B - Zone 3',
          supplier: 'American Steel Co.',
          status: 'active',
          certificates: [
            { id: 'c3', name: 'Mill Test Certificate', type: 'testing', issueDate: new Date('2024-09-01'), fileUrl: '#' },
            { id: 'c4', name: 'Compliance Certificate', type: 'compliance', issueDate: new Date('2024-09-01'), fileUrl: '#' }
          ],
          usageHistory: []
        },
        {
          id: '3',
          batchNumber: 'BTH-2023-045',
          lotNumber: 'LOT-2023-Z',
          itemId: 'item-3',
          itemName: 'Safety Harness - Full Body',
          sku: 'SAF-045',
          quantity: 12,
          unit: 'units',
          manufacturedDate: new Date('2023-11-20'),
          expirationDate: new Date('2024-11-20'),
          location: 'Warehouse A - Zone 5',
          supplier: 'SafetyFirst Inc.',
          status: 'expired',
          certificates: [
            { id: 'c5', name: 'Safety Compliance', type: 'compliance', issueDate: new Date('2023-11-20'), fileUrl: '#' }
          ],
          usageHistory: [
            { id: 'u3', date: new Date('2024-06-15'), quantity: 8, type: 'issued', reference: 'REQ-0890', user: 'Mike Davis' }
          ]
        },
        {
          id: '4',
          batchNumber: 'BTH-2024-015',
          lotNumber: 'LOT-2024-C',
          itemId: 'item-4',
          itemName: 'Hydraulic Fluid ISO 46',
          sku: 'HYD-012',
          quantity: 240,
          unit: 'liters',
          manufacturedDate: new Date('2024-07-10'),
          expirationDate: new Date('2025-01-10'),
          location: 'Warehouse A - Zone 2',
          supplier: 'Industrial Fluids Ltd.',
          status: 'expiring-soon',
          certificates: [
            { id: 'c6', name: 'Product Analysis', type: 'testing', issueDate: new Date('2024-07-10'), fileUrl: '#' }
          ],
          usageHistory: [
            { id: 'u4', date: new Date('2024-09-20'), quantity: 60, type: 'issued', reference: 'REQ-0995', user: 'Lisa Chen' }
          ]
        }
      ]
      setBatches(mockBatches)
      setLoading(false)
    }, 800)
  }

  const filterBatches = () => {
    let filtered = [...batches]

    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(batch => batch.status === statusFilter)
    }

    setFilteredBatches(filtered)
  }

  const getBatchStatus = (batch: Batch): { label: string; className: string } => {
    const today = new Date()
    const daysUntilExpiry = Math.ceil((batch.expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (batch.status === 'recalled') {
      return { label: 'Recalled', className: 'status-recalled' }
    }

    if (daysUntilExpiry < 0) {
      return { label: 'Expired', className: 'status-expired' }
    }

    if (daysUntilExpiry <= 30) {
      return { label: `Expires in ${daysUntilExpiry} days`, className: 'status-expiring' }
    }

    return { label: 'Active', className: 'status-active' }
  }

  const generateAllocation = () => {
    const today = new Date()
    let remainingQty = allocationQty
    const results: AllocationResult[] = []

    // Sort batches based on strategy
    const sortedBatches = [...batches].filter(b => b.status === 'active' || b.status === 'expiring-soon').sort((a, b) => {
      if (allocationStrategy === 'fefo') {
        return a.expirationDate.getTime() - b.expirationDate.getTime()
      } else {
        return a.manufacturedDate.getTime() - b.manufacturedDate.getTime()
      }
    })

    for (const batch of sortedBatches) {
      if (remainingQty <= 0) break

      const allocQty = Math.min(batch.quantity, remainingQty)
      const daysUntilExpiry = Math.ceil((batch.expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      results.push({
        batchNumber: batch.batchNumber,
        availableQty: batch.quantity,
        allocatedQty: allocQty,
        expirationDate: batch.expirationDate,
        daysUntilExpiry
      })

      remainingQty -= allocQty
    }

    setAllocationResults(results)
  }

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getBatchesExpiringOnDate = (date: Date): Batch[] => {
    return batches.filter(batch => {
      const expDate = new Date(batch.expirationDate)
      return expDate.getDate() === date.getDate() &&
        expDate.getMonth() === date.getMonth() &&
        expDate.getFullYear() === date.getFullYear()
    })
  }

  const downloadCertificate = (cert: Certificate) => {
    // Simulate download
    console.log('Downloading certificate:', cert.name)
  }

  const generateRecallReport = () => {
    setShowRecallReport(true)
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  if (loading) {
    return (
      <div className="batch-tracking batch-tracking--loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="batch-tracking">
      <div className="batch-tracking__header">
        <div className="batch-tracking__header-left">
          <div>
            <div className="batch-tracking__label">BATCH & LOT TRACKING</div>
            <h1 className="batch-tracking__title">Batch Tracking</h1>
          </div>
        </div>
        <div className="batch-tracking__header-actions">
          <button className="batch-tracking__button batch-tracking__button--secondary" onClick={generateRecallReport}>
            <AlertCircle size={18} />
            Generate Recall Report
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="batch-tracking__filters">
        <div className="batch-tracking__search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by batch, lot, item name, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="batch-tracking__search-input"
          />
        </div>
        <div className="batch-tracking__filter-group">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="batch-tracking__select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring-soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="recalled">Recalled</option>
          </select>
        </div>
      </div>

      <div className="batch-tracking__content">
        {/* Expiration Calendar */}
        <div className="batch-tracking__section batch-tracking__section--calendar">
          <div className="batch-tracking__section-header">
            <h2 className="batch-tracking__section-title">Expiration Calendar</h2>
            <div className="calendar-nav">
              <button
                className="calendar-nav__button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="calendar-nav__label">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                className="calendar-nav__button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="expiration-calendar">
            <div className="expiration-calendar__header">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="expiration-calendar__day-label">{day}</div>
              ))}
            </div>
            <div className="expiration-calendar__grid">
              {getCalendarDays().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="expiration-calendar__day expiration-calendar__day--empty"></div>
                }

                const expiringBatches = getBatchesExpiringOnDate(date)
                const hasExpiring = expiringBatches.length > 0

                return (
                  <div
                    key={date.toISOString()}
                    className={`expiration-calendar__day ${hasExpiring ? 'expiration-calendar__day--has-batches' : ''}`}
                  >
                    <div className="expiration-calendar__day-number">{date.getDate()}</div>
                    {hasExpiring && (
                      <div className="expiration-calendar__batch-indicator">
                        <div className="batch-dot"></div>
                        <span className="batch-count">{expiringBatches.length}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="calendar-legend">
            <div className="calendar-legend__item">
              <div className="calendar-legend__dot calendar-legend__dot--expiring"></div>
              <span>Batches Expiring</span>
            </div>
          </div>
        </div>

        {/* Batch List */}
        <div className="batch-tracking__section">
          <div className="batch-tracking__section-header">
            <h2 className="batch-tracking__section-title">
              Batches ({filteredBatches.length})
            </h2>
          </div>

          <div className="batch-list">
            {filteredBatches.map(batch => {
              const status = getBatchStatus(batch)
              return (
                <div
                  key={batch.id}
                  className="batch-card"
                  onClick={() => setSelectedBatch(batch)}
                >
                  <div className="batch-card__header">
                    <div>
                      <div className="batch-card__batch-number">{batch.batchNumber}</div>
                      <div className="batch-card__item-name">{batch.itemName}</div>
                    </div>
                    <span className={`batch-card__status ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="batch-card__details">
                    <div className="batch-card__detail">
                      <span className="label">Lot:</span>
                      <span className="value">{batch.lotNumber}</span>
                    </div>
                    <div className="batch-card__detail">
                      <span className="label">Quantity:</span>
                      <span className="value">{batch.quantity} {batch.unit}</span>
                    </div>
                    <div className="batch-card__detail">
                      <span className="label">Location:</span>
                      <span className="value">{batch.location}</span>
                    </div>
                    <div className="batch-card__detail">
                      <span className="label">Expires:</span>
                      <span className="value">{formatDate(batch.expirationDate)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FIFO/FEFO Allocation */}
      <div className="batch-tracking__section">
        <div className="batch-tracking__section-header">
          <h2 className="batch-tracking__section-title">Allocation Visualizer</h2>
        </div>

        <div className="allocation-panel">
          <div className="allocation-controls">
            <div className="allocation-control">
              <label>Strategy:</label>
              <select
                value={allocationStrategy}
                onChange={(e) => setAllocationStrategy(e.target.value as AllocationStrategy)}
                className="batch-tracking__select"
              >
                <option value="fifo">FIFO (First In, First Out)</option>
                <option value="fefo">FEFO (First Expired, First Out)</option>
              </select>
            </div>
            <div className="allocation-control">
              <label>Quantity Needed:</label>
              <input
                type="number"
                value={allocationQty}
                onChange={(e) => setAllocationQty(Number(e.target.value))}
                className="allocation-input"
              />
            </div>
            <button
              className="batch-tracking__button batch-tracking__button--primary"
              onClick={generateAllocation}
            >
              <TrendingUp size={18} />
              Calculate Allocation
            </button>
          </div>

          {allocationResults.length > 0 && (
            <div className="allocation-results">
              <h3 className="allocation-results__title">Allocation Results</h3>
              <div className="allocation-table">
                <table>
                  <thead>
                    <tr>
                      <th>Batch Number</th>
                      <th>Available</th>
                      <th>Allocated</th>
                      <th>Expiration Date</th>
                      <th>Days Until Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationResults.map((result, index) => (
                      <tr key={index}>
                        <td className="batch-number">{result.batchNumber}</td>
                        <td>{result.availableQty}</td>
                        <td className="allocated-qty">{result.allocatedQty}</td>
                        <td>{formatDate(result.expirationDate)}</td>
                        <td className={result.daysUntilExpiry <= 30 ? 'expiring-soon' : ''}>
                          {result.daysUntilExpiry} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Details Modal */}
      {selectedBatch && (
        <div className="batch-modal-overlay" onClick={() => setSelectedBatch(null)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="batch-modal__header">
              <h2>Batch Details</h2>
              <button className="batch-modal__close" onClick={() => setSelectedBatch(null)}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="batch-modal__content">
              <div className="batch-modal__section">
                <h3>Basic Information</h3>
                <div className="batch-modal__grid">
                  <div className="batch-modal__field">
                    <label>Batch Number:</label>
                    <span>{selectedBatch.batchNumber}</span>
                  </div>
                  <div className="batch-modal__field">
                    <label>Lot Number:</label>
                    <span>{selectedBatch.lotNumber}</span>
                  </div>
                  <div className="batch-modal__field">
                    <label>Item:</label>
                    <span>{selectedBatch.itemName}</span>
                  </div>
                  <div className="batch-modal__field">
                    <label>SKU:</label>
                    <span>{selectedBatch.sku}</span>
                  </div>
                  <div className="batch-modal__field">
                    <label>Quantity:</label>
                    <span>{selectedBatch.quantity} {selectedBatch.unit}</span>
                  </div>
                  <div className="batch-modal__field">
                    <label>Location:</label>
                    <span>{selectedBatch.location}</span>
                  </div>
                  <div className="batch-modal__field">
                    <label>Manufactured:</label>
                    <span>{formatDate(selectedBatch.manufacturedDate)}</span>
                  </div>
                  <div className="batch-modal__field">
                    <label>Expiration:</label>
                    <span>{formatDate(selectedBatch.expirationDate)}</span>
                  </div>
                </div>
              </div>

              <div className="batch-modal__section">
                <h3>
                  <Shield size={18} />
                  Certificates & Compliance
                </h3>
                <div className="certificates-list">
                  {selectedBatch.certificates.map(cert => (
                    <div key={cert.id} className="certificate-item">
                      <div className="certificate-item__icon">
                        <FileText size={20} />
                      </div>
                      <div className="certificate-item__content">
                        <div className="certificate-item__name">{cert.name}</div>
                        <div className="certificate-item__meta">
                          {cert.type.toUpperCase()} • Issued {formatDate(cert.issueDate)}
                        </div>
                      </div>
                      <button
                        className="certificate-item__download"
                        onClick={() => downloadCertificate(cert)}
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="batch-modal__section">
                <h3>
                  <Clock size={18} />
                  Usage History
                </h3>
                <div className="usage-timeline">
                  {selectedBatch.usageHistory.map(record => (
                    <div key={record.id} className="usage-record">
                      <div className="usage-record__icon">
                        {record.type === 'issued' ? <Package size={16} /> : <CheckCircle size={16} />}
                      </div>
                      <div className="usage-record__content">
                        <div className="usage-record__description">
                          {record.type === 'issued' ? 'Issued' : record.type === 'returned' ? 'Returned' : 'Adjusted'} {record.quantity} {selectedBatch.unit}
                        </div>
                        <div className="usage-record__meta">
                          {formatDate(record.date)} • {record.reference} • {record.user}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedBatch.usageHistory.length === 0 && (
                    <div className="usage-record usage-record--empty">
                      No usage history available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recall Report Modal */}
      {showRecallReport && (
        <div className="batch-modal-overlay" onClick={() => setShowRecallReport(false)}>
          <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="batch-modal__header">
              <h2>Recall Report Generator</h2>
              <button className="batch-modal__close" onClick={() => setShowRecallReport(false)}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="batch-modal__content">
              <div className="recall-report">
                <div className="recall-report__info">
                  <AlertCircle size={48} className="recall-report__icon" />
                  <h3>Generate Recall Report</h3>
                  <p>Select batches to include in the recall report. The report will include affected items, locations, and traceability information.</p>
                </div>

                <div className="recall-report__batches">
                  {batches.filter(b => b.status === 'expired' || b.status === 'recalled').map(batch => (
                    <div key={batch.id} className="recall-batch-item">
                      <input type="checkbox" id={`recall-${batch.id}`} />
                      <label htmlFor={`recall-${batch.id}`}>
                        <div className="recall-batch-item__info">
                          <div className="recall-batch-item__batch">{batch.batchNumber}</div>
                          <div className="recall-batch-item__item">{batch.itemName}</div>
                          <div className="recall-batch-item__location">{batch.location}</div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="recall-report__actions">
                  <button className="batch-tracking__button batch-tracking__button--secondary" onClick={() => setShowRecallReport(false)}>
                    Cancel
                  </button>
                  <button className="batch-tracking__button batch-tracking__button--primary">
                    <Download size={18} />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
