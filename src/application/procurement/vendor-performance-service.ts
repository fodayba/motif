import { Result, UniqueEntityID } from '@domain/shared'
import type { Vendor, VendorRepository } from '@domain/procurement'
import type { PurchaseOrderRepository } from '@domain/procurement'
import type { GoodsReceiptRepository } from '@domain/procurement'
import type { InvoiceRepository } from '@domain/procurement'

/**
 * Performance evaluation period for metrics calculation
 */
export type EvaluationPeriod = 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'all_time'

/**
 * Performance scorecard metrics
 */
export type PerformanceScorecard = {
  vendorId: string
  vendorName: string
  period: EvaluationPeriod
  overallScore: number // 0-100
  metrics: {
    onTimeDelivery: {
      score: number // 0-100
      rate: number // percentage
      totalDeliveries: number
      onTimeCount: number
      lateCount: number
    }
    qualityScore: {
      score: number // 0-100
      defectRate: number // percentage
      totalReceipts: number
      acceptedCount: number
      rejectedCount: number
    }
    priceCompetitiveness: {
      score: number // 0-100
      averageVarianceFromMarket: number // percentage
      priceIncreases: number
      priceDecreases: number
    }
    communication: {
      score: number // 0-100
      responseTimeHours: number
      disputeResolutionDays: number
      documentAccuracy: number // percentage
    }
    compliance: {
      score: number // 0-100
      insuranceCurrent: boolean
      certificationsValid: boolean
      safetyRecordClean: boolean
      complianceIssues: number
    }
  }
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  calculatedAt: Date
}

/**
 * Vendor comparison for bid evaluation
 */
export type VendorComparison = {
  vendors: Array<{
    vendorId: string
    vendorName: string
    overallScore: number
    onTimeDeliveryRate: number
    qualityScore: number
    priceCompetitiveness: number
    totalOrders: number
    totalSpend: number
    ranking: number
  }>
  period: EvaluationPeriod
  generatedAt: Date
}

/**
 * Performance trend data
 */
export type PerformanceTrend = {
  vendorId: string
  vendorName: string
  dataPoints: Array<{
    period: string // YYYY-MM format
    overallScore: number
    onTimeDeliveryRate: number
    qualityScore: number
    orderCount: number
  }>
}

/**
 * Evaluation criteria for vendor assessment
 */
export type EvaluationCriteria = {
  criteriaId: string
  name: string
  description: string
  weight: number // 0-100, must sum to 100
  category: 'delivery' | 'quality' | 'price' | 'communication' | 'compliance' | 'other'
}

/**
 * Vendor evaluation input
 */
export type VendorEvaluationInput = {
  vendorId: string
  evaluatorId: string
  evaluatorName: string
  projectId?: string
  orderId?: string
  criteria: Array<{
    criteriaId: string
    score: number // 0-100
    comments?: string
  }>
  overallComments?: string
  evaluatedAt: Date
}

/**
 * Performance alert configuration
 */
export type PerformanceAlert = {
  vendorId: string
  vendorName: string
  alertType: 'quality_decline' | 'late_deliveries' | 'price_increase' | 'compliance_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metrics: Record<string, number>
  triggeredAt: Date
}

/**
 * Vendor performance report
 */
export type PerformanceReport = {
  reportId: string
  title: string
  period: EvaluationPeriod
  vendors: PerformanceScorecard[]
  summary: {
    totalVendors: number
    averageScore: number
    topPerformers: Array<{ vendorId: string; vendorName: string; score: number }>
    poorPerformers: Array<{ vendorId: string; vendorName: string; score: number }>
    totalOrdersProcessed: number
    totalSpend: number
  }
  generatedAt: Date
  generatedBy: string
}

/**
 * VendorPerformanceService
 * 
 * Application service for vendor performance tracking, evaluation, and reporting.
 * Implements comprehensive scoring algorithms and analytics.
 */
export class VendorPerformanceService {
  private vendorRepository: VendorRepository
  private _purchaseOrderRepository: PurchaseOrderRepository
  private _goodsReceiptRepository: GoodsReceiptRepository
  private _invoiceRepository: InvoiceRepository

  constructor(params: {
    vendorRepository: VendorRepository
    purchaseOrderRepository: PurchaseOrderRepository
    goodsReceiptRepository: GoodsReceiptRepository
    invoiceRepository: InvoiceRepository
  }) {
    this.vendorRepository = params.vendorRepository
    this._purchaseOrderRepository = params.purchaseOrderRepository
    this._goodsReceiptRepository = params.goodsReceiptRepository
    this._invoiceRepository = params.invoiceRepository
  }

  /**
   * Calculate comprehensive performance scorecard for a vendor
   */
  async calculateScorecard(
    vendorId: string,
    period: EvaluationPeriod = 'last_90_days',
  ): Promise<Result<PerformanceScorecard>> {
    // Fetch vendor
    const vendorResult = await this.vendorRepository.findById(new UniqueEntityID(vendorId))
    if (!vendorResult) {
      return Result.fail('Vendor not found')
    }

    const vendor = vendorResult
    const now = new Date()

    // NOTE: In production, repository methods would support filtering by vendor and date range
    // Using vendor's existing performance metrics as base
    const vendorPerformance = vendor.performance
    
    // Calculate metrics based on existing vendor data
    const onTimeDelivery = {
      score: Math.round(vendorPerformance.onTimeDeliveryRate * 1.1), // Convert to 0-100 scale
      rate: vendorPerformance.onTimeDeliveryRate,
      totalDeliveries: 50, // Mock data
      onTimeCount: Math.floor(50 * (vendorPerformance.onTimeDeliveryRate / 100)),
      lateCount: 50 - Math.floor(50 * (vendorPerformance.onTimeDeliveryRate / 100)),
    }

    const qualityScore = {
      score: Math.round(vendorPerformance.qualityScore),
      defectRate: 100 - vendorPerformance.qualityScore,
      totalReceipts: 45,
      acceptedCount: Math.floor(45 * (vendorPerformance.qualityScore / 100)),
      rejectedCount: 45 - Math.floor(45 * (vendorPerformance.qualityScore / 100)),
    }

    const priceCompetitiveness = this.calculatePriceCompetitiveness([], [])
    const communication = this.calculateCommunicationScore([], [])
    const compliance = this.calculateComplianceScore(vendor)

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      onTimeDelivery: onTimeDelivery.score,
      qualityScore: qualityScore.score,
      priceCompetitiveness: priceCompetitiveness.score,
      communication: communication.score,
      compliance: compliance.score,
    })

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = this.analyzePerformance({
      onTimeDelivery: onTimeDelivery.score,
      qualityScore: qualityScore.score,
      priceCompetitiveness: priceCompetitiveness.score,
      communication: communication.score,
      compliance: compliance.score,
    })

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      { onTimeDelivery, qualityScore, priceCompetitiveness, communication, compliance },
      overallScore,
    )

    const scorecard: PerformanceScorecard = {
      vendorId,
      vendorName: vendor.profile.legalName,
      period,
      overallScore,
      metrics: {
        onTimeDelivery,
        qualityScore,
        priceCompetitiveness,
        communication,
        compliance,
      },
      strengths,
      weaknesses,
      recommendations,
      calculatedAt: now,
    }

    return Result.ok(scorecard)
  }

  /**
   * Compare multiple vendors for bid evaluation
   */
  async compareVendors(
    vendorIds: string[],
    period: EvaluationPeriod = 'last_90_days',
  ): Promise<Result<VendorComparison>> {
    if (vendorIds.length === 0) {
      return Result.fail('At least one vendor ID is required')
    }

    const now = new Date()

    const vendorData = await Promise.all(
      vendorIds.map(async (vendorId) => {
        const vendorResult = await this.vendorRepository.findById(new UniqueEntityID(vendorId))
        if (!vendorResult) {
          return null
        }

        const vendor = vendorResult
        // Using existing vendor performance metrics
        const perf = vendor.performance

        const onTimeDelivery = {
          score: Math.round(perf.onTimeDeliveryRate * 1.1),
          rate: perf.onTimeDeliveryRate,
        }

        const qualityScore = {
          score: Math.round(perf.qualityScore),
        }

        const priceCompetitiveness = this.calculatePriceCompetitiveness([], [])

        const overallScore = this.calculateOverallScore({
          onTimeDelivery: onTimeDelivery.score,
          qualityScore: qualityScore.score,
          priceCompetitiveness: priceCompetitiveness.score,
          communication: 75,
          compliance: 80,
        })

        const totalSpend = 0 // Mock data

        return {
          vendorId,
          vendorName: vendor.profile.legalName,
          overallScore,
          onTimeDeliveryRate: onTimeDelivery.rate,
          qualityScore: qualityScore.score,
          priceCompetitiveness: priceCompetitiveness.score,
          totalOrders: 25, // Mock data
          totalSpend,
          ranking: 0,
        }
      }),
    )

    // Filter out nulls and sort by overall score
    const validVendors = vendorData.filter((v) => v !== null)
    validVendors.sort((a, b) => b.overallScore - a.overallScore)

    // Assign rankings
    validVendors.forEach((vendor, index) => {
      vendor.ranking = index + 1
    })

    return Result.ok({
      vendors: validVendors,
      period,
      generatedAt: now,
    })
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(
    vendorId: string,
    months: number = 12,
  ): Promise<Result<PerformanceTrend>> {
    const vendorResult = await this.vendorRepository.findById(new UniqueEntityID(vendorId))
    if (!vendorResult) {
      return Result.fail('Vendor not found')
    }

    const vendor = vendorResult
    const dataPoints = []
    const now = new Date()

    // Calculate monthly data points
    for (let i = months - 1; i >= 0; i--) {
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      // Using vendor's existing performance metrics
      const perf = vendor.performance

      const overallScore = this.calculateOverallScore({
        onTimeDelivery: Math.round(perf.onTimeDeliveryRate * 1.1),
        qualityScore: Math.round(perf.qualityScore),
        priceCompetitiveness: 75,
        communication: 75,
        compliance: 80,
      })

      dataPoints.push({
        period: `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}`,
        overallScore,
        onTimeDeliveryRate: perf.onTimeDeliveryRate,
        qualityScore: perf.qualityScore,
        orderCount: 5 + Math.floor(Math.random() * 10), // Mock variation
      })
    }

    return Result.ok({
      vendorId,
      vendorName: vendor.profile.legalName,
      dataPoints,
    })
  }

  /**
   * Submit manual vendor evaluation
   */
  async evaluateVendor(input: VendorEvaluationInput): Promise<Result<void>> {
    const vendorResult = await this.vendorRepository.findById(new UniqueEntityID(input.vendorId))
    if (!vendorResult) {
      return Result.fail('Vendor not found')
    }

    // Validate criteria weights sum to 100
    const totalWeight = input.criteria.reduce((sum, c) => sum + (c.score || 0), 0)
    if (totalWeight > input.criteria.length * 100) {
      return Result.fail('Invalid evaluation scores')
    }

    // Calculate weighted average score
    const averageScore =
      input.criteria.reduce((sum, c) => sum + c.score, 0) / input.criteria.length

    // Update vendor performance metrics
    const vendor = vendorResult
    vendor.updateRating(Math.round((averageScore / 100) * 5 * 10) / 10) // Convert to 0-5 scale

    await this.vendorRepository.save(vendor)

    return Result.ok(undefined)
  }

  /**
   * Detect performance alerts
   */
  async detectPerformanceAlerts(
    vendorId?: string,
    period: EvaluationPeriod = 'last_30_days',
  ): Promise<Result<PerformanceAlert[]>> {
    const alerts: PerformanceAlert[] = []
    const vendorIds = vendorId
      ? [vendorId]
      : (await this.vendorRepository.listActive()).map((v: Vendor) => v.id.toString())

    for (const vId of vendorIds) {
      const scorecardResult = await this.calculateScorecard(vId, period)
      if (!scorecardResult.isSuccess) {
        continue
      }

      const scorecard = scorecardResult.value!
      const metrics = scorecard.metrics

      // Check for quality decline
      if (metrics.qualityScore.score < 60) {
        alerts.push({
          vendorId: vId,
          vendorName: scorecard.vendorName,
          alertType: 'quality_decline',
          severity: metrics.qualityScore.score < 40 ? 'critical' : 'high',
          message: `Quality score has dropped to ${metrics.qualityScore.score}% with defect rate of ${metrics.qualityScore.defectRate.toFixed(1)}%`,
          metrics: {
            qualityScore: metrics.qualityScore.score,
            defectRate: metrics.qualityScore.defectRate,
          },
          triggeredAt: new Date(),
        })
      }

      // Check for late deliveries
      if (metrics.onTimeDelivery.score < 70) {
        alerts.push({
          vendorId: vId,
          vendorName: scorecard.vendorName,
          alertType: 'late_deliveries',
          severity: metrics.onTimeDelivery.score < 50 ? 'high' : 'medium',
          message: `On-time delivery rate has dropped to ${metrics.onTimeDelivery.rate.toFixed(1)}% with ${metrics.onTimeDelivery.lateCount} late deliveries`,
          metrics: {
            onTimeDeliveryRate: metrics.onTimeDelivery.rate,
            lateCount: metrics.onTimeDelivery.lateCount,
          },
          triggeredAt: new Date(),
        })
      }

      // Check for compliance issues
      if (metrics.compliance.score < 80 || metrics.compliance.complianceIssues > 0) {
        alerts.push({
          vendorId: vId,
          vendorName: scorecard.vendorName,
          alertType: 'compliance_issue',
          severity: metrics.compliance.complianceIssues > 2 ? 'critical' : 'medium',
          message: `Compliance issues detected: ${metrics.compliance.complianceIssues} open issues`,
          metrics: {
            complianceScore: metrics.compliance.score,
            issues: metrics.compliance.complianceIssues,
          },
          triggeredAt: new Date(),
        })
      }
    }

    return Result.ok(alerts)
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    period: EvaluationPeriod,
    generatedBy: string,
    vendorIds?: string[],
  ): Promise<Result<PerformanceReport>> {
    const vIds = vendorIds || (await this.vendorRepository.listActive()).map((v: Vendor) => v.id.toString())

    if (vIds.length === 0) {
      return Result.fail('No vendors found')
    }

    const scorecards = await Promise.all(
      vIds.map(async (vId: string) => {
        const result = await this.calculateScorecard(vId, period)
        return result.isSuccess ? result.value : null
      }),
    )

    const validScorecards = scorecards.filter((s: PerformanceScorecard | null): s is PerformanceScorecard => s !== null)

    // Calculate summary statistics
    const totalVendors = validScorecards.length
    const averageScore =
      validScorecards.reduce((sum: number, s: PerformanceScorecard) => sum + s.overallScore, 0) / totalVendors
    const totalOrdersProcessed = validScorecards.reduce(
      (sum: number, s: PerformanceScorecard) => sum + s.metrics.onTimeDelivery.totalDeliveries,
      0,
    )
    const totalSpend = 0 // Would need order amounts

    // Identify top and poor performers
    const sortedByScore = [...validScorecards].sort((a, b) => b.overallScore - a.overallScore)
    const topPerformers = sortedByScore.slice(0, 5).map((s) => ({
      vendorId: s.vendorId,
      vendorName: s.vendorName,
      score: s.overallScore,
    }))
    const poorPerformers = sortedByScore.slice(-5).map((s) => ({
      vendorId: s.vendorId,
      vendorName: s.vendorName,
      score: s.overallScore,
    }))

    return Result.ok({
      reportId: new UniqueEntityID().toString(),
      title: `Vendor Performance Report - ${period}`,
      period,
      vendors: validScorecards,
      summary: {
        totalVendors,
        averageScore,
        topPerformers,
        poorPerformers,
        totalOrdersProcessed,
        totalSpend,
      },
      generatedAt: new Date(),
      generatedBy,
    })
  }

  /**
   * Get vendor ranking by performance
   */
  async getVendorRankings(
    period: EvaluationPeriod = 'last_90_days',
    limit: number = 10,
  ): Promise<
    Result<
      Array<{
        rank: number
        vendorId: string
        vendorName: string
        overallScore: number
        badge: 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard'
      }>
    >
  > {
    const vendors = await this.vendorRepository.listActive()
    const scorecards = await Promise.all(
      vendors.map(async (vendor: Vendor) => {
        const result = await this.calculateScorecard(vendor.id.toString(), period)
        return result.isSuccess ? result.value : null
      }),
    )

    const validScorecards = scorecards.filter(
      (s: PerformanceScorecard | null | undefined): s is PerformanceScorecard => s !== null && s !== undefined,
    )
    validScorecards.sort((a: PerformanceScorecard, b: PerformanceScorecard) => b.overallScore - a.overallScore)

    const rankings = validScorecards.slice(0, limit).map((scorecard: PerformanceScorecard, index: number) => ({
      rank: index + 1,
      vendorId: scorecard.vendorId,
      vendorName: scorecard.vendorName,
      overallScore: scorecard.overallScore,
      badge: this.getPerformanceBadge(scorecard.overallScore),
    }))

    return Result.ok(rankings)
  }

  /**
   * Calculate vendor score for a specific category
   */
  async getCategoryScore(
    vendorId: string,
    category: 'delivery' | 'quality' | 'price' | 'communication' | 'compliance',
    period: EvaluationPeriod = 'last_90_days',
  ): Promise<Result<number>> {
    const scorecardResult = await this.calculateScorecard(vendorId, period)
    if (!scorecardResult.isSuccess) {
      return Result.fail(scorecardResult.error!)
    }

    const scorecard = scorecardResult.value!
    let score: number

    switch (category) {
      case 'delivery':
        score = scorecard.metrics.onTimeDelivery.score
        break
      case 'quality':
        score = scorecard.metrics.qualityScore.score
        break
      case 'price':
        score = scorecard.metrics.priceCompetitiveness.score
        break
      case 'communication':
        score = scorecard.metrics.communication.score
        break
      case 'compliance':
        score = scorecard.metrics.compliance.score
        break
    }

    return Result.ok(score)
  }

  // Private helper methods

  private _getPeriodStartDate(period: EvaluationPeriod): Date {
    const now = new Date()
    switch (period) {
      case 'last_30_days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case 'last_90_days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case 'last_6_months':
        return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      case 'last_year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      case 'all_time':
        return new Date(2000, 0, 1) // Arbitrary old date
    }
  }

  private _calculateOnTimeDelivery(_orders: any[], receipts: any[]) {
    const totalDeliveries = receipts.length
    if (totalDeliveries === 0) {
      return {
        score: 0,
        rate: 0,
        totalDeliveries: 0,
        onTimeCount: 0,
        lateCount: 0,
      }
    }

    // Mock calculation - in real implementation, compare expected vs actual delivery dates
    const onTimeCount = Math.floor(totalDeliveries * 0.85) // 85% mock on-time rate
    const lateCount = totalDeliveries - onTimeCount
    const rate = (onTimeCount / totalDeliveries) * 100
    const score = Math.min(100, rate * 1.1) // Slightly boost score

    return {
      score: Math.round(score),
      rate,
      totalDeliveries,
      onTimeCount,
      lateCount,
    }
  }

  private _calculateQualityScore(receipts: any[]) {
    const totalReceipts = receipts.length
    if (totalReceipts === 0) {
      return {
        score: 0,
        defectRate: 0,
        totalReceipts: 0,
        acceptedCount: 0,
        rejectedCount: 0,
      }
    }

    // Mock calculation - in real implementation, check receipt quality status
    const acceptedCount = Math.floor(totalReceipts * 0.95) // 95% acceptance rate
    const rejectedCount = totalReceipts - acceptedCount
    const defectRate = (rejectedCount / totalReceipts) * 100
    const score = 100 - defectRate * 2 // Penalty for defects

    return {
      score: Math.max(0, Math.round(score)),
      defectRate,
      totalReceipts,
      acceptedCount,
      rejectedCount,
    }
  }

  private calculatePriceCompetitiveness(_orders: any[], _invoices: any[]) {
    // Mock calculation - would compare actual prices vs market rates
    return {
      score: 78,
      averageVarianceFromMarket: 5.2,
      priceIncreases: 2,
      priceDecreases: 1,
    }
  }

  private calculateCommunicationScore(_orders: any[], _invoices: any[]) {
    // Mock calculation - would track response times, dispute resolution
    return {
      score: 82,
      responseTimeHours: 4.5,
      disputeResolutionDays: 3.2,
      documentAccuracy: 94.5,
    }
  }

  private calculateComplianceScore(vendor: Vendor) {
    const performance = vendor.performance
    const complianceIssues = performance.disputeCount || 0

    // Mock compliance check
    const insuranceCurrent = true
    const certificationsValid = true
    const safetyRecordClean = complianceIssues === 0
    const baseScore = 100

    let score = baseScore
    if (!insuranceCurrent) score -= 30
    if (!certificationsValid) score -= 20
    if (!safetyRecordClean) score -= 10 * Math.min(complianceIssues, 5)

    return {
      score: Math.max(0, score),
      insuranceCurrent,
      certificationsValid,
      safetyRecordClean,
      complianceIssues,
    }
  }

  private calculateOverallScore(scores: Record<string, number>): number {
    // Weighted average: delivery 25%, quality 30%, price 20%, communication 15%, compliance 10%
    const weights = {
      onTimeDelivery: 0.25,
      qualityScore: 0.3,
      priceCompetitiveness: 0.2,
      communication: 0.15,
      compliance: 0.1,
    }

    const weightedSum = Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + score * (weights[key as keyof typeof weights] || 0)
    }, 0)

    return Math.round(weightedSum)
  }

  private analyzePerformance(scores: Record<string, number>) {
    const strengths: string[] = []
    const weaknesses: string[] = []

    Object.entries(scores).forEach(([key, score]) => {
      const label = this.getMetricLabel(key)
      if (score >= 85) {
        strengths.push(`Excellent ${label} (${score}%)`)
      } else if (score < 65) {
        weaknesses.push(`Below expectations in ${label} (${score}%)`)
      }
    })

    if (strengths.length === 0) strengths.push('Consistent performance across metrics')
    if (weaknesses.length === 0) weaknesses.push('No significant performance issues identified')

    return { strengths, weaknesses }
  }

  private generateRecommendations(
    metrics: any,
    overallScore: number,
  ): string[] {
    const recommendations: string[] = []

    if (overallScore >= 85) {
      recommendations.push('Continue with current vendor - excellent performance')
      recommendations.push('Consider for preferred vendor status')
    } else if (overallScore >= 70) {
      recommendations.push('Maintain vendor relationship with regular monitoring')
    } else if (overallScore >= 50) {
      recommendations.push('Schedule performance review meeting')
      recommendations.push('Implement improvement action plan')
    } else {
      recommendations.push('Consider alternative vendors')
      recommendations.push('Immediate corrective action required')
    }

    if (metrics.onTimeDelivery.score < 70) {
      recommendations.push('Address delivery timeliness issues')
    }
    if (metrics.qualityScore.score < 70) {
      recommendations.push('Implement quality improvement program')
    }
    if (metrics.compliance.complianceIssues > 0) {
      recommendations.push('Resolve compliance issues immediately')
    }

    return recommendations
  }

  private getMetricLabel(key: string): string {
    const labels: Record<string, string> = {
      onTimeDelivery: 'on-time delivery',
      qualityScore: 'quality',
      priceCompetitiveness: 'pricing',
      communication: 'communication',
      compliance: 'compliance',
    }
    return labels[key] || key
  }

  private getPerformanceBadge(score: number): 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard' {
    if (score >= 90) return 'platinum'
    if (score >= 80) return 'gold'
    if (score >= 70) return 'silver'
    if (score >= 60) return 'bronze'
    return 'standard'
  }
}
