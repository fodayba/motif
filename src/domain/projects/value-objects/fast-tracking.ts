import { Result } from '../../shared/core/result';
import { Duration } from './duration';

/**
 * Fast Tracking Value Object
 * Represents schedule compression by overlapping dependent tasks
 * Fast Tracking = Performing tasks in parallel that are normally sequential
 */
export class FastTracking {
  private readonly _taskId: string
  private readonly _taskName: string
  private readonly _successorId: string
  private readonly _successorName: string
  private readonly _originalLag: Duration
  private readonly _proposedLag: Duration
  private readonly _timeSavings: Duration
  private readonly _riskLevel: RiskLevel
  private readonly _riskDescription: string
  private readonly _reworkProbability: number

  private constructor(
    taskId: string,
    taskName: string,
    successorId: string,
    successorName: string,
    originalLag: Duration,
    proposedLag: Duration,
    timeSavings: Duration,
    riskLevel: RiskLevel,
    riskDescription: string,
    reworkProbability: number
  ) {
    this._taskId = taskId
    this._taskName = taskName
    this._successorId = successorId
    this._successorName = successorName
    this._originalLag = originalLag
    this._proposedLag = proposedLag
    this._timeSavings = timeSavings
    this._riskLevel = riskLevel
    this._riskDescription = riskDescription
    this._reworkProbability = reworkProbability
  }

  get taskId(): string {
    return this._taskId;
  }

  get taskName(): string {
    return this._taskName;
  }

  get successorId(): string {
    return this._successorId;
  }

  get successorName(): string {
    return this._successorName;
  }

  get originalLag(): Duration {
    return this._originalLag;
  }

  get proposedLag(): Duration {
    return this._proposedLag;
  }

  get timeSavings(): Duration {
    return this._timeSavings;
  }

  get riskLevel(): RiskLevel {
    return this._riskLevel;
  }

  get riskDescription(): string {
    return this._riskDescription;
  }

  get reworkProbability(): number {
    return this._reworkProbability;
  }

  /**
   * Create fast tracking option
   */
  static create(props: {
    taskId: string;
    taskName: string;
    successorId: string;
    successorName: string;
    originalLag: Duration;
    proposedLag: Duration;
    riskLevel: RiskLevel;
    riskDescription: string;
    reworkProbability: number;
  }): Result<FastTracking> {
    // Validate proposed lag is less than original (time saved)
    if (props.proposedLag.toHours() >= props.originalLag.toHours()) {
      return Result.fail('Proposed lag must be less than original lag');
    }

    // Validate rework probability
    if (props.reworkProbability < 0 || props.reworkProbability > 1) {
      return Result.fail('Rework probability must be between 0 and 1');
    }

    const timeSavingsHours = props.originalLag.toHours() - props.proposedLag.toHours();
    const timeSavingsResult = Duration.fromHours(timeSavingsHours);
    
    if (!timeSavingsResult.isSuccess) {
      return Result.fail(timeSavingsResult.error!);
    }

    return Result.ok(
      new FastTracking(
        props.taskId,
        props.taskName,
        props.successorId,
        props.successorName,
        props.originalLag,
        props.proposedLag,
        timeSavingsResult.value!,
        props.riskLevel,
        props.riskDescription,
        props.reworkProbability
      )
    );
  }

  /**
   * Calculate expected time savings considering rework risk
   * Expected Savings = Time Savings × (1 - Rework Probability)
   */
  getExpectedTimeSavings(): Duration {
    const expectedHours = this._timeSavings.toHours() * (1 - this._reworkProbability);
    const result = Duration.fromHours(expectedHours);
    return result.isSuccess ? result.value! : Duration.zero();
  }

  /**
   * Calculate potential rework cost impact
   */
  calculateReworkImpact(averageReworkCost: number): number {
    return averageReworkCost * this._reworkProbability;
  }

  /**
   * Calculate overlap percentage
   * How much of the successor task starts before predecessor finishes
   */
  getOverlapPercentage(): number {
    const reduction = this._originalLag.toHours() - this._proposedLag.toHours();
    if (this._originalLag.toHours() === 0) return 0;
    return (reduction / this._originalLag.toHours()) * 100;
  }

  /**
   * Get risk score (0-100, higher is riskier)
   */
  getRiskScore(): number {
    const riskLevelWeights: Record<RiskLevel, number> = {
      low: 20,
      moderate: 50,
      high: 80,
      extreme: 100
    };
    
    const baseScore = riskLevelWeights[this._riskLevel];
    const probabilityFactor = this._reworkProbability * 20; // Up to 20 points
    
    return Math.min(100, baseScore + probabilityFactor);
  }

  /**
   * Calculate risk-adjusted benefit score
   * Balances time savings against risk
   */
  getBenefitScore(): number {
    const timeSavingsScore = this.getExpectedTimeSavings().toHours() * 10; // 10 points per hour
    const riskPenalty = this.getRiskScore();
    
    return Math.max(0, timeSavingsScore - riskPenalty);
  }

  /**
   * Check if fast tracking is recommended
   */
  isRecommended(): boolean {
    // Recommend if:
    // 1. Risk is low or moderate AND
    // 2. Expected time savings > 0 AND
    // 3. Risk-adjusted benefit score > 50
    
    const acceptableRisk = this._riskLevel === 'low' || this._riskLevel === 'moderate';
    const hasTimeSavings = this.getExpectedTimeSavings().toHours() > 0;
    const goodBenefit = this.getBenefitScore() > 50;
    
    return acceptableRisk && hasTimeSavings && goodBenefit;
  }

  /**
   * Get recommendation with reasoning
   */
  getRecommendation(): FastTrackRecommendation {
    const score = this.getBenefitScore();
    const risk = this.getRiskScore();
    const expectedSavings = this.getExpectedTimeSavings();

    if (this._riskLevel === 'extreme' || risk > 80) {
      return {
        decision: 'reject',
        reason: 'Risk too high - potential for significant rework',
        confidence: 'high'
      };
    }

    if (score > 100 && expectedSavings.toHours() > 16) {
      return {
        decision: 'accept',
        reason: `Excellent time savings (${expectedSavings.toDays().toFixed(1)} days) with manageable risk`,
        confidence: 'high'
      };
    }

    if (score > 50 && this._riskLevel === 'low') {
      return {
        decision: 'accept',
        reason: 'Good time savings with low risk',
        confidence: 'medium'
      };
    }

    if (score > 30) {
      return {
        decision: 'review',
        reason: 'Moderate benefit but requires careful risk management',
        confidence: 'medium'
      };
    }

    return {
      decision: 'reject',
      reason: 'Limited time savings do not justify the risk',
      confidence: 'high'
    };
  }

  /**
   * Format for display
   */
  toString(): string {
    const savings = this._timeSavings.toDays().toFixed(1);
    return `${this._taskName} → ${this._successorName}: -${savings} days (${this._riskLevel} risk, ${(this._reworkProbability * 100).toFixed(0)}% rework chance)`;
  }

  /**
   * Compare fast tracking options by benefit score
   */
  static compareByBenefit(a: FastTracking, b: FastTracking): number {
    return b.getBenefitScore() - a.getBenefitScore();
  }

  /**
   * Compare fast tracking options by risk
   */
  static compareByRisk(a: FastTracking, b: FastTracking): number {
    return a.getRiskScore() - b.getRiskScore();
  }
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface FastTrackRecommendation {
  decision: 'accept' | 'review' | 'reject';
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}
