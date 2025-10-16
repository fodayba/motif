import { useState, useEffect } from 'react'
import { Button, Surface } from '@shared/components/ui'
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './evm-analytics.css'

type EVMMetrics = {
  asOf: Date
  plannedValue: number
  earnedValue: number
  actualCost: number
  scheduleVariance: number
  costVariance: number
  spi: number
  cpi: number
  estimateAtCompletion: number
  varianceAtCompletion: number
  budgetAtCompletion: number
}

type VarianceAnalysis = {
  scheduleStatus: string
  budgetStatus: string
  performanceDescription: string
}

type TCPIAnalysis = {
  tcpiValue: number
  isAchievable: boolean
  recommendation: string
  method: 'bac' | 'eac'
}

type HistoricalDataPoint = {
  date: string
  pv: number
  ev: number
  ac: number
  spi: number
  cpi: number
}

export function EVMAnalytics() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<EVMMetrics | null>(null)
  const [variance, setVariance] = useState<VarianceAnalysis | null>(null)
  const [tcpi, setTcpi] = useState<TCPIAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [tcpiMethod, setTcpiMethod] = useState<'bac' | 'eac'>('bac')

  useEffect(() => {
    loadEVMData()
  }, [])

  const loadEVMData = async () => {
    try {
      // TODO: Replace with actual service calls
      // const schedulingService = container.resolve('schedulingService')
      // const evmResult = await schedulingService.calculateEarnedValue({ projectId: currentProjectId })
      // const varianceResult = await schedulingService.calculateVarianceAnalysis({ projectId: currentProjectId })
      // const tcpiResult = await schedulingService.calculateTCPI({ projectId: currentProjectId, useEAC: tcpiMethod === 'eac' })

      // Mock data for now
      const mockMetrics: EVMMetrics = {
        asOf: new Date(),
        plannedValue: 750000,
        earnedValue: 680000,
        actualCost: 720000,
        scheduleVariance: -70000,
        costVariance: -40000,
        spi: 0.91,
        cpi: 0.94,
        estimateAtCompletion: 1064893.62,
        varianceAtCompletion: -64893.62,
        budgetAtCompletion: 1000000,
      }

      const mockVariance: VarianceAnalysis = {
        scheduleStatus: 'behind',
        budgetStatus: 'over budget',
        performanceDescription:
          'Project is behind schedule and over budget - immediate corrective action required',
      }

      const mockTcpi: TCPIAnalysis = {
        tcpiValue: 1.14,
        isAchievable: true,
        recommendation:
          'TCPI indicates challenging target - implement strict cost controls and efficiency improvements',
        method: tcpiMethod,
      }

      const mockHistorical: HistoricalDataPoint[] = [
        { date: 'Week 1', pv: 100000, ev: 95000, ac: 98000, spi: 0.95, cpi: 0.97 },
        { date: 'Week 2', pv: 200000, ev: 190000, ac: 195000, spi: 0.95, cpi: 0.97 },
        { date: 'Week 3', pv: 300000, ev: 280000, ac: 295000, spi: 0.93, cpi: 0.95 },
        { date: 'Week 4', pv: 400000, ev: 370000, ac: 390000, spi: 0.93, cpi: 0.95 },
        { date: 'Week 5', pv: 500000, ev: 460000, ac: 490000, spi: 0.92, cpi: 0.94 },
        { date: 'Week 6', pv: 600000, ev: 550000, ac: 590000, spi: 0.92, cpi: 0.93 },
        { date: 'Week 7', pv: 700000, ev: 640000, ac: 690000, spi: 0.91, cpi: 0.93 },
        { date: 'Week 8', pv: 750000, ev: 680000, ac: 720000, spi: 0.91, cpi: 0.94 },
      ]

      setMetrics(mockMetrics)
      setVariance(mockVariance)
      setTcpi(mockTcpi)
      // TODO: Use mockHistorical for trend charts in future
      console.debug('EVM data loaded with historical data', mockHistorical)
    } catch (error) {
      console.error('Failed to load EVM data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTcpiMethodChange = async (method: 'bac' | 'eac') => {
    setTcpiMethod(method)
    // TODO: Reload TCPI with new method
    // const tcpiResult = await schedulingService.calculateTCPI({ projectId: currentProjectId, useEAC: method === 'eac' })
  }

  if (loading || !metrics) {
    return (
      <div className="evm-analytics">
        <div className="loading-state">
          <Activity className="spinner" size={32} />
          <p>Loading EVM analytics...</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(metrics.plannedValue, metrics.earnedValue, metrics.actualCost)

  return (
    <div className="evm-analytics">
      <div className="page-header">
        <Button variant="ghost" onClick={() => navigate('/projects/dashboard')}>
          <ArrowLeft size={20} />
        </Button>
        <div className="header-content">
          <h1>Earned Value Management Analytics</h1>
          <p className="subtitle">
            Comprehensive EVM analysis as of {metrics.asOf.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Performance Alert */}
      {variance && (
        <Surface
          className={`performance-alert ${variance.scheduleStatus === 'behind' || variance.budgetStatus === 'over budget' ? 'alert-danger' : 'alert-success'}`}
        >
          <div className="alert-content">
            {variance.scheduleStatus === 'behind' || variance.budgetStatus === 'over budget' ? (
              <AlertTriangle size={24} />
            ) : (
              <CheckCircle size={24} />
            )}
            <div className="alert-text">
              <h3>Performance Status</h3>
              <p>{variance.performanceDescription}</p>
            </div>
          </div>
        </Surface>
      )}

      {/* Core EVM Metrics */}
      <div className="metrics-row">
        <Surface className="metric-card">
          <div className="metric-header">
            <h3>Planned Value (PV)</h3>
            <span className="metric-subtitle">BCWS</span>
          </div>
          <div className="metric-value">${(metrics.plannedValue / 1000).toFixed(1)}K</div>
          <div className="metric-bar">
            <div
              className="metric-bar-fill pv"
              style={{ width: `${(metrics.plannedValue / maxValue) * 100}%` }}
            />
          </div>
          <p className="metric-description">Authorized budget for scheduled work</p>
        </Surface>

        <Surface className="metric-card">
          <div className="metric-header">
            <h3>Earned Value (EV)</h3>
            <span className="metric-subtitle">BCWP</span>
          </div>
          <div className="metric-value">${(metrics.earnedValue / 1000).toFixed(1)}K</div>
          <div className="metric-bar">
            <div
              className="metric-bar-fill ev"
              style={{ width: `${(metrics.earnedValue / maxValue) * 100}%` }}
            />
          </div>
          <p className="metric-description">Budgeted cost of completed work</p>
        </Surface>

        <Surface className="metric-card">
          <div className="metric-header">
            <h3>Actual Cost (AC)</h3>
            <span className="metric-subtitle">ACWP</span>
          </div>
          <div className="metric-value">${(metrics.actualCost / 1000).toFixed(1)}K</div>
          <div className="metric-bar">
            <div
              className="metric-bar-fill ac"
              style={{ width: `${(metrics.actualCost / maxValue) * 100}%` }}
            />
          </div>
          <p className="metric-description">Total cost of completed work</p>
        </Surface>
      </div>

      {/* Performance Indices */}
      <div className="metrics-grid">
        <Surface className="performance-index-card">
          <div className="card-header">
            <h3>Schedule Performance Index (SPI)</h3>
            <p className="card-subtitle">EV / PV</p>
          </div>
          <div className="index-display">
            <div className={`index-value ${metrics.spi >= 1.0 ? 'positive' : 'negative'}`}>
              {metrics.spi.toFixed(3)}
              {metrics.spi >= 1.0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div className="index-gauge">
              <div className="gauge-bar">
                <div
                  className={`gauge-fill ${metrics.spi >= 1.0 ? 'positive' : 'negative'}`}
                  style={{ width: `${Math.min((metrics.spi / 1.2) * 100, 100)}%` }}
                />
                <div className="gauge-marker target" style={{ left: '83.33%' }} />
              </div>
              <div className="gauge-labels">
                <span>0.80</span>
                <span>1.00</span>
                <span>1.20</span>
              </div>
            </div>
            <div className="index-status">
              {metrics.spi >= 1.02
                ? 'Ahead of schedule'
                : metrics.spi >= 0.98
                  ? 'On schedule'
                  : 'Behind schedule'}
            </div>
          </div>
        </Surface>

        <Surface className="performance-index-card">
          <div className="card-header">
            <h3>Cost Performance Index (CPI)</h3>
            <p className="card-subtitle">EV / AC</p>
          </div>
          <div className="index-display">
            <div className={`index-value ${metrics.cpi >= 1.0 ? 'positive' : 'negative'}`}>
              {metrics.cpi.toFixed(3)}
              {metrics.cpi >= 1.0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div className="index-gauge">
              <div className="gauge-bar">
                <div
                  className={`gauge-fill ${metrics.cpi >= 1.0 ? 'positive' : 'negative'}`}
                  style={{ width: `${Math.min((metrics.cpi / 1.2) * 100, 100)}%` }}
                />
                <div className="gauge-marker target" style={{ left: '83.33%' }} />
              </div>
              <div className="gauge-labels">
                <span>0.80</span>
                <span>1.00</span>
                <span>1.20</span>
              </div>
            </div>
            <div className="index-status">
              {metrics.cpi >= 1.02
                ? 'Under budget'
                : metrics.cpi >= 0.98
                  ? 'On budget'
                  : 'Over budget'}
            </div>
          </div>
        </Surface>
      </div>

      {/* Variance Analysis */}
      <Surface className="variance-card">
        <div className="card-header">
          <h3>Variance Analysis</h3>
          <p className="card-subtitle">Deviations from planned performance</p>
        </div>
        <div className="variance-grid">
          <div className="variance-item">
            <div className="variance-label">
              <span>Schedule Variance (SV)</span>
              <span className="formula">EV - PV</span>
            </div>
            <div className={`variance-value ${metrics.scheduleVariance >= 0 ? 'positive' : 'negative'}`}>
              ${Math.abs(metrics.scheduleVariance / 1000).toFixed(1)}K
              {metrics.scheduleVariance >= 0 ? ' ahead' : ' behind'}
            </div>
            <div className="variance-bar">
              <div
                className={`variance-bar-fill ${metrics.scheduleVariance >= 0 ? 'positive' : 'negative'}`}
                style={{
                  width: `${Math.min((Math.abs(metrics.scheduleVariance) / maxValue) * 200, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="variance-item">
            <div className="variance-label">
              <span>Cost Variance (CV)</span>
              <span className="formula">EV - AC</span>
            </div>
            <div className={`variance-value ${metrics.costVariance >= 0 ? 'positive' : 'negative'}`}>
              ${Math.abs(metrics.costVariance / 1000).toFixed(1)}K
              {metrics.costVariance >= 0 ? ' under' : ' over'}
            </div>
            <div className="variance-bar">
              <div
                className={`variance-bar-fill ${metrics.costVariance >= 0 ? 'positive' : 'negative'}`}
                style={{
                  width: `${Math.min((Math.abs(metrics.costVariance) / maxValue) * 200, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Surface>

      {/* Forecast Section */}
      <Surface className="forecast-card">
        <div className="card-header">
          <h3>Forecast & Completion Estimates</h3>
          <p className="card-subtitle">Projected costs at completion</p>
        </div>
        <div className="forecast-grid">
          <div className="forecast-item">
            <h4>Budget at Completion (BAC)</h4>
            <p className="forecast-amount baseline">${(metrics.budgetAtCompletion / 1000).toFixed(1)}K</p>
            <span className="forecast-description">Original project budget</span>
          </div>
          <div className="forecast-item">
            <h4>Estimate at Completion (EAC)</h4>
            <p className="forecast-amount warning">${(metrics.estimateAtCompletion / 1000).toFixed(1)}K</p>
            <span className="forecast-description">Projected final cost (BAC / CPI)</span>
          </div>
          <div className="forecast-item">
            <h4>Variance at Completion (VAC)</h4>
            <p className={`forecast-amount ${metrics.varianceAtCompletion >= 0 ? 'positive' : 'negative'}`}>
              ${Math.abs(metrics.varianceAtCompletion / 1000).toFixed(1)}K
              {metrics.varianceAtCompletion >= 0 ? ' under' : ' over'}
            </p>
            <span className="forecast-description">Expected budget variance (BAC - EAC)</span>
          </div>
        </div>
        <div className="forecast-visualization">
          <div className="forecast-bar-container">
            <div className="forecast-bar">
              <div className="forecast-segment bac" style={{ width: '100%' }}>
                <span>BAC: ${(metrics.budgetAtCompletion / 1000).toFixed(0)}K</span>
              </div>
            </div>
            <div className="forecast-bar">
              <div
                className="forecast-segment eac"
                style={{
                  width: `${(metrics.estimateAtCompletion / metrics.budgetAtCompletion) * 100}%`,
                }}
              >
                <span>EAC: ${(metrics.estimateAtCompletion / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      {/* TCPI Analysis */}
      {tcpi && (
        <Surface className="tcpi-card">
          <div className="card-header">
            <h3>To-Complete Performance Index (TCPI)</h3>
            <p className="card-subtitle">Efficiency required to meet target</p>
            <div className="tcpi-method-toggle">
              <Button
                variant={tcpiMethod === 'bac' ? 'primary' : 'secondary'}
                onClick={() => handleTcpiMethodChange('bac')}
              >
                Based on BAC
              </Button>
              <Button
                variant={tcpiMethod === 'eac' ? 'primary' : 'secondary'}
                onClick={() => handleTcpiMethodChange('eac')}
              >
                Based on EAC
              </Button>
            </div>
          </div>
          <div className="tcpi-content">
            <div className="tcpi-gauge-section">
              <div className="tcpi-value-display">
                <span className={`value ${!tcpi.isAchievable ? 'unachievable' : ''}`}>
                  {tcpi.tcpiValue.toFixed(3)}
                </span>
                <span className="label">TCPI Value</span>
              </div>
              <div className="tcpi-scale">
                <div className="scale-bar">
                  <div
                    className={`scale-indicator ${tcpi.tcpiValue > 1.2 ? 'critical' : tcpi.tcpiValue > 1.1 ? 'warning' : 'normal'}`}
                    style={{
                      left: `${Math.min(Math.max(((tcpi.tcpiValue - 0.8) / 0.4) * 100, 0), 100)}%`,
                    }}
                  >
                    <div className="indicator-marker" />
                  </div>
                </div>
                <div className="scale-labels">
                  <span className="label">0.80</span>
                  <span className="label">0.90</span>
                  <span className="label target">1.00</span>
                  <span className="label">1.10</span>
                  <span className="label">1.20+</span>
                </div>
              </div>
            </div>
            <div className="tcpi-recommendation">
              <div className={`status-badge ${tcpi.isAchievable ? 'achievable' : 'challenging'}`}>
                {tcpi.isAchievable ? '✓ Achievable Target' : '⚠ Very Challenging'}
              </div>
              <p className="recommendation-text">{tcpi.recommendation}</p>
            </div>
          </div>
        </Surface>
      )}
    </div>
  )
}
