import { Result } from '../../shared/core/result';

/**
 * Duration Value Object
 * Represents task duration with unit conversion support
 */
export class Duration {
  private readonly _value: number
  private readonly _unit: DurationUnit

  private constructor(
    value: number,
    unit: DurationUnit
  ) {
    this._value = value
    this._unit = unit
  }

  get value(): number {
    return this._value;
  }

  get unit(): DurationUnit {
    return this._unit;
  }

  /**
   * Create a duration
   */
  static create(value: number, unit: DurationUnit): Result<Duration> {
    if (value < 0) {
      return Result.fail('Duration must be non-negative');
    }

    if (!Number.isFinite(value)) {
      return Result.fail('Duration must be finite');
    }

    return Result.ok(new Duration(value, unit));
  }

  /**
   * Convert to hours
   */
  toHours(): number {
    switch (this._unit) {
      case 'hours':
        return this._value;
      case 'days':
        return this._value * 8; // Standard 8-hour workday
      case 'weeks':
        return this._value * 40; // Standard 40-hour workweek
      case 'months':
        return this._value * 160; // ~20 working days per month
      default:
        return this._value;
    }
  }

  /**
   * Convert to days
   */
  toDays(): number {
    return this.toHours() / 8;
  }

  /**
   * Convert to weeks
   */
  toWeeks(): number {
    return this.toHours() / 40;
  }

  /**
   * Convert to months
   */
  toMonths(): number {
    return this.toHours() / 160;
  }

  /**
   * Convert to specified unit
   */
  convertTo(unit: DurationUnit): Duration {
    const hours = this.toHours();
    
    let value: number;
    switch (unit) {
      case 'hours':
        value = hours;
        break;
      case 'days':
        value = hours / 8;
        break;
      case 'weeks':
        value = hours / 40;
        break;
      case 'months':
        value = hours / 160;
        break;
      default:
        value = hours;
    }

    return new Duration(value, unit);
  }

  /**
   * Add two durations
   */
  add(other: Duration): Duration {
    const totalHours = this.toHours() + other.toHours();
    return new Duration(totalHours / 8, 'days');
  }

  /**
   * Subtract two durations
   */
  subtract(other: Duration): Duration {
    const totalHours = this.toHours() - other.toHours();
    return new Duration(Math.max(0, totalHours / 8), 'days');
  }

  /**
   * Multiply duration by a factor
   */
  multiply(factor: number): Duration {
    return new Duration(this._value * factor, this._unit);
  }

  /**
   * Compare durations
   */
  isLongerThan(other: Duration): boolean {
    return this.toHours() > other.toHours();
  }

  isShorterThan(other: Duration): boolean {
    return this.toHours() < other.toHours();
  }

  equals(other: Duration): boolean {
    return Math.abs(this.toHours() - other.toHours()) < 0.01;
  }

  /**
   * Format duration for display
   */
  toString(): string {
    return `${this._value.toFixed(2)} ${this._unit}`;
  }

  /**
   * Create from hours
   */
  static fromHours(hours: number): Result<Duration> {
    return Duration.create(hours, 'hours');
  }

  /**
   * Create from days
   */
  static fromDays(days: number): Result<Duration> {
    return Duration.create(days, 'days');
  }

  /**
   * Create from weeks
   */
  static fromWeeks(weeks: number): Result<Duration> {
    return Duration.create(weeks, 'weeks');
  }

  /**
   * Zero duration
   */
  static zero(): Duration {
    return new Duration(0, 'days');
  }
}

export type DurationUnit = 'hours' | 'days' | 'weeks' | 'months';
