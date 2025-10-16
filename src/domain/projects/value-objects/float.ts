import { Result } from '../../shared/core/result';
import { Duration } from './duration';

/**
 * Float Value Object
 * Represents task float (slack) in CPM scheduling
 * Float = Latest Start - Earliest Start (or Latest Finish - Earliest Finish)
 */
export class Float {
  private readonly _totalFloat: Duration
  private readonly _freeFloat: Duration

  private constructor(
    totalFloat: Duration,
    freeFloat: Duration
  ) {
    this._totalFloat = totalFloat
    this._freeFloat = freeFloat
  }

  get totalFloat(): Duration {
    return this._totalFloat;
  }

  get freeFloat(): Duration {
    return this._freeFloat;
  }

  /**
   * Create float
   */
  static create(totalFloat: Duration, freeFloat: Duration): Result<Float> {
    // Free float cannot exceed total float
    if (freeFloat.toHours() > totalFloat.toHours()) {
      return Result.fail('Free float cannot exceed total float');
    }

    return Result.ok(new Float(totalFloat, freeFloat));
  }

  /**
   * Calculate total float
   * TF = LS - ES or LF - EF
   */
  static calculateTotalFloat(
    latestStart: Date,
    earliestStart: Date
  ): Result<Float> {
    const diffMs = latestStart.getTime() - earliestStart.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      return Result.fail('Latest start cannot be before earliest start');
    }

    const totalFloatResult = Duration.fromHours(diffHours);
    if (!totalFloatResult.isSuccess) {
      return Result.fail(totalFloatResult.error!);
    }

    // Default free float to zero (needs successor analysis)
    const freeFloatResult = Duration.fromHours(0);
    if (!freeFloatResult.isSuccess) {
      return Result.fail(freeFloatResult.error!);
    }

    return Float.create(totalFloatResult.value!, freeFloatResult.value!);
  }

  /**
   * Calculate free float
   * FF = ES(successor) - EF(current)
   */
  static calculateFreeFloat(
    currentEarliestFinish: Date,
    successorEarliestStart: Date
  ): Result<Duration> {
    const diffMs = successorEarliestStart.getTime() - currentEarliestFinish.getTime();
    const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));

    return Duration.fromHours(diffHours);
  }

  /**
   * Check if task is on critical path
   * (zero or near-zero total float)
   */
  isCritical(tolerance: number = 0.1): boolean {
    return this._totalFloat.toHours() <= tolerance;
  }

  /**
   * Check if task is near-critical
   */
  isNearCritical(threshold: number = 8): boolean {
    const hours = this._totalFloat.toHours();
    return hours > 0 && hours <= threshold;
  }

  /**
   * Get float status
   */
  get status(): FloatStatus {
    if (this.isCritical()) {
      return 'critical';
    }
    if (this.isNearCritical()) {
      return 'near-critical';
    }
    return 'normal';
  }

  /**
   * Get flexibility indicator (0-1 scale)
   * 0 = critical, 1 = high flexibility
   */
  getFlexibility(): number {
    const hours = this._totalFloat.toHours();
    // Normalize to 0-1 scale (assuming 40 hours is highly flexible)
    return Math.min(1, hours / 40);
  }

  /**
   * Check if task can be delayed without impacting project
   */
  canDelayBy(duration: Duration): boolean {
    return duration.toHours() <= this._totalFloat.toHours();
  }

  /**
   * Format for display
   */
  toString(): string {
    return `TF: ${this._totalFloat.toString()}, FF: ${this._freeFloat.toString()} (${this.status})`;
  }

  /**
   * Zero float (critical path)
   */
  static zero(): Float {
    return new Float(Duration.zero(), Duration.zero());
  }
}

export type FloatStatus = 'critical' | 'near-critical' | 'normal';
