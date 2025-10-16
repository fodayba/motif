import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Download,
  TrendingDown,
  TrendingUp,
  Zap,
  ArrowLeft,

} from 'lucide-react'
import './roi-depreciation-reports.css'

// ============================================================================
// Types
// ============================================================================

type DepreciationMethod =
  | 'STRAIGHT_LINE'
  | 'DECLINING_BALANCE'
  | 'DOUBLE_DECLINING_BALANCE'
  | 'SUM_OF_YEARS_DIGITS'
  | 'UNITS_OF_PRODUCTION'

interface DepreciationReport {
  equipmentId: string
  assetNumber: string
  name: string
  method: DepreciationMethod
  acquisitionCost: number
  salvageValue: number
  usefulLifeYears: number
  currentAge: number
  annualDepreciation: number
  accumulatedDepreciation: number
  bookValue: number
  depreciationRate: number
}

interface ROIReport {
  equipmentId: string
  assetNumber: string
  name: string
  acquisitionCost: number
  currentValue: number
  totalRevenue: number
  totalMaintenanceCost: number
  totalOperatingCost: number
  netProfit: number
  roi: number
  paybackPeriodMonths: number
  utilizationRate: number
  costPerHour: number
  revenuePerHour: number
}

interface DisposalRecommendation {
  equipmentId: string
  assetNumber: string
  name: string
  recommendedAction: 'SELL' | 'TRADE_IN' | 'SCRAP' | 'DONATE' | 'RETAIN'
  estimatedResaleValue: number
  marketConditions: 'STRONG' | 'MODERATE' | 'WEAK'
  optimalDisposalDate: Date
  reasoning: string
}

type ReportView = 'depreciation' | 'roi' | 'disposal'

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getMethodLabel(method: DepreciationMethod): string {
  const labels: Record<DepreciationMethod, string> = {
    STRAIGHT_LINE: 'Straight Line',
    DECLINING_BALANCE: 'Declining Balance',
    DOUBLE_DECLINING_BALANCE: 'Double Declining',
    SUM_OF_YEARS_DIGITS: 'Sum of Years',
    UNITS_OF_PRODUCTION: 'Units of Production',
  }
  return labels[method]
}

function getROIColor(roi: number): string {
  if (roi >= 20) return 'success'
  if (roi >= 10) return 'info'
  if (roi >= 0) return 'warning'
  return 'danger'
}

function getActionColor(action: DisposalRecommendation['recommendedAction']): string {
  const colors: Record<DisposalRecommendation['recommendedAction'], string> = {
    SELL: 'success',
    TRADE_IN: 'info',
    SCRAP: 'warning',
    DONATE: 'secondary',
    RETAIN: 'primary',
  }
  return colors[action]
}

function getActionLabel(action: DisposalRecommendation['recommendedAction']): string {
  const labels: Record<DisposalRecommendation['recommendedAction'], string> = {
    SELL: 'Sell',
    TRADE_IN: 'Trade In',
    SCRAP: 'Scrap',
    DONATE: 'Donate',
    RETAIN: 'Retain',
  }
  return labels[action]
}

// ============================================================================
// Mock Data Generation
// ============================================================================

function generateMockDepreciationReports(): DepreciationReport[] {
  const equipmentList = [
    { name: 'CAT 320 Excavator #A01', assetNumber: 'A01' },
    { name: 'John Deere 644 Loader #B12', assetNumber: 'B12' },
    { name: 'Komatsu D65 Dozer #C78', assetNumber: 'C78' },
    { name: 'Volvo A40G Truck #D93', assetNumber: 'D93' },
    { name: 'Bobcat S650 Skid Steer #E45', assetNumber: 'E45' },
    { name: 'JCB 3CX Backhoe #F23', assetNumber: 'F23' },
  ]

  const methods: DepreciationMethod[] = [
    'STRAIGHT_LINE',
    'DECLINING_BALANCE',
    'DOUBLE_DECLINING_BALANCE',
  ]

  return equipmentList.map((eq, index) => {
    const acquisitionCost = 100000 + Math.random() * 400000
    const usefulLifeYears = 8 + Math.floor(Math.random() * 7)
    const currentAge = 1 + Math.floor(Math.random() * 5)
    const salvageValue = acquisitionCost * 0.1
    const method = methods[index % methods.length]

    // Calculate depreciation based on method
    let annualDepreciation: number
    let accumulatedDepreciation: number

    if (method === 'STRAIGHT_LINE') {
      annualDepreciation = (acquisitionCost - salvageValue) / usefulLifeYears
      accumulatedDepreciation = annualDepreciation * currentAge
    } else if (method === 'DECLINING_BALANCE') {
      const rate = 1.5 / usefulLifeYears
      annualDepreciation = acquisitionCost * rate
      accumulatedDepreciation = acquisitionCost * (1 - Math.pow(1 - rate, currentAge))
    } else {
      // DOUBLE_DECLINING_BALANCE
      const rate = 2 / usefulLifeYears
      annualDepreciation = acquisitionCost * rate
      accumulatedDepreciation = acquisitionCost * (1 - Math.pow(1 - rate, currentAge))
    }

    const bookValue = acquisitionCost - accumulatedDepreciation
    const depreciationRate = (annualDepreciation / acquisitionCost) * 100

    return {
      equipmentId: `eq-${index}`,
      assetNumber: eq.assetNumber,
      name: eq.name,
      method,
      acquisitionCost,
      salvageValue,
      usefulLifeYears,
      currentAge,
      annualDepreciation,
      accumulatedDepreciation,
      bookValue,
      depreciationRate,
    }
  })
}

function generateMockROIReports(): ROIReport[] {
  const equipmentList = [
    { name: 'CAT 320 Excavator #A01', assetNumber: 'A01' },
    { name: 'John Deere 644 Loader #B12', assetNumber: 'B12' },
    { name: 'Komatsu D65 Dozer #C78', assetNumber: 'C78' },
    { name: 'Volvo A40G Truck #D93', assetNumber: 'D93' },
    { name: 'Bobcat S650 Skid Steer #E45', assetNumber: 'E45' },
    { name: 'JCB 3CX Backhoe #F23', assetNumber: 'F23' },
  ]

  return equipmentList.map((eq, index) => {
    const acquisitionCost = 100000 + Math.random() * 400000
    const currentValue = acquisitionCost * (0.5 + Math.random() * 0.3)
    const totalRevenue = acquisitionCost * (1.2 + Math.random() * 0.8)
    const totalMaintenanceCost = acquisitionCost * (0.1 + Math.random() * 0.15)
    const totalOperatingCost = acquisitionCost * (0.15 + Math.random() * 0.2)
    const netProfit = totalRevenue - acquisitionCost - totalMaintenanceCost - totalOperatingCost
    const roi = (netProfit / acquisitionCost) * 100
    const paybackPeriodMonths = 12 + Math.floor(Math.random() * 36)
    const utilizationRate = 0.5 + Math.random() * 0.4
    const totalHours = 1000 + Math.random() * 3000
    const costPerHour = (acquisitionCost + totalMaintenanceCost + totalOperatingCost) / totalHours
    const revenuePerHour = totalRevenue / totalHours

    return {
      equipmentId: `eq-${index}`,
      assetNumber: eq.assetNumber,
      name: eq.name,
      acquisitionCost,
      currentValue,
      totalRevenue,
      totalMaintenanceCost,
      totalOperatingCost,
      netProfit,
      roi,
      paybackPeriodMonths,
      utilizationRate,
      costPerHour,
      revenuePerHour,
    }
  })
}

function generateMockDisposalRecommendations(): DisposalRecommendation[] {
  const equipmentList = [
    { name: 'CAT 320 Excavator #A01', assetNumber: 'A01' },
    { name: 'John Deere 644 Loader #B12', assetNumber: 'B12' },
    { name: 'Komatsu D65 Dozer #C78', assetNumber: 'C78' },
  ]

  const actions: DisposalRecommendation['recommendedAction'][] = ['SELL', 'TRADE_IN', 'RETAIN']
  const markets: DisposalRecommendation['marketConditions'][] = ['STRONG', 'MODERATE', 'WEAK']

  return equipmentList.map((eq, index) => {
    const action = actions[index % actions.length]
    const market = markets[index % markets.length]
    const estimatedResaleValue = 50000 + Math.random() * 150000
    const daysUntilOptimal = 30 + Math.floor(Math.random() * 180)

    const reasonings: Record<DisposalRecommendation['recommendedAction'], string> = {
      SELL: `Equipment is in good condition with strong market demand. Current market conditions favor selling. Expected resale value is ${formatCurrency(estimatedResaleValue)}.`,
      TRADE_IN: `Consider trading in for newer model. Current book value and trade-in incentives make this attractive. Moderate market conditions support trade-in strategy.`,
      RETAIN: `Equipment still has significant useful life remaining. Maintenance costs are within acceptable range. Market conditions are weak, suggesting retention is optimal.`,
      SCRAP: `Equipment has reached end of useful life. Scrap value recovery recommended. Market resale value is minimal.`,
      DONATE: `Consider charitable donation for tax benefits. Equipment has limited resale value but still functional for community use.`,
    }

    return {
      equipmentId: `eq-${index}`,
      assetNumber: eq.assetNumber,
      name: eq.name,
      recommendedAction: action,
      estimatedResaleValue,
      marketConditions: market,
      optimalDisposalDate: new Date(Date.now() + daysUntilOptimal * 24 * 60 * 60 * 1000),
      reasoning: reasonings[action],
    }
  })
}

// ============================================================================
// Main Component
// ============================================================================

export function ROIDepreciationReports() {
  const navigate = useNavigate()
  const [view, setView] = useState<ReportView>('depreciation')
  const [depreciationReports, setDepreciationReports] = useState<DepreciationReport[]>([])
  const [roiReports, setROIReports] = useState<ROIReport[]>([])
  const [disposalRecommendations, setDisposalRecommendations] = useState<
    DisposalRecommendation[]
  >([])

  // Load data
  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    // TODO: Replace with actual service calls
    setDepreciationReports(generateMockDepreciationReports())
    setROIReports(generateMockROIReports())
    setDisposalRecommendations(generateMockDisposalRecommendations())
  }

  // Calculate statistics
  const depreciationStats = useMemo(() => {
    if (depreciationReports.length === 0) {
      return {
        totalAcquisition: 0,
        totalBookValue: 0,
        totalDepreciation: 0,
        avgDepreciationRate: 0,
      }
    }

    const totalAcquisition = depreciationReports.reduce((sum, r) => sum + r.acquisitionCost, 0)
    const totalBookValue = depreciationReports.reduce((sum, r) => sum + r.bookValue, 0)
    const totalDepreciation = depreciationReports.reduce(
      (sum, r) => sum + r.accumulatedDepreciation,
      0
    )
    const avgDepreciationRate =
      depreciationReports.reduce((sum, r) => sum + r.depreciationRate, 0) /
      depreciationReports.length

    return { totalAcquisition, totalBookValue, totalDepreciation, avgDepreciationRate }
  }, [depreciationReports])

  const roiStats = useMemo(() => {
    if (roiReports.length === 0) {
      return { avgROI: 0, totalRevenue: 0, totalNetProfit: 0, positiveROICount: 0 }
    }

    const totalRevenue = roiReports.reduce((sum, r) => sum + r.totalRevenue, 0)
    const totalNetProfit = roiReports.reduce((sum, r) => sum + r.netProfit, 0)
    const avgROI = roiReports.reduce((sum, r) => sum + r.roi, 0) / roiReports.length
    const positiveROICount = roiReports.filter((r) => r.roi > 0).length

    return { avgROI, totalRevenue, totalNetProfit, positiveROICount }
  }, [roiReports])

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting reports...')
  }

  return (
    <div className="roi-depreciation-reports">
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
            <h1>ROI & Depreciation Reports</h1>
            <p className="subtitle">
              Financial analysis, depreciation tracking, and lifecycle optimization
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={handleExport}>
            <Download className="icon" />
            Export
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="view-selector">
        <button
          className={`view-button ${view === 'depreciation' ? 'active' : ''}`}
          onClick={() => setView('depreciation')}
        >
          <TrendingDown className="icon" />
          Depreciation
        </button>
        <button
          className={`view-button ${view === 'roi' ? 'active' : ''}`}
          onClick={() => setView('roi')}
        >
          <DollarSign className="icon" />
          ROI Analysis
        </button>
        <button
          className={`view-button ${view === 'disposal' ? 'active' : ''}`}
          onClick={() => setView('disposal')}
        >
          <AlertTriangle className="icon" />
          Disposal Recommendations
        </button>
      </div>

      {/* Depreciation View */}
      {view === 'depreciation' && (
        <div className="view-content">
          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-primary">
                <BarChart3 className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Acquisition Cost</p>
                <p className="stat-value">{formatCurrency(depreciationStats.totalAcquisition)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-success">
                <TrendingUp className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Current Book Value</p>
                <p className="stat-value">{formatCurrency(depreciationStats.totalBookValue)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-warning">
                <TrendingDown className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Depreciation</p>
                <p className="stat-value">{formatCurrency(depreciationStats.totalDepreciation)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-info">
                <Zap className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Avg Depreciation Rate</p>
                <p className="stat-value">{formatPercent(depreciationStats.avgDepreciationRate)}</p>
              </div>
            </div>
          </div>

          {/* Depreciation Table */}
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Method</th>
                  <th>Acquisition Cost</th>
                  <th>Age (Years)</th>
                  <th>Annual Depreciation</th>
                  <th>Accumulated</th>
                  <th>Book Value</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {depreciationReports.map((report) => (
                  <tr key={report.equipmentId}>
                    <td>
                      <div className="equipment-cell">
                        <span className="equipment-name">{report.name}</span>
                        <span className="asset-number">{report.assetNumber}</span>
                      </div>
                    </td>
                    <td>
                      <span className="method-badge">{getMethodLabel(report.method)}</span>
                    </td>
                    <td>{formatCurrency(report.acquisitionCost)}</td>
                    <td>
                      {report.currentAge} / {report.usefulLifeYears}
                    </td>
                    <td>{formatCurrency(report.annualDepreciation)}</td>
                    <td>{formatCurrency(report.accumulatedDepreciation)}</td>
                    <td className="highlight">{formatCurrency(report.bookValue)}</td>
                    <td>{formatPercent(report.depreciationRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Depreciation Chart Visualization */}
          <div className="chart-card">
            <h2>Depreciation Timeline</h2>
            <div className="depreciation-chart">
              {depreciationReports.slice(0, 3).map((report) => (
                <div key={report.equipmentId} className="chart-row">
                  <div className="chart-label">
                    <span className="equipment-name">{report.name}</span>
                    <span className="book-value">{formatCurrency(report.bookValue)}</span>
                  </div>
                  <div className="chart-bar-container">
                    <div className="chart-bar-wrapper">
                      <div
                        className="chart-bar bar-depreciated"
                        style={{
                          width: `${(report.accumulatedDepreciation / report.acquisitionCost) * 100}%`,
                        }}
                      />
                      <div
                        className="chart-bar bar-remaining"
                        style={{
                          width: `${(report.bookValue / report.acquisitionCost) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="chart-markers">
                      {[...Array(report.usefulLifeYears + 1)].map((_, i) => (
                        <div
                          key={i}
                          className={`marker ${i === report.currentAge ? 'current' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color bar-depreciated" />
                <span>Depreciated</span>
              </div>
              <div className="legend-item">
                <div className="legend-color bar-remaining" />
                <span>Remaining Value</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROI View */}
      {view === 'roi' && (
        <div className="view-content">
          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-success">
                <DollarSign className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">{formatCurrency(roiStats.totalRevenue)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-primary">
                <TrendingUp className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Net Profit</p>
                <p className="stat-value">{formatCurrency(roiStats.totalNetProfit)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-info">
                <Zap className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Average ROI</p>
                <p className="stat-value">{formatPercent(roiStats.avgROI)}</p>
                <p className="stat-trend">
                  {roiStats.avgROI >= 0 ? (
                    <TrendingUp className="icon-trend up" />
                  ) : (
                    <TrendingDown className="icon-trend down" />
                  )}
                  {roiStats.avgROI >= 20
                    ? 'Excellent'
                    : roiStats.avgROI >= 10
                      ? 'Good'
                      : roiStats.avgROI >= 0
                        ? 'Fair'
                        : 'Poor'}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-success">
                <BarChart3 className="icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Positive ROI</p>
                <p className="stat-value">
                  {roiStats.positiveROICount} / {roiReports.length}
                </p>
              </div>
            </div>
          </div>

          {/* ROI Table */}
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Acquisition Cost</th>
                  <th>Total Revenue</th>
                  <th>Total Costs</th>
                  <th>Net Profit</th>
                  <th>ROI</th>
                  <th>Payback Period</th>
                </tr>
              </thead>
              <tbody>
                {roiReports.map((report) => {
                  const totalCosts =
                    report.acquisitionCost +
                    report.totalMaintenanceCost +
                    report.totalOperatingCost
                  return (
                    <tr key={report.equipmentId}>
                      <td>
                        <div className="equipment-cell">
                          <span className="equipment-name">{report.name}</span>
                          <span className="asset-number">{report.assetNumber}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(report.acquisitionCost)}</td>
                      <td>{formatCurrency(report.totalRevenue)}</td>
                      <td>{formatCurrency(totalCosts)}</td>
                      <td className={report.netProfit >= 0 ? 'positive' : 'negative'}>
                        {formatCurrency(report.netProfit)}
                      </td>
                      <td>
                        <span className={`roi-badge badge-${getROIColor(report.roi)}`}>
                          {formatPercent(report.roi)}
                        </span>
                      </td>
                      <td>
                        <div className="payback-cell">
                          <Clock className="icon" />
                          {Math.floor(report.paybackPeriodMonths / 12)}y{' '}
                          {report.paybackPeriodMonths % 12}m
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disposal Recommendations View */}
      {view === 'disposal' && (
        <div className="view-content">
          <div className="disposal-grid">
            {disposalRecommendations.map((recommendation) => (
              <div key={recommendation.equipmentId} className="disposal-card">
                <div className="disposal-header">
                  <div className="equipment-info">
                    <h3>{recommendation.name}</h3>
                    <span className="asset-number">{recommendation.assetNumber}</span>
                  </div>
                  <span
                    className={`action-badge badge-${getActionColor(recommendation.recommendedAction)}`}
                  >
                    {getActionLabel(recommendation.recommendedAction)}
                  </span>
                </div>

                <div className="disposal-body">
                  <div className="disposal-detail">
                    <span className="label">Estimated Resale Value:</span>
                    <span className="value">
                      {formatCurrency(recommendation.estimatedResaleValue)}
                    </span>
                  </div>

                  <div className="disposal-detail">
                    <span className="label">Market Conditions:</span>
                    <span
                      className={`market-badge market-${recommendation.marketConditions.toLowerCase()}`}
                    >
                      {recommendation.marketConditions}
                    </span>
                  </div>

                  <div className="disposal-detail">
                    <span className="label">Optimal Disposal Date:</span>
                    <span className="value">
                      <Calendar className="icon-inline" />
                      {formatDate(recommendation.optimalDisposalDate)}
                    </span>
                  </div>

                  <div className="reasoning">
                    <p className="label">Recommendation:</p>
                    <p className="text">{recommendation.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
