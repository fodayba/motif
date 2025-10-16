import { Result } from '../../shared/core/result';
import { Duration } from './duration';

/**
 * Crashing Value Object
 * Represents schedule compression by adding resources to shorten task durations
 * Crashing = Adding more resources to critical path tasks to reduce duration
 */
export class Crashing {
  private readonly _taskId: string
  private readonly _taskName: string
  private readonly _normalDuration: Duration
  private readonly _crashedDuration: Duration
  private readonly _normalCost: number
  private readonly _crashedCost: number
  private readonly _maxCrashHours: number

  private constructor(
    taskId: string,
    taskName: string,
    normalDuration: Duration,
    crashedDuration: Duration,
    normalCost: number,
    crashedCost: number,
    maxCrashHours: number
  ) {
    this._taskId = taskId
    this._taskName = taskName
    this._normalDuration = normalDuration
    this._crashedDuration = crashedDuration
    this._normalCost = normalCost
    this._crashedCost = crashedCost
    this._maxCrashHours = maxCrashHours
  }

  get taskId(): string {
    return this._taskId;
  }

  get taskName(): string {
    return this._taskName;
  }

  get normalDuration(): Duration {
    return this._normalDuration;
  }

  get crashedDuration(): Duration {
    return this._crashedDuration;
  }

  get normalCost(): number {
    return this._normalCost;
  }

  get crashedCost(): number {
    return this._crashedCost;
  }

  get maxCrashHours(): number {
    return this._maxCrashHours;
  }

  /**
   * Create crashing option
   */
  static create(props: {
    taskId: string;
    taskName: string;
    normalDuration: Duration;
    crashedDuration: Duration;
    normalCost: number;
    crashedCost: number;
  }): Result<Crashing> {
    // Validate crashed duration is shorter than normal
    if (props.crashedDuration.toHours() >= props.normalDuration.toHours()) {
      return Result.fail('Crashed duration must be shorter than normal duration');
    }

    // Validate cost increase
    if (props.crashedCost < props.normalCost) {
      return Result.fail('Crashed cost must be greater than or equal to normal cost');
    }

    const maxCrashHours = props.normalDuration.toHours() - props.crashedDuration.toHours();

    return Result.ok(
      new Crashing(
        props.taskId,
        props.taskName,
        props.normalDuration,
        props.crashedDuration,
        props.normalCost,
        props.crashedCost,
        maxCrashHours
      )
    );
  }

  /**
   * Calculate crash cost per hour (cost slope)
   * Cost Slope = (Crashed Cost - Normal Cost) / (Normal Duration - Crashed Duration)
   */
  getCostSlope(): number {
    const costIncrease = this._crashedCost - this._normalCost;
    const timeReduction = this._normalDuration.toHours() - this._crashedDuration.toHours();
    
    if (timeReduction === 0) return 0;
    return costIncrease / timeReduction;
  }

  /**
   * Calculate cost for specific duration reduction
   */
  calculateCostForReduction(reductionHours: number): number {
    if (reductionHours <= 0) return this._normalCost;
    if (reductionHours >= this._maxCrashHours) return this._crashedCost;
    
    const costSlope = this.getCostSlope();
    return this._normalCost + (costSlope * reductionHours);
  }

  /**
   * Get duration after crashing by specified hours
   */
  getDurationAfterCrash(crashHours: number): Duration {
    const clampedCrash = Math.max(0, Math.min(crashHours, this._maxCrashHours));
    const newHours = this._normalDuration.toHours() - clampedCrash;
    const result = Duration.fromHours(newHours);
    return result.isSuccess ? result.value! : Duration.zero();
  }

  /**
   * Check if task can be crashed further
   */
  canCrashMore(currentCrashHours: number): boolean {
    return currentCrashHours < this._maxCrashHours;
  }

  /**
   * Get crash efficiency (time saved per dollar spent)
   * Higher values indicate better crash candidates
   */
  getCrashEfficiency(): number {
    const timeSaved = this._maxCrashHours;
    const costIncrease = this._crashedCost - this._normalCost;
    
    if (costIncrease === 0) return Infinity;
    return timeSaved / costIncrease;
  }

  /**
   * Get ROI of crashing (time saved relative to cost increase)
   */
  getCrashROI(): number {
    const percentTimeReduction = (this._maxCrashHours / this._normalDuration.toHours()) * 100;
    const percentCostIncrease = ((this._crashedCost - this._normalCost) / this._normalCost) * 100;
    
    if (percentCostIncrease === 0) return Infinity;
    return percentTimeReduction / percentCostIncrease;
  }

  /**
   * Format for display
   */
  toString(): string {
    const costSlope = this.getCostSlope();
    return `${this._taskName}: -${this._maxCrashHours}hrs @ $${costSlope.toFixed(2)}/hr`;
  }

  /**
   * Compare crash options by cost efficiency
   */
  static compareByCostEfficiency(a: Crashing, b: Crashing): number {
    return a.getCostSlope() - b.getCostSlope();
  }

  /**
   * Compare crash options by efficiency (time/cost ratio)
   */
  static compareByEfficiency(a: Crashing, b: Crashing): number {
    return b.getCrashEfficiency() - a.getCrashEfficiency();
  }
}
