import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
  MapPin,
  User,
  Clock,
  Scan,
  Download,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import './cycle-count.css'

interface CycleCountItem {
  itemId: string
  itemName: string
  sku: string
  location: string
  expectedQuantity: number
  countedQuantity: number | null
  variance: number | null
  variancePercent: number | null
  status: 'pending' | 'counted' | 'variance' | 'approved'
}

interface CycleCount {
  id: string
  countNumber: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  location: string
  countType: 'full' | 'abc-a' | 'abc-b' | 'abc-c' | 'spot'
  scheduledDate: Date
  startedDate?: Date
  completedDate?: Date
  assignedTo: string
  items: CycleCountItem[]
  totalItems: number
  countedItems: number
  itemsWithVariance: number
  accuracy: number
  notes?: string
}

interface AccuracyMetrics {
  overallAccuracy: number
  accuracyTrend: 'up' | 'down' | 'stable'
  countsByMonth: Array<{
    month: string
    accuracy: number
    totalCounts: number
  }>
  varianceByCategory: Array<{
    category: string
    avgVariance: number
    count: number
  }>
  topVarianceItems: Array<{
    itemName: string
    sku: string
    variance: number
    frequency: number
  }>
}

export default function CycleCount() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<CycleCount[]>([])
  const [filteredCounts, setFilteredCounts] = useState<CycleCount[]>([])
  const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetrics | null>(null)
  
  const [view, setView] = useState<'list' | 'calendar' | 'count-entry' | 'metrics'>('list')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCountEntryModal, setShowCountEntryModal] = useState(false)
  const [selectedCount, setSelectedCount] = useState<CycleCount | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)

  useEffect(() => {
    loadCycleCounts()
  }, [])

  useEffect(() => {
    filterCounts()
  }, [counts, selectedStatus, searchTerm])

  const loadCycleCounts = async () => {
    setLoading(true)
    
    // Mock data
    const mockCounts: CycleCount[] = [
      {
        id: 'CC-001',
        countNumber: 'CC-2025-001',
        status: 'scheduled',
        location: 'Main Warehouse - Zone A',
        countType: 'abc-a',
        scheduledDate: new Date('2025-10-18'),
        assignedTo: 'John Smith',
        items: [
          { itemId: 'ITM-001', itemName: 'Portland Cement - Type I', sku: 'CEM-001', location: 'A-01-01', expectedQuantity: 500, countedQuantity: null, variance: null, variancePercent: null, status: 'pending' },
          { itemId: 'ITM-002', itemName: 'Rebar #4 - 20ft', sku: 'REB-004', location: 'A-01-02', expectedQuantity: 200, countedQuantity: null, variance: null, variancePercent: null, status: 'pending' }
        ],
        totalItems: 2,
        countedItems: 0,
        itemsWithVariance: 0,
        accuracy: 0
      },
      {
        id: 'CC-002',
        countNumber: 'CC-2025-002',
        status: 'in-progress',
        location: 'Main Warehouse - Zone B',
        countType: 'abc-b',
        scheduledDate: new Date('2025-10-16'),
        startedDate: new Date('2025-10-16T08:00:00'),
        assignedTo: 'Sarah Johnson',
        items: [
          { itemId: 'ITM-003', itemName: 'Lumber 2x4x8', sku: 'LUM-001', location: 'B-02-01', expectedQuantity: 1000, countedQuantity: 995, variance: -5, variancePercent: -0.5, status: 'variance' },
          { itemId: 'ITM-004', itemName: 'Electrical Wire - 12 AWG', sku: 'ELE-012', location: 'B-02-02', expectedQuantity: 5000, countedQuantity: 5000, variance: 0, variancePercent: 0, status: 'counted' },
          { itemId: 'ITM-005', itemName: 'PVC Pipe - 2" Schedule 40', sku: 'PVC-002', location: 'B-02-03', expectedQuantity: 300, countedQuantity: null, variance: null, variancePercent: null, status: 'pending' }
        ],
        totalItems: 3,
        countedItems: 2,
        itemsWithVariance: 1,
        accuracy: 66.67
      },
      {
        id: 'CC-003',
        countNumber: 'CC-2025-003',
        status: 'completed',
        location: 'Site A - Construction',
        countType: 'spot',
        scheduledDate: new Date('2025-10-14'),
        startedDate: new Date('2025-10-14T09:00:00'),
        completedDate: new Date('2025-10-14T11:30:00'),
        assignedTo: 'Tom Wilson',
        items: [
          { itemId: 'ITM-006', itemName: 'Safety Harness - Standard', sku: 'SAF-001', location: 'SITE-A-01', expectedQuantity: 50, countedQuantity: 48, variance: -2, variancePercent: -4.0, status: 'variance' },
          { itemId: 'ITM-007', itemName: 'Hard Hat - Class E', sku: 'SAF-002', location: 'SITE-A-02', expectedQuantity: 100, countedQuantity: 100, variance: 0, variancePercent: 0, status: 'counted' }
        ],
        totalItems: 2,
        countedItems: 2,
        itemsWithVariance: 1,
        accuracy: 50.0,
        notes: 'Missing harnesses found in tool trailer'
      }
    ]

    setCounts(mockCounts)

    // Mock accuracy metrics
    const mockMetrics: AccuracyMetrics = {
      overallAccuracy: 92.5,
      accuracyTrend: 'up',
      countsByMonth: [
        { month: 'Jun', accuracy: 88.5, totalCounts: 12 },
        { month: 'Jul', accuracy: 90.2, totalCounts: 15 },
        { month: 'Aug', accuracy: 91.8, totalCounts: 14 },
        { month: 'Sep', accuracy: 93.5, totalCounts: 16 },
        { month: 'Oct', accuracy: 92.5, totalCounts: 8 }
      ],
      varianceByCategory: [
        { category: 'Lumber', avgVariance: 2.5, count: 24 },
        { category: 'Electrical', avgVariance: 0.8, count: 18 },
        { category: 'Safety Equipment', avgVariance: 3.2, count: 15 },
        { category: 'Cement', avgVariance: 1.5, count: 20 }
      ],
      topVarianceItems: [
        { itemName: 'Lumber 2x4x8', sku: 'LUM-001', variance: 5.2, frequency: 8 },
        { itemName: 'Safety Harness - Standard', sku: 'SAF-001', variance: 4.5, frequency: 6 },
        { itemName: 'Rebar #4 - 20ft', sku: 'REB-004', variance: 3.8, frequency: 7 },
        { itemName: 'PVC Pipe - 2"', sku: 'PVC-002', variance: 2.9, frequency: 5 }
      ]
    }

    setAccuracyMetrics(mockMetrics)
    setLoading(false)
  }

  const filterCounts = () => {
    let filtered = [...counts]

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.countNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCounts(filtered)
  }

  const getStatusBadgeClass = (status: CycleCount['status']) => {
    const baseClass = 'status-badge'
    switch (status) {
      case 'scheduled': return `${baseClass} ${baseClass}--scheduled`
      case 'in-progress': return `${baseClass} ${baseClass}--in-progress`
      case 'completed': return `${baseClass} ${baseClass}--completed`
      case 'cancelled': return `${baseClass} ${baseClass}--cancelled`
      default: return baseClass
    }
  }

  const getCountTypeLabel = (type: CycleCount['countType']) => {
    switch (type) {
      case 'full': return 'Full Count'
      case 'abc-a': return 'ABC - Class A'
      case 'abc-b': return 'ABC - Class B'
      case 'abc-c': return 'ABC - Class C'
      case 'spot': return 'Spot Check'
      default: return type
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleStartCount = (count: CycleCount) => {
    setSelectedCount(count)
    setCurrentItemIndex(0)
    setShowCountEntryModal(true)
  }

  const handleViewDetails = (count: CycleCount) => {
    setSelectedCount(count)
    setShowDetailsModal(true)
  }

  const handleRecordCount = (quantity: number) => {
    if (!selectedCount) return

    const updatedItems = [...selectedCount.items]
    const currentItem = updatedItems[currentItemIndex]
    
    currentItem.countedQuantity = quantity
    currentItem.variance = quantity - currentItem.expectedQuantity
    currentItem.variancePercent = ((quantity - currentItem.expectedQuantity) / currentItem.expectedQuantity) * 100
    currentItem.status = currentItem.variance === 0 ? 'counted' : 'variance'

    const updatedCount = {
      ...selectedCount,
      items: updatedItems,
      countedItems: updatedItems.filter(i => i.countedQuantity !== null).length,
      itemsWithVariance: updatedItems.filter(i => i.variance !== 0 && i.variance !== null).length
    }

    setSelectedCount(updatedCount)

    // Move to next item or close if done
    if (currentItemIndex < updatedCount.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
    } else {
      setShowCountEntryModal(false)
      // Update counts list
      setCounts(counts.map(c => c.id === updatedCount.id ? updatedCount : c))
    }
  }

  if (loading) {
    return (
      <div className="cycle-count cycle-count--loading">
        <div className="spinner"></div>
        <p>Loading cycle counts...</p>
      </div>
    )
  }

  return (
    <div className="cycle-count">
      {/* Header */}
      <div className="cycle-count__header">
        <div className="header-left">
          <button
            className="cycle-count__button cycle-count__button--back"
            onClick={() => navigate('/inventory')}
            title="Back to Inventory"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">Cycle Count</h1>
          <p className="page-subtitle">Physical inventory counting and accuracy tracking</p>
        </div>
        <button className="btn btn--primary">
          <Plus size={20} />
          Schedule Count
        </button>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={`view-tab ${view === 'list' ? 'view-tab--active' : ''}`}
          onClick={() => setView('list')}
        >
          <Package size={18} />
          List View
        </button>
        <button
          className={`view-tab ${view === 'calendar' ? 'view-tab--active' : ''}`}
          onClick={() => setView('calendar')}
        >
          <Calendar size={18} />
          Schedule
        </button>
        <button
          className={`view-tab ${view === 'metrics' ? 'view-tab--active' : ''}`}
          onClick={() => setView('metrics')}
        >
          <BarChart3 size={18} />
          Accuracy Metrics
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search counts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="counts-list">
          <table className="counts-table">
            <thead>
              <tr>
                <th>Count #</th>
                <th>Status</th>
                <th>Location</th>
                <th>Type</th>
                <th>Date</th>
                <th>Progress</th>
                <th>Accuracy</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCounts.map(count => (
                <tr key={count.id} onClick={() => handleViewDetails(count)}>
                  <td>
                    <strong>{count.countNumber}</strong>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(count.status)}>
                      {count.status === 'in-progress' && <Clock size={14} />}
                      {count.status === 'completed' && <CheckCircle size={14} />}
                      {count.status === 'scheduled' && <Calendar size={14} />}
                      {count.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="location">
                      <MapPin size={14} />
                      {count.location}
                    </div>
                  </td>
                  <td>
                    <span className="count-type">{getCountTypeLabel(count.countType)}</span>
                  </td>
                  <td>{formatDate(count.scheduledDate)}</td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar__fill"
                        style={{ width: `${(count.countedItems / count.totalItems) * 100}%` }}
                      ></div>
                      <span className="progress-bar__label">
                        {count.countedItems}/{count.totalItems}
                      </span>
                    </div>
                  </td>
                  <td>
                    {count.status === 'completed' ? (
                      <span className={`accuracy ${count.accuracy >= 95 ? 'accuracy--good' : count.accuracy >= 85 ? 'accuracy--warning' : 'accuracy--poor'}`}>
                        {count.accuracy.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="accuracy accuracy--pending">-</span>
                    )}
                  </td>
                  <td>
                    <div className="user-info">
                      <User size={14} />
                      {count.assignedTo}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {count.status === 'scheduled' && (
                        <button
                          className="btn-icon btn-icon--primary"
                          onClick={(e) => { e.stopPropagation(); handleStartCount(count); }}
                          title="Start Count"
                        >
                          <Scan size={16} />
                        </button>
                      )}
                      {count.status === 'in-progress' && (
                        <button
                          className="btn-icon btn-icon--success"
                          onClick={(e) => { e.stopPropagation(); handleStartCount(count); }}
                          title="Continue Count"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Accuracy Metrics View */}
      {view === 'metrics' && accuracyMetrics && (
        <div className="accuracy-metrics">
          {/* Overall Accuracy */}
          <div className="metrics-summary">
            <div className="metric-card metric-card--large">
              <div className="metric-card__icon-wrapper metric-card__icon-wrapper--primary">
                <BarChart3 size={32} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Overall Accuracy</span>
                <span className="metric-card__value">{accuracyMetrics.overallAccuracy}%</span>
                <span className={`metric-card__trend ${accuracyMetrics.accuracyTrend === 'up' ? 'trend--up' : 'trend--down'}`}>
                  {accuracyMetrics.accuracyTrend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {accuracyMetrics.accuracyTrend === 'up' ? '+' : '-'}2.3% vs last month
                </span>
              </div>
            </div>
          </div>

          {/* Accuracy Trend Chart */}
          <div className="chart-section">
            <h3>Accuracy Trend (6 Months)</h3>
            <div className="line-chart">
              {accuracyMetrics.countsByMonth.map((data, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="chart-bar__fill"
                    style={{ height: `${data.accuracy}%` }}
                  >
                    <span className="chart-bar__value">{data.accuracy}%</span>
                  </div>
                  <span className="chart-bar__label">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Variance by Category */}
          <div className="variance-section">
            <h3>Average Variance by Category</h3>
            <table className="variance-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Avg Variance (%)</th>
                  <th>Count Frequency</th>
                </tr>
              </thead>
              <tbody>
                {accuracyMetrics.varianceByCategory.map((cat, index) => (
                  <tr key={index}>
                    <td><strong>{cat.category}</strong></td>
                    <td>
                      <span className={`variance ${cat.avgVariance > 3 ? 'variance--high' : 'variance--low'}`}>
                        {cat.avgVariance}%
                      </span>
                    </td>
                    <td>{cat.count} counts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Variance Items */}
          <div className="top-variance-section">
            <h3>Items with Highest Variance</h3>
            <table className="variance-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Avg Variance (%)</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {accuracyMetrics.topVarianceItems.map((item, index) => (
                  <tr key={index}>
                    <td><strong>{item.itemName}</strong></td>
                    <td>{item.sku}</td>
                    <td>
                      <span className="variance variance--high">
                        <AlertTriangle size={14} />
                        {item.variance}%
                      </span>
                    </td>
                    <td>{item.frequency} times</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Count Entry Modal */}
      {showCountEntryModal && selectedCount && (
        <div className="modal-overlay" onClick={() => setShowCountEntryModal(false)}>
          <div className="modal-content modal-content--count-entry" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Count Entry</h2>
                <p className="modal-subtitle">
                  {selectedCount.countNumber} - Item {currentItemIndex + 1} of {selectedCount.items.length}
                </p>
              </div>
              <button className="btn-close" onClick={() => setShowCountEntryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedCount.items[currentItemIndex] && (
                <div className="count-entry">
                  <div className="item-info">
                    <Package size={48} className="item-icon" />
                    <div className="item-details">
                      <h3>{selectedCount.items[currentItemIndex].itemName}</h3>
                      <p className="item-sku">{selectedCount.items[currentItemIndex].sku}</p>
                      <div className="item-location">
                        <MapPin size={14} />
                        {selectedCount.items[currentItemIndex].location}
                      </div>
                    </div>
                  </div>

                  <div className="expected-quantity">
                    <span className="label">Expected Quantity:</span>
                    <span className="value">{selectedCount.items[currentItemIndex].expectedQuantity}</span>
                  </div>

                  <div className="scan-section">
                    <button className="btn btn--scan">
                      <Scan size={24} />
                      Scan Barcode
                    </button>
                    <span className="divider">or</span>
                    <div className="manual-entry">
                      <label>Manual Count</label>
                      <input
                        type="number"
                        placeholder="Enter quantity"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = parseInt((e.target as HTMLInputElement).value)
                            if (!isNaN(value)) {
                              handleRecordCount(value)
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="count-actions">
                    <button className="btn btn--secondary" onClick={() => setShowCountEntryModal(false)}>
                      Cancel
                    </button>
                    <button 
                      className="btn btn--primary"
                      onClick={() => {
                        const input = document.querySelector('.manual-entry input') as HTMLInputElement
                        const value = parseInt(input?.value || '0')
                        if (!isNaN(value)) {
                          handleRecordCount(value)
                        }
                      }}
                    >
                      Record Count
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCount && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cycle Count Details</h2>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="count-details">
                <div className="detail-section">
                  <h3>Count Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Count Number:</span>
                      <strong>{selectedCount.countNumber}</strong>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={getStatusBadgeClass(selectedCount.status)}>
                        {selectedCount.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span>{selectedCount.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span>{getCountTypeLabel(selectedCount.countType)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Assigned To:</span>
                      <span>{selectedCount.assignedTo}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Scheduled:</span>
                      <span>{formatDate(selectedCount.scheduledDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Items ({selectedCount.totalItems})</h3>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Location</th>
                        <th>Expected</th>
                        <th>Counted</th>
                        <th>Variance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCount.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div>
                              <strong>{item.itemName}</strong>
                              <div className="item-sku">{item.sku}</div>
                            </div>
                          </td>
                          <td>{item.location}</td>
                          <td>{item.expectedQuantity}</td>
                          <td>{item.countedQuantity ?? '-'}</td>
                          <td>
                            {item.variance !== null && (
                              <span className={`variance ${item.variance === 0 ? 'variance--zero' : 'variance--nonzero'}`}>
                                {item.variance > 0 ? '+' : ''}{item.variance}
                                {item.variancePercent !== null && ` (${item.variancePercent.toFixed(1)}%)`}
                              </span>
                            )}
                          </td>
                          <td>
                            {item.status === 'counted' && <CheckCircle size={16} className="status-icon status-icon--success" />}
                            {item.status === 'variance' && <AlertTriangle size={16} className="status-icon status-icon--warning" />}
                            {item.status === 'pending' && <Clock size={16} className="status-icon status-icon--muted" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedCount.notes && (
                  <div className="detail-section">
                    <h3>Notes</h3>
                    <p>{selectedCount.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              {selectedCount.status === 'completed' && (
                <button className="btn btn--primary">
                  <Download size={18} />
                  Export Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
