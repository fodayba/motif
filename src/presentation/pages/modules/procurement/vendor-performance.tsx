import { useState, useEffect } from 'react'
import { TrendingUp, Award, AlertTriangle, CheckCircle, Clock, DollarSign, FileText, Shield } from 'lucide-react'
import './vendor-performance.css'

type EvaluationPeriod = 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'all_time'

type PerformanceMetrics = {
  onTimeDelivery: {
    score: number
    rate: number
    totalDeliveries: number
    onTimeCount: number
    lateCount: number
  }
  qualityScore: {
    score: number
    defectRate: number
    totalReceipts: number
    acceptedCount: number
    rejectedCount: number
  }
  priceCompetitiveness: {
    score: number
    averageVarianceFromMarket: number
    priceIncreases: number
    priceDecreases: number
  }
  communication: {
    score: number
    responseTimeHours: number
    disputeResolutionDays: number
    documentAccuracy: number
  }
  compliance: {
    score: number
    insuranceCurrent: boolean
    certificationsValid: boolean
    safetyRecordClean: boolean
    complianceIssues: number
  }
}

type PerformanceScorecard = {
  vendorId: string
  vendorName: string
  period: EvaluationPeriod
  overallScore: number
  metrics: PerformanceMetrics
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  calculatedAt: Date
  badge: 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard'
}

type VendorRanking = {
  vendorId: string
  vendorName: string
  overallScore: number
  onTimeDeliveryRate: number
  qualityScore: number
  priceCompetitiveness: number
  totalOrders: number
  totalSpend: number
  ranking: number
  badge: 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard'
}

const PERIOD_OPTIONS: Array<{ value: EvaluationPeriod; label: string }> = [
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all_time', label: 'All Time' },
]

export function VendorPerformance() {
  const [period, setPeriod] = useState<EvaluationPeriod>('last_90_days')
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'rankings' | 'scorecard' | 'trends'>('rankings')
  const [rankings, setRankings] = useState<VendorRanking[]>([])
  const [scorecard, setScorecard] = useState<PerformanceScorecard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRankings()
  }, [period])

  useEffect(() => {
    if (selectedVendorId && activeTab === 'scorecard') {
      loadScorecard(selectedVendorId)
    }
  }, [selectedVendorId, activeTab])

  const loadRankings = async () => {
    setLoading(true)
    // Mock data - replace with actual service call
    setTimeout(() => {
      const mockRankings: VendorRanking[] = [
        {
          vendorId: '1',
          vendorName: 'Acme Construction Supplies',
          overallScore: 94,
          onTimeDeliveryRate: 96,
          qualityScore: 95,
          priceCompetitiveness: 91,
          totalOrders: 145,
          totalSpend: 1250000,
          ranking: 1,
          badge: 'platinum',
        },
        {
          vendorId: '2',
          vendorName: 'BuildPro Materials',
          overallScore: 87,
          onTimeDeliveryRate: 89,
          qualityScore: 88,
          priceCompetitiveness: 84,
          totalOrders: 98,
          totalSpend: 875000,
          ranking: 2,
          badge: 'gold',
        },
        {
          vendorId: '3',
          vendorName: 'Summit Equipment Co',
          overallScore: 76,
          onTimeDeliveryRate: 78,
          qualityScore: 82,
          priceCompetitiveness: 68,
          totalOrders: 67,
          totalSpend: 620000,
          ranking: 3,
          badge: 'silver',
        },
        {
          vendorId: '4',
          vendorName: 'Reliable Lumber & Hardware',
          overallScore: 68,
          onTimeDeliveryRate: 72,
          qualityScore: 70,
          priceCompetitiveness: 62,
          totalOrders: 54,
          totalSpend: 410000,
          ranking: 4,
          badge: 'bronze',
        },
        {
          vendorId: '5',
          vendorName: 'ValueParts Distributors',
          overallScore: 58,
          onTimeDeliveryRate: 65,
          qualityScore: 60,
          priceCompetitiveness: 50,
          totalOrders: 32,
          totalSpend: 185000,
          ranking: 5,
          badge: 'standard',
        },
      ]
      setRankings(mockRankings)
      setLoading(false)
    }, 600)
  }

  const loadScorecard = async (vendorId: string) => {
    setLoading(true)
    // Mock data - replace with actual service call
    setTimeout(() => {
      const vendor = rankings.find(r => r.vendorId === vendorId)
      if (vendor) {
        const mockScorecard: PerformanceScorecard = {
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          period,
          overallScore: vendor.overallScore,
          metrics: {
            onTimeDelivery: {
              score: vendor.onTimeDeliveryRate,
              rate: vendor.onTimeDeliveryRate,
              totalDeliveries: vendor.totalOrders,
              onTimeCount: Math.floor(vendor.totalOrders * (vendor.onTimeDeliveryRate / 100)),
              lateCount: vendor.totalOrders - Math.floor(vendor.totalOrders * (vendor.onTimeDeliveryRate / 100)),
            },
            qualityScore: {
              score: vendor.qualityScore,
              defectRate: 100 - vendor.qualityScore,
              totalReceipts: vendor.totalOrders,
              acceptedCount: Math.floor(vendor.totalOrders * (vendor.qualityScore / 100)),
              rejectedCount: vendor.totalOrders - Math.floor(vendor.totalOrders * (vendor.qualityScore / 100)),
            },
            priceCompetitiveness: {
              score: vendor.priceCompetitiveness,
              averageVarianceFromMarket: (100 - vendor.priceCompetitiveness) / 10,
              priceIncreases: 2,
              priceDecreases: 5,
            },
            communication: {
              score: 85,
              responseTimeHours: 4.2,
              disputeResolutionDays: 3.5,
              documentAccuracy: 92,
            },
            compliance: {
              score: vendor.overallScore > 80 ? 95 : 75,
              insuranceCurrent: true,
              certificationsValid: true,
              safetyRecordClean: vendor.overallScore > 70,
              complianceIssues: vendor.overallScore > 80 ? 0 : 2,
            },
          },
          strengths: generateStrengths(vendor),
          weaknesses: generateWeaknesses(vendor),
          recommendations: generateRecommendations(vendor),
          calculatedAt: new Date(),
          badge: vendor.badge,
        }
        setScorecard(mockScorecard)
      }
      setLoading(false)
    }, 400)
  }

  const generateStrengths = (vendor: VendorRanking): string[] => {
    const strengths: string[] = []
    if (vendor.onTimeDeliveryRate >= 90) strengths.push('Consistently meets delivery deadlines')
    if (vendor.qualityScore >= 85) strengths.push('High quality standards with minimal defects')
    if (vendor.priceCompetitiveness >= 80) strengths.push('Competitive pricing strategy')
    return strengths.length > 0 ? strengths : ['Maintains basic service standards']
  }

  const generateWeaknesses = (vendor: VendorRanking): string[] => {
    const weaknesses: string[] = []
    if (vendor.onTimeDeliveryRate < 75) weaknesses.push('Frequent delivery delays')
    if (vendor.qualityScore < 70) weaknesses.push('Quality control issues')
    if (vendor.priceCompetitiveness < 65) weaknesses.push('Above-market pricing')
    return weaknesses
  }

  const generateRecommendations = (vendor: VendorRanking): string[] => {
    const recommendations: string[] = []
    if (vendor.onTimeDeliveryRate < 80) recommendations.push('Review and improve delivery processes')
    if (vendor.qualityScore < 75) recommendations.push('Implement stricter quality controls')
    if (vendor.priceCompetitiveness < 70) recommendations.push('Negotiate pricing or seek alternative suppliers')
    if (vendor.overallScore >= 85) recommendations.push('Consider for preferred vendor status')
    return recommendations.length > 0 ? recommendations : ['Continue monitoring performance']
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'platinum': return '#E5E4E2'
      case 'gold': return '#FFD700'
      case 'silver': return '#C0C0C0'
      case 'bronze': return '#CD7F32'
      default: return '#94A3B8'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--success)'
    if (score >= 75) return 'var(--info)'
    if (score >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId)
    setActiveTab('scorecard')
  }

  return (
    <div className="vendor-performance">
      <div className="vendor-performance-header">
        <div className="header-content">
          <h1>Vendor Performance</h1>
          <p>Track and analyze vendor performance metrics</p>
        </div>
        <div className="header-controls">
          <select 
            className="period-select" 
            value={period}
            onChange={(e) => setPeriod(e.target.value as EvaluationPeriod)}
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn-secondary">
            <FileText size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          <Award size={18} />
          Rankings
        </button>
        <button
          className={`tab ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
          disabled={!selectedVendorId}
        >
          <TrendingUp size={18} />
          Detailed Scorecard
        </button>
        <button
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <Clock size={18} />
          Performance Trends
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading performance data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'rankings' && (
            <div className="rankings-tab">
              <div className="rankings-stats">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
                    <Award size={24} style={{ color: 'var(--success)' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Top Performer</div>
                    <div className="stat-value">{rankings[0]?.vendorName || 'N/A'}</div>
                    <div className="stat-meta">{rankings[0]?.overallScore || 0} score</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'var(--info-light)' }}>
                    <TrendingUp size={24} style={{ color: 'var(--info)' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Average Score</div>
                    <div className="stat-value">
                      {Math.round(rankings.reduce((sum, r) => sum + r.overallScore, 0) / rankings.length)}
                    </div>
                    <div className="stat-meta">Across all vendors</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
                    <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Needs Attention</div>
                    <div className="stat-value">{rankings.filter(r => r.overallScore < 70).length}</div>
                    <div className="stat-meta">Below 70 score</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
                    <DollarSign size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Spend</div>
                    <div className="stat-value">
                      ${(rankings.reduce((sum, r) => sum + r.totalSpend, 0) / 1000000).toFixed(1)}M
                    </div>
                    <div className="stat-meta">{period.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              </div>

              <div className="rankings-table-container">
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Vendor</th>
                      <th>Badge</th>
                      <th>Overall Score</th>
                      <th>On-Time Delivery</th>
                      <th>Quality Score</th>
                      <th>Price Comp.</th>
                      <th>Orders</th>
                      <th>Total Spend</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((vendor) => (
                      <tr key={vendor.vendorId}>
                        <td>
                          <div className="rank-badge">#{vendor.ranking}</div>
                        </td>
                        <td>
                          <div className="vendor-info">
                            <div className="vendor-name">{vendor.vendorName}</div>
                          </div>
                        </td>
                        <td>
                          <div className="badge-icon" style={{ background: getBadgeColor(vendor.badge) }}>
                            <Award size={16} style={{ color: '#1e293b' }} />
                          </div>
                        </td>
                        <td>
                          <div className="score-cell">
                            <div className="score-bar">
                              <div 
                                className="score-fill" 
                                style={{ 
                                  width: `${vendor.overallScore}%`,
                                  background: getScoreColor(vendor.overallScore)
                                }}
                              ></div>
                            </div>
                            <span className="score-value" style={{ color: getScoreColor(vendor.overallScore) }}>
                              {vendor.overallScore}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: getScoreColor(vendor.onTimeDeliveryRate) }}>
                            {vendor.onTimeDeliveryRate}%
                          </span>
                        </td>
                        <td>
                          <span style={{ color: getScoreColor(vendor.qualityScore) }}>
                            {vendor.qualityScore}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: getScoreColor(vendor.priceCompetitiveness) }}>
                            {vendor.priceCompetitiveness}
                          </span>
                        </td>
                        <td>{vendor.totalOrders}</td>
                        <td>${(vendor.totalSpend / 1000).toFixed(0)}K</td>
                        <td>
                          <button 
                            className="btn-link"
                            onClick={() => handleVendorSelect(vendor.vendorId)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scorecard' && scorecard && (
            <div className="scorecard-tab">
              <div className="scorecard-header">
                <div className="scorecard-title">
                  <h2>{scorecard.vendorName}</h2>
                  <div className="scorecard-badge" style={{ background: getBadgeColor(scorecard.badge) }}>
                    <Award size={20} />
                    {scorecard.badge.toUpperCase()}
                  </div>
                </div>
                <div className="overall-score-display">
                  <div className="score-circle" style={{ borderColor: getScoreColor(scorecard.overallScore) }}>
                    <span className="score-number">{scorecard.overallScore}</span>
                    <span className="score-label">Overall</span>
                  </div>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <Clock size={20} />
                    <h3>On-Time Delivery</h3>
                  </div>
                  <div className="metric-score" style={{ color: getScoreColor(scorecard.metrics.onTimeDelivery.score) }}>
                    {scorecard.metrics.onTimeDelivery.score}/100
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Delivery Rate:</span>
                      <span>{scorecard.metrics.onTimeDelivery.rate}%</span>
                    </div>
                    <div className="detail-row">
                      <span>On Time:</span>
                      <span>{scorecard.metrics.onTimeDelivery.onTimeCount} / {scorecard.metrics.onTimeDelivery.totalDeliveries}</span>
                    </div>
                    <div className="detail-row">
                      <span>Late:</span>
                      <span className="text-danger">{scorecard.metrics.onTimeDelivery.lateCount}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <CheckCircle size={20} />
                    <h3>Quality Score</h3>
                  </div>
                  <div className="metric-score" style={{ color: getScoreColor(scorecard.metrics.qualityScore.score) }}>
                    {scorecard.metrics.qualityScore.score}/100
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Defect Rate:</span>
                      <span>{scorecard.metrics.qualityScore.defectRate.toFixed(1)}%</span>
                    </div>
                    <div className="detail-row">
                      <span>Accepted:</span>
                      <span>{scorecard.metrics.qualityScore.acceptedCount} / {scorecard.metrics.qualityScore.totalReceipts}</span>
                    </div>
                    <div className="detail-row">
                      <span>Rejected:</span>
                      <span className="text-danger">{scorecard.metrics.qualityScore.rejectedCount}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <DollarSign size={20} />
                    <h3>Price Competitiveness</h3>
                  </div>
                  <div className="metric-score" style={{ color: getScoreColor(scorecard.metrics.priceCompetitiveness.score) }}>
                    {scorecard.metrics.priceCompetitiveness.score}/100
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Market Variance:</span>
                      <span>{scorecard.metrics.priceCompetitiveness.averageVarianceFromMarket > 0 ? '+' : ''}{scorecard.metrics.priceCompetitiveness.averageVarianceFromMarket.toFixed(1)}%</span>
                    </div>
                    <div className="detail-row">
                      <span>Price Increases:</span>
                      <span>{scorecard.metrics.priceCompetitiveness.priceIncreases}</span>
                    </div>
                    <div className="detail-row">
                      <span>Price Decreases:</span>
                      <span className="text-success">{scorecard.metrics.priceCompetitiveness.priceDecreases}</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <FileText size={20} />
                    <h3>Communication</h3>
                  </div>
                  <div className="metric-score" style={{ color: getScoreColor(scorecard.metrics.communication.score) }}>
                    {scorecard.metrics.communication.score}/100
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Avg Response Time:</span>
                      <span>{scorecard.metrics.communication.responseTimeHours.toFixed(1)}h</span>
                    </div>
                    <div className="detail-row">
                      <span>Dispute Resolution:</span>
                      <span>{scorecard.metrics.communication.disputeResolutionDays.toFixed(1)} days</span>
                    </div>
                    <div className="detail-row">
                      <span>Doc Accuracy:</span>
                      <span>{scorecard.metrics.communication.documentAccuracy}%</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <Shield size={20} />
                    <h3>Compliance</h3>
                  </div>
                  <div className="metric-score" style={{ color: getScoreColor(scorecard.metrics.compliance.score) }}>
                    {scorecard.metrics.compliance.score}/100
                  </div>
                  <div className="metric-details">
                    <div className="detail-row">
                      <span>Insurance:</span>
                      <span className={scorecard.metrics.compliance.insuranceCurrent ? 'text-success' : 'text-danger'}>
                        {scorecard.metrics.compliance.insuranceCurrent ? 'Current' : 'Expired'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Certifications:</span>
                      <span className={scorecard.metrics.compliance.certificationsValid ? 'text-success' : 'text-danger'}>
                        {scorecard.metrics.compliance.certificationsValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Issues:</span>
                      <span className={scorecard.metrics.compliance.complianceIssues === 0 ? 'text-success' : 'text-warning'}>
                        {scorecard.metrics.compliance.complianceIssues}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="insights-section">
                <div className="insight-card strengths">
                  <h3><CheckCircle size={20} /> Strengths</h3>
                  <ul>
                    {scorecard.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="insight-card weaknesses">
                  <h3><AlertTriangle size={20} /> Weaknesses</h3>
                  <ul>
                    {scorecard.weaknesses.length > 0 ? (
                      scorecard.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))
                    ) : (
                      <li>No significant weaknesses identified</li>
                    )}
                  </ul>
                </div>
                <div className="insight-card recommendations">
                  <h3><TrendingUp size={20} /> Recommendations</h3>
                  <ul>
                    {scorecard.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="trends-tab">
              <div className="trends-placeholder">
                <TrendingUp size={48} />
                <h3>Performance Trends</h3>
                <p>Historical performance trend charts coming soon</p>
                <p className="text-muted">Track vendor performance over time with interactive charts</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
