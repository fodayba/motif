import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  Download,
  DollarSign,
  Filter,
  TrendingDown,
  TrendingUp,
  Zap,
  ArrowLeft,
} from 'lucide-react'
import './utilization-reports.css'

// ============================================================================
// Types
// ============================================================================

interface EquipmentUtilizationReport {
  equipmentId: string
  assetNumber: string
  name: string
  totalHoursUsed: number
  averageHoursPerDay: number
  utilizationRate: number
  idleTimeHours: number
  costPerHour: number
  lastUsedDate?: Date
}

type SortField =
  | 'name'
  | 'utilizationRate'
  | 'totalHoursUsed'
  | 'idleTimeHours'
  | 'costPerHour'
  | 'lastUsedDate'

type SortDirection = 'asc' | 'desc'

type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'custom'

// ============================================================================
// Helper Functions
// ============================================================================

function formatNumber(value: number, decimals: number = 0): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeDate(date: Date): string {
  const days = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

function getUtilizationColor(rate: number): string {
  if (rate >= 0.75) return 'success'
  if (rate >= 0.5) return 'warning'
  return 'danger'
}

function getUtilizationLabel(rate: number): string {
  if (rate >= 0.75) return 'Excellent'
  if (rate >= 0.5) return 'Good'
  if (rate >= 0.25) return 'Fair'
  return 'Poor'
}

// ============================================================================
// Mock Data Generation
// ============================================================================

function generateMockReports(): EquipmentUtilizationReport[] {
  const equipmentTypes = [
    'CAT 320 Excavator',
    'John Deere 644 Loader',
    'Komatsu D65 Dozer',
    'Volvo A40G Truck',
    'Bobcat S650 Skid Steer',
    'JCB 3CX Backhoe',
    'Liebherr LTM 1090 Crane',
    'Wirtgen W 210 Milling Machine',
  ]

  const reports: EquipmentUtilizationReport[] = []

  equipmentTypes.forEach((type, index) => {
    for (let i = 1; i <= 3; i++) {
      const assetNumber = `${String.fromCharCode(65 + index)}${String(i).padStart(2, '0')}`
      const totalHours = 500 + Math.random() * 2000
      const utilizationRate = 0.3 + Math.random() * 0.6
      const avgHoursPerDay = 4 + Math.random() * 6
      const idleHours = 200 + Math.random() * 800
      const costPerHour = 50 + Math.random() * 150
      const daysAgo = Math.floor(Math.random() * 30)

      reports.push({
        equipmentId: `eq-${index}-${i}`,
        assetNumber,
        name: `${type} #${assetNumber}`,
        totalHoursUsed: totalHours,
        averageHoursPerDay: avgHoursPerDay,
        utilizationRate,
        idleTimeHours: idleHours,
        costPerHour,
        lastUsedDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      })
    }
  })

  return reports
}

// ============================================================================
// Main Component
// ============================================================================

export function UtilizationReports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<EquipmentUtilizationReport[]>([])
  const [sortField, setSortField] = useState<SortField>('utilizationRate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [utilizationFilter, setUtilizationFilter] = useState<'all' | 'high' | 'medium' | 'low'>(
    'all'
  )

  // Load data
  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = () => {
    // TODO: Replace with actual EquipmentService.getUtilizationReport() call
    const mockData = generateMockReports()
    setReports(mockData)
  }

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = reports

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) || r.assetNumber.toLowerCase().includes(query)
      )
    }

    // Utilization filter
    if (utilizationFilter !== 'all') {
      filtered = filtered.filter((r) => {
        if (utilizationFilter === 'high') return r.utilizationRate >= 0.75
        if (utilizationFilter === 'medium')
          return r.utilizationRate >= 0.5 && r.utilizationRate < 0.75
        if (utilizationFilter === 'low') return r.utilizationRate < 0.5
        return true
      })
    }

    return filtered
  }, [reports, searchQuery, utilizationFilter])

  // Sort reports
  const sortedReports = useMemo(() => {
    const sorted = [...filteredReports]

    sorted.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle Date objects
      if (sortField === 'lastUsedDate') {
        aValue = a.lastUsedDate?.getTime() ?? 0
        bValue = b.lastUsedDate?.getTime() ?? 0
      }

      // Handle string comparison
      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Handle number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

    return sorted
  }, [filteredReports, sortField, sortDirection])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (filteredReports.length === 0) {
      return {
        totalEquipment: 0,
        avgUtilization: 0,
        totalHoursUsed: 0,
        totalIdleHours: 0,
        avgCostPerHour: 0,
        highUtilization: 0,
        mediumUtilization: 0,
        lowUtilization: 0,
      }
    }

    const totalHours = filteredReports.reduce((sum, r) => sum + r.totalHoursUsed, 0)
    const totalIdle = filteredReports.reduce((sum, r) => sum + r.idleTimeHours, 0)
    const avgUtil =
      filteredReports.reduce((sum, r) => sum + r.utilizationRate, 0) / filteredReports.length
    const avgCost =
      filteredReports.reduce((sum, r) => sum + r.costPerHour, 0) / filteredReports.length

    return {
      totalEquipment: filteredReports.length,
      avgUtilization: avgUtil,
      totalHoursUsed: totalHours,
      totalIdleHours: totalIdle,
      avgCostPerHour: avgCost,
      highUtilization: filteredReports.filter((r) => r.utilizationRate >= 0.75).length,
      mediumUtilization: filteredReports.filter(
        (r) => r.utilizationRate >= 0.5 && r.utilizationRate < 0.75
      ).length,
      lowUtilization: filteredReports.filter((r) => r.utilizationRate < 0.5).length,
    }
  }, [filteredReports])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleExport = () => {
    // TODO: Implement export to CSV/Excel
    console.log('Exporting reports...')
  }

  return (
    <div className="utilization-reports">
      {/* Header */}
      <div className="reports-header">
        <div className="header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/equipment')}
            title="Back to Equipment"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Equipment Utilization Reports</h1>
            <p className="subtitle">
              Analyze equipment usage, idle time, and cost efficiency across your fleet
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={handleExport}>
            <Download className="icon" />
            Export Report
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-primary">
            <BarChart3 className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Equipment</p>
            <p className="stat-value">{statistics.totalEquipment}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-success">
            <Zap className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg Utilization</p>
            <p className="stat-value">{formatPercent(statistics.avgUtilization)}</p>
            <p className="stat-trend">
              {statistics.avgUtilization >= 0.75 ? (
                <TrendingUp className="icon-trend up" />
              ) : (
                <TrendingDown className="icon-trend down" />
              )}
              {getUtilizationLabel(statistics.avgUtilization)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-info">
            <Clock className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Hours Used</p>
            <p className="stat-value">{formatNumber(statistics.totalHoursUsed, 0)}h</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-warning">
            <TrendingDown className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Idle Time</p>
            <p className="stat-value">{formatNumber(statistics.totalIdleHours, 0)}h</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-danger">
            <DollarSign className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg Cost/Hour</p>
            <p className="stat-value">{formatCurrency(statistics.avgCostPerHour)}</p>
          </div>
        </div>
      </div>

      {/* Utilization Distribution */}
      <div className="distribution-card">
        <h2>Utilization Distribution</h2>
        <div className="distribution-grid">
          <div className="distribution-item">
            <div className="distribution-bar">
              <div
                className="bar-fill bar-success"
                style={{
                  width: `${(statistics.highUtilization / statistics.totalEquipment) * 100}%`,
                }}
              />
            </div>
            <div className="distribution-label">
              <span className="label">High Utilization (≥75%)</span>
              <span className="value">{statistics.highUtilization} equipment</span>
            </div>
          </div>

          <div className="distribution-item">
            <div className="distribution-bar">
              <div
                className="bar-fill bar-warning"
                style={{
                  width: `${(statistics.mediumUtilization / statistics.totalEquipment) * 100}%`,
                }}
              />
            </div>
            <div className="distribution-label">
              <span className="label">Medium Utilization (50-75%)</span>
              <span className="value">{statistics.mediumUtilization} equipment</span>
            </div>
          </div>

          <div className="distribution-item">
            <div className="distribution-bar">
              <div
                className="bar-fill bar-danger"
                style={{
                  width: `${(statistics.lowUtilization / statistics.totalEquipment) * 100}%`,
                }}
              />
            </div>
            <div className="distribution-label">
              <span className="label">Low Utilization (&lt;50%)</span>
              <span className="value">{statistics.lowUtilization} equipment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="controls">
        <div className="controls-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter className="filter-icon" />
            <div className="select-wrapper">
              <select
                value={utilizationFilter}
                onChange={(e) =>
                  setUtilizationFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')
                }
              >
                <option value="all">All Utilization</option>
                <option value="high">High (≥75%)</option>
                <option value="medium">Medium (50-75%)</option>
                <option value="low">Low (&lt;50%)</option>
              </select>
              <ChevronDown className="select-icon" />
            </div>
          </div>
        </div>

        <div className="controls-right">
          <div className="date-range-group">
            <Calendar className="calendar-icon" />
            <div className="select-wrapper">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)}>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <ChevronDown className="select-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                <div className="th-content">
                  <span>Equipment</span>
                  {sortField === 'name' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th onClick={() => handleSort('utilizationRate')} className="sortable">
                <div className="th-content">
                  <span>Utilization Rate</span>
                  {sortField === 'utilizationRate' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th onClick={() => handleSort('totalHoursUsed')} className="sortable">
                <div className="th-content">
                  <span>Total Hours</span>
                  {sortField === 'totalHoursUsed' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th>Avg Hours/Day</th>
              <th onClick={() => handleSort('idleTimeHours')} className="sortable">
                <div className="th-content">
                  <span>Idle Time</span>
                  {sortField === 'idleTimeHours' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th onClick={() => handleSort('costPerHour')} className="sortable">
                <div className="th-content">
                  <span>Cost/Hour</span>
                  {sortField === 'costPerHour' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th onClick={() => handleSort('lastUsedDate')} className="sortable">
                <div className="th-content">
                  <span>Last Used</span>
                  {sortField === 'lastUsedDate' && (
                    <span className={`sort-arrow ${sortDirection}`}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedReports.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={7}>
                  <div className="empty-state">
                    <BarChart3 className="empty-icon" />
                    <p>No equipment found</p>
                    <span>Try adjusting your filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedReports.map((report) => (
                <tr key={report.equipmentId}>
                  <td>
                    <div className="equipment-cell">
                      <span className="equipment-name">{report.name}</span>
                      <span className="asset-number">{report.assetNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="utilization-cell">
                      <div className="utilization-bar-wrapper">
                        <div
                          className={`utilization-bar bar-${getUtilizationColor(report.utilizationRate)}`}
                          style={{ width: `${report.utilizationRate * 100}%` }}
                        />
                      </div>
                      <span className={`utilization-text text-${getUtilizationColor(report.utilizationRate)}`}>
                        {formatPercent(report.utilizationRate)}
                      </span>
                    </div>
                  </td>
                  <td>{formatNumber(report.totalHoursUsed, 0)}h</td>
                  <td>{formatNumber(report.averageHoursPerDay, 1)}h</td>
                  <td>{formatNumber(report.idleTimeHours, 0)}h</td>
                  <td>{formatCurrency(report.costPerHour)}</td>
                  <td>
                    {report.lastUsedDate ? (
                      <div className="date-cell">
                        <span className="date">{formatDate(report.lastUsedDate)}</span>
                        <span className="relative-date">
                          {formatRelativeDate(report.lastUsedDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="no-data">Never</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="reports-footer">
        <p>
          Showing {sortedReports.length} of {reports.length} equipment
          {filteredReports.length !== reports.length && ' (filtered)'}
        </p>
      </div>
    </div>
  )
}
