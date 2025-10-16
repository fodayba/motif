import { Result } from '../../shared/core/result';
import { Duration } from './duration';
import { Crashing } from './crashing';
import { FastTracking } from './fast-tracking';

/**
 * Compression Result Value Object
 * Represents the outcome of schedule compression analysis (crashing + fast tracking)
 */
export class CompressionResult {
  private readonly _originalDuration: Duration
  private readonly _compressedDuration: Duration
  private readonly _crashingOptions: Crashing[]
  private readonly _fastTrackingOptions: FastTracking[]
  private readonly _appliedCrashes: AppliedCrash[]
  private readonly _appliedFastTracks: AppliedFastTrack[]
  private readonly _totalCostIncrease: number
  private readonly _totalRiskScore: number

  private constructor(
    originalDuration: Duration,
    compressedDuration: Duration,
    crashingOptions: Crashing[],
    fastTrackingOptions: FastTracking[],
    appliedCrashes: AppliedCrash[],
    appliedFastTracks: AppliedFastTrack[],
    totalCostIncrease: number,
    totalRiskScore: number
  ) {
    this._originalDuration = originalDuration
    this._compressedDuration = compressedDuration
    this._crashingOptions = crashingOptions
    this._fastTrackingOptions = fastTrackingOptions
    this._appliedCrashes = appliedCrashes
    this._appliedFastTracks = appliedFastTracks
    this._totalCostIncrease = totalCostIncrease
    this._totalRiskScore = totalRiskScore
  }

  get originalDuration(): Duration {
    return this._originalDuration;
  }

  get compressedDuration(): Duration {
    return this._compressedDuration;
  }

  get crashingOptions(): Crashing[] {
    return [...this._crashingOptions];
  }

  get fastTrackingOptions(): FastTracking[] {
    return [...this._fastTrackingOptions];
  }

  get appliedCrashes(): AppliedCrash[] {
    return [...this._appliedCrashes];
  }

  get appliedFastTracks(): AppliedFastTrack[] {
    return [...this._appliedFastTracks];
  }

  get totalCostIncrease(): number {
    return this._totalCostIncrease;
  }

  get totalRiskScore(): number {
    return this._totalRiskScore;
  }

  /**
   * Create compression result
   */
  static create(props: {
    originalDuration: Duration;
    compressedDuration: Duration;
    crashingOptions: Crashing[];
    fastTrackingOptions: FastTracking[];
    appliedCrashes: AppliedCrash[];
    appliedFastTracks: AppliedFastTrack[];
    totalCostIncrease: number;
  }): Result<CompressionResult> {
    // Calculate total risk score
    const totalRiskScore = props.appliedFastTracks.reduce(
      (sum, ft) => sum + ft.riskScore,
      0
    ) / Math.max(1, props.appliedFastTracks.length);

    return Result.ok(
      new CompressionResult(
        props.originalDuration,
        props.compressedDuration,
        props.crashingOptions,
        props.fastTrackingOptions,
        props.appliedCrashes,
        props.appliedFastTracks,
        props.totalCostIncrease,
        totalRiskScore
      )
    );
  }

  /**
   * Get time saved in hours
   */
  getTimeSavedHours(): number {
    return this._originalDuration.toHours() - this._compressedDuration.toHours();
  }

  /**
   * Get time saved in days
   */
  getTimeSavedDays(): number {
    return this.getTimeSavedHours() / 8;
  }

  /**
   * Get compression percentage
   */
  getCompressionPercentage(): number {
    const saved = this.getTimeSavedHours();
    const original = this._originalDuration.toHours();
    if (original === 0) return 0;
    return (saved / original) * 100;
  }

  /**
   * Get cost per day saved
   */
  getCostPerDaySaved(): number {
    const daysSaved = this.getTimeSavedDays();
    if (daysSaved === 0) return 0;
    return this._totalCostIncrease / daysSaved;
  }

  /**
   * Get compression method breakdown
   */
  getMethodBreakdown(): CompressionMethodBreakdown {
    const crashTimeSaved = this._appliedCrashes.reduce(
      (sum, c) => sum + c.timeSaved,
      0
    );
    const fastTrackTimeSaved = this._appliedFastTracks.reduce(
      (sum, ft) => sum + ft.timeSaved,
      0
    );
    
    const crashCost = this._appliedCrashes.reduce(
      (sum, c) => sum + c.costIncrease,
      0
    );
    const fastTrackRisk = this._appliedFastTracks.reduce(
      (sum, ft) => sum + ft.riskScore,
      0
    ) / Math.max(1, this._appliedFastTracks.length);

    return {
      crashing: {
        tasksAffected: this._appliedCrashes.length,
        timeSavedHours: crashTimeSaved,
        costIncrease: crashCost
      },
      fastTracking: {
        tasksAffected: this._appliedFastTracks.length,
        timeSavedHours: fastTrackTimeSaved,
        averageRiskScore: fastTrackRisk
      }
    };
  }

  /**
   * Get compression strategy summary
   */
  getStrategySummary(): CompressionStrategy {
    const crashPercentage = (this._appliedCrashes.length / 
      (this._appliedCrashes.length + this._appliedFastTracks.length)) * 100;
    
    if (this._appliedCrashes.length === 0 && this._appliedFastTracks.length === 0) {
      return 'none';
    } else if (this._appliedFastTracks.length === 0) {
      return 'crashing-only';
    } else if (this._appliedCrashes.length === 0) {
      return 'fast-tracking-only';
    } else if (crashPercentage > 70) {
      return 'crashing-dominant';
    } else if (crashPercentage < 30) {
      return 'fast-tracking-dominant';
    } else {
      return 'balanced';
    }
  }

  /**
   * Get compression effectiveness score (0-100)
   * Higher scores indicate better compression with acceptable cost/risk
   */
  getEffectivenessScore(): number {
    let score = 0;

    // Points for time saved (up to 50 points)
    const compressionPercent = this.getCompressionPercentage();
    score += Math.min(50, compressionPercent * 2);

    // Penalty for high cost (up to 30 points)
    const costPerDay = this.getCostPerDaySaved();
    if (costPerDay > 10000) score -= 30;
    else if (costPerDay > 5000) score -= 20;
    else if (costPerDay > 2000) score -= 10;

    // Penalty for high risk (up to 20 points)
    if (this._totalRiskScore > 80) score -= 20;
    else if (this._totalRiskScore > 60) score -= 15;
    else if (this._totalRiskScore > 40) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get compression recommendation
   */
  getRecommendation(): CompressionRecommendation {
    const score = this.getEffectivenessScore();
    const saved = this.getTimeSavedDays();
    const costPerDay = this.getCostPerDaySaved();

    if (score >= 70 && saved >= 5) {
      return {
        status: 'accept',
        message: `Excellent compression: ${saved.toFixed(1)} days saved with good cost/risk balance`,
        confidence: 'high'
      };
    }

    if (score >= 50 && saved >= 3 && costPerDay < 5000) {
      return {
        status: 'accept',
        message: `Good compression: ${saved.toFixed(1)} days saved at acceptable cost ($${costPerDay.toFixed(0)}/day)`,
        confidence: 'medium'
      };
    }

    if (score >= 40 && saved >= 2) {
      return {
        status: 'review',
        message: `Moderate compression with trade-offs. Review cost ($${costPerDay.toFixed(0)}/day) and risk (${this._totalRiskScore.toFixed(0)}/100)`,
        confidence: 'medium'
      };
    }

    if (saved < 2) {
      return {
        status: 'reject',
        message: 'Limited time savings do not justify cost and risk',
        confidence: 'high'
      };
    }

    return {
      status: 'reject',
      message: 'Cost/risk too high for time savings achieved',
      confidence: 'high'
    };
  }

  /**
   * Get top compression opportunities not yet applied
   */
  getTopOpportunities(limit: number = 5): CompressionOpportunity[] {
    const opportunities: CompressionOpportunity[] = [];

    // Add crash opportunities
    this._crashingOptions.forEach(crash => {
      const alreadyApplied = this._appliedCrashes.some(ac => ac.taskId === crash.taskId);
      if (!alreadyApplied) {
        opportunities.push({
          type: 'crashing',
          taskId: crash.taskId,
          taskName: crash.taskName,
          timeSavings: crash.maxCrashHours,
          costIncrease: crash.crashedCost - crash.normalCost,
          riskScore: 0,
          efficiency: crash.getCrashEfficiency()
        });
      }
    });

    // Add fast track opportunities
    this._fastTrackingOptions.forEach(ft => {
      const alreadyApplied = this._appliedFastTracks.some(
        aft => aft.taskId === ft.taskId && aft.successorId === ft.successorId
      );
      if (!alreadyApplied) {
        opportunities.push({
          type: 'fast-tracking',
          taskId: ft.taskId,
          taskName: `${ft.taskName} → ${ft.successorName}`,
          timeSavings: ft.timeSavings.toHours(),
          costIncrease: 0,
          riskScore: ft.getRiskScore(),
          efficiency: ft.getBenefitScore()
        });
      }
    });

    return opportunities
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, limit);
  }

  /**
   * Format for display
   */
  toString(): string {
    const saved = this.getTimeSavedDays();
    const cost = this._totalCostIncrease;
    const strategy = this.getStrategySummary();
    
    return `Compression (${strategy}): -${saved.toFixed(1)} days, +$${cost.toLocaleString()}, Risk: ${this._totalRiskScore.toFixed(0)}/100`;
  }
}

export interface AppliedCrash {
  taskId: string;
  taskName: string;
  crashedHours: number;
  timeSaved: number;
  costIncrease: number;
}

export interface AppliedFastTrack {
  taskId: string;
  successorId: string;
  taskNames: string;
  timeSaved: number;
  riskScore: number;
}

export interface CompressionMethodBreakdown {
  crashing: {
    tasksAffected: number;
    timeSavedHours: number;
    costIncrease: number;
  };
  fastTracking: {
    tasksAffected: number;
    timeSavedHours: number;
    averageRiskScore: number;
  };
}

export type CompressionStrategy =
  | 'none'
  | 'crashing-only'
  | 'fast-tracking-only'
  | 'crashing-dominant'
  | 'fast-tracking-dominant'
  | 'balanced';

export interface CompressionRecommendation {
  status: 'accept' | 'review' | 'reject';
  message: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CompressionOpportunity {
  type: 'crashing' | 'fast-tracking';
  taskId: string;
  taskName: string;
  timeSavings: number;
  costIncrease: number;
  riskScore: number;
  efficiency: number;
}
