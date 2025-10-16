import { Result } from '../../shared/core/result';
import { Duration } from './duration';
import { ResourceProfile } from './resource-profile';

/**
 * Leveling Result Value Object
 * Represents the outcome of resource leveling algorithm
 */
export class LevelingResult {
  private readonly _originalDuration: Duration
  private readonly _leveledDuration: Duration
  private readonly _delayedTasks: DelayedTask[]
  private readonly _resourceProfiles: ResourceProfile[]
  private readonly _algorithm: LevelingAlgorithm
  private readonly _metrics: LevelingMetrics

  private constructor(
    originalDuration: Duration,
    leveledDuration: Duration,
    delayedTasks: DelayedTask[],
    resourceProfiles: ResourceProfile[],
    algorithm: LevelingAlgorithm,
    metrics: LevelingMetrics
  ) {
    this._originalDuration = originalDuration
    this._leveledDuration = leveledDuration
    this._delayedTasks = delayedTasks
    this._resourceProfiles = resourceProfiles
    this._algorithm = algorithm
    this._metrics = metrics
  }

  get originalDuration(): Duration {
    return this._originalDuration;
  }

  get leveledDuration(): Duration {
    return this._leveledDuration;
  }

  get delayedTasks(): DelayedTask[] {
    return [...this._delayedTasks];
  }

  get resourceProfiles(): ResourceProfile[] {
    return [...this._resourceProfiles];
  }

  get algorithm(): LevelingAlgorithm {
    return this._algorithm;
  }

  get metrics(): LevelingMetrics {
    return { ...this._metrics };
  }

  /**
   * Create leveling result
   */
  static create(props: {
    originalDuration: Duration;
    leveledDuration: Duration;
    delayedTasks: DelayedTask[];
    resourceProfiles: ResourceProfile[];
    algorithm: LevelingAlgorithm;
  }): Result<LevelingResult> {
    // Calculate metrics
    const metrics = LevelingResult.calculateMetrics(props);

    return Result.ok(
      new LevelingResult(
        props.originalDuration,
        props.leveledDuration,
        props.delayedTasks,
        props.resourceProfiles,
        props.algorithm,
        metrics
      )
    );
  }

  /**
   * Calculate leveling metrics
   */
  private static calculateMetrics(props: {
    originalDuration: Duration;
    leveledDuration: Duration;
    delayedTasks: DelayedTask[];
    resourceProfiles: ResourceProfile[];
  }): LevelingMetrics {
    // Schedule impact
    const scheduleExtension = props.leveledDuration.toHours() - props.originalDuration.toHours();
    const scheduleImpactPercent = (scheduleExtension / props.originalDuration.toHours()) * 100;

    // Resource smoothness improvement
    const originalSmoothness = props.resourceProfiles.reduce(
      (sum, p) => sum + p.calculateSmoothness(),
      0
    ) / props.resourceProfiles.length;

    // Overallocation resolution
    const totalOverallocations = props.resourceProfiles.reduce(
      (sum, p) => sum + p.getOverallocationPeriods().length,
      0
    );

    // Peak utilization
    const peakUtilizations = props.resourceProfiles.map(p => p.getUtilizationPercentage());
    const maxUtilization = Math.max(...peakUtilizations, 0);
    const avgUtilization = peakUtilizations.reduce((a, b) => a + b, 0) / peakUtilizations.length;

    return {
      scheduleExtensionHours: scheduleExtension,
      scheduleImpactPercent,
      tasksDelayed: props.delayedTasks.length,
      totalDelayHours: props.delayedTasks.reduce((sum, t) => sum + t.delayHours, 0),
      overallocationsResolved: totalOverallocations,
      resourceSmoothness: originalSmoothness,
      peakUtilization: maxUtilization,
      averageUtilization: avgUtilization
    };
  }

  /**
   * Check if leveling improved resource usage
   */
  hasImprovedResourceUsage(): boolean {
    // Check if overallocations were resolved
    const hasOverallocations = this._resourceProfiles.some(
      p => p.getOverallocationPeriods().length > 0
    );
    
    return !hasOverallocations;
  }

  /**
   * Get schedule impact in days
   */
  getScheduleImpactDays(): number {
    const extensionHours = this._leveledDuration.toHours() - this._originalDuration.toHours();
    return extensionHours / 8; // Convert to days
  }

  /**
   * Get most impacted tasks
   */
  getMostImpactedTasks(limit: number = 5): DelayedTask[] {
    return [...this._delayedTasks]
      .sort((a, b) => b.delayHours - a.delayHours)
      .slice(0, limit);
  }

  /**
   * Get resource utilization summary
   */
  getResourceUtilizationSummary(): ResourceUtilizationSummary[] {
    return this._resourceProfiles.map(profile => ({
      resourceId: profile.constraint.resourceId,
      resourceName: profile.constraint.resourceName,
      peakAllocation: profile.getPeakAllocation(),
      averageAllocation: profile.getAverageAllocation(),
      utilizationPercent: profile.getUtilizationPercentage(),
      smoothness: profile.calculateSmoothness(),
      isLevel: profile.isLevel()
    }));
  }

  /**
   * Get leveling effectiveness score (0-100)
   * Higher scores indicate better leveling with minimal schedule impact
   */
  getEffectivenessScore(): number {
    let score = 100;

    // Penalty for schedule extension (max 30 points)
    const scheduleImpact = Math.min(30, this._metrics.scheduleImpactPercent);
    score -= scheduleImpact;

    // Reward for resolving overallocations (up to 40 points)
    if (this._metrics.overallocationsResolved > 0) {
      score += 40;
    }

    // Penalty for poor resource smoothness (max 20 points)
    const smoothnessPenalty = Math.min(20, this._metrics.resourceSmoothness / 2);
    score -= smoothnessPenalty;

    // Reward for balanced utilization (up to 10 points)
    const utilizationBalance = 100 - Math.abs(this._metrics.peakUtilization - this._metrics.averageUtilization);
    score += (utilizationBalance / 100) * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get leveling recommendation
   */
  getRecommendation(): LevelingRecommendation {
    const score = this.getEffectivenessScore();
    const scheduleImpact = this.getScheduleImpactDays();

    if (score >= 80 && scheduleImpact < 5) {
      return {
        status: 'accept',
        message: 'Leveling provides excellent resource optimization with minimal schedule impact',
        confidence: 'high'
      };
    }

    if (score >= 60 && scheduleImpact < 10) {
      return {
        status: 'review',
        message: 'Leveling improves resource usage but extends schedule. Review trade-offs.',
        confidence: 'medium'
      };
    }

    return {
      status: 'reject',
      message: 'Leveling causes significant schedule impact. Consider alternative approaches.',
      confidence: 'low'
    };
  }

  /**
   * Format for display
   */
  toString(): string {
    const impact = this.getScheduleImpactDays();
    const score = this.getEffectivenessScore();
    
    return `${this._algorithm}: ${this._delayedTasks.length} tasks delayed, +${impact.toFixed(1)} days, Score: ${score.toFixed(0)}/100`;
  }
}

export type LevelingAlgorithm =
  | 'minimum-total-float' // Delay tasks with most float first
  | 'minimum-late-finish' // Delay tasks that finish latest
  | 'minimum-late-start' // Delay tasks that start latest
  | 'shortest-duration' // Delay shortest tasks first
  | 'longest-duration'; // Delay longest tasks first

export interface DelayedTask {
  taskId: string;
  taskName: string;
  originalStart: Date;
  newStart: Date;
  delayHours: number;
  reason: string;
}

export interface LevelingMetrics {
  scheduleExtensionHours: number;
  scheduleImpactPercent: number;
  tasksDelayed: number;
  totalDelayHours: number;
  overallocationsResolved: number;
  resourceSmoothness: number;
  peakUtilization: number;
  averageUtilization: number;
}

export interface ResourceUtilizationSummary {
  resourceId: string;
  resourceName: string;
  peakAllocation: number;
  averageAllocation: number;
  utilizationPercent: number;
  smoothness: number;
  isLevel: boolean;
}

export interface LevelingRecommendation {
  status: 'accept' | 'review' | 'reject';
  message: string;
  confidence: 'high' | 'medium' | 'low';
}
