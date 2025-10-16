import { Result } from '../../shared/core/result';

/**
 * Resource Constraint Value Object
 * Represents resource availability constraints for scheduling
 */
export class ResourceConstraint {
  private readonly _resourceId: string
  private readonly _resourceName: string
  private readonly _resourceType: ConstraintResourceType
  private readonly _maxUnitsAvailable: number
  private readonly _costPerUnit: number
  private readonly _availablePeriods: AvailabilityPeriod[]

  private constructor(
    resourceId: string,
    resourceName: string,
    resourceType: ConstraintResourceType,
    maxUnitsAvailable: number,
    costPerUnit: number,
    availablePeriods: AvailabilityPeriod[]
  ) {
    this._resourceId = resourceId
    this._resourceName = resourceName
    this._resourceType = resourceType
    this._maxUnitsAvailable = maxUnitsAvailable
    this._costPerUnit = costPerUnit
    this._availablePeriods = availablePeriods
  }

  get resourceId(): string {
    return this._resourceId;
  }

  get resourceName(): string {
    return this._resourceName;
  }

  get resourceType(): ConstraintResourceType {
    return this._resourceType;
  }

  get maxUnitsAvailable(): number {
    return this._maxUnitsAvailable;
  }

  get costPerUnit(): number {
    return this._costPerUnit;
  }

  get availablePeriods(): AvailabilityPeriod[] {
    return [...this._availablePeriods];
  }

  /**
   * Create resource constraint
   */
  static create(props: {
    resourceId: string;
    resourceName: string;
    resourceType: ConstraintResourceType;
    maxUnitsAvailable: number;
    costPerUnit: number;
    availablePeriods?: AvailabilityPeriod[];
  }): Result<ResourceConstraint> {
    if (!props.resourceId || !props.resourceName) {
      return Result.fail('Resource ID and name are required');
    }

    if (props.maxUnitsAvailable <= 0) {
      return Result.fail('Max units available must be positive');
    }

    if (props.costPerUnit < 0) {
      return Result.fail('Cost per unit cannot be negative');
    }

    // Validate availability periods don't overlap
    const periods = props.availablePeriods || [];
    for (let i = 0; i < periods.length; i++) {
      for (let j = i + 1; j < periods.length; j++) {
        if (ResourceConstraint.periodsOverlap(periods[i], periods[j])) {
          return Result.fail('Availability periods cannot overlap');
        }
      }
    }

    return Result.ok(
      new ResourceConstraint(
        props.resourceId,
        props.resourceName,
        props.resourceType,
        props.maxUnitsAvailable,
        props.costPerUnit,
        periods
      )
    );
  }

  /**
   * Check if resource is available during a time period
   */
  isAvailableDuring(startDate: Date, endDate: Date): boolean {
    // If no availability periods specified, assume always available
    if (this._availablePeriods.length === 0) {
      return true;
    }

    // Check if any availability period covers the requested period
    return this._availablePeriods.some(period => 
      period.startDate <= startDate && period.endDate >= endDate
    );
  }

  /**
   * Get available units during a specific period
   */
  getAvailableUnits(startDate: Date, endDate: Date): number {
    if (!this.isAvailableDuring(startDate, endDate)) {
      return 0;
    }

    // Find overlapping periods and return minimum available units
    const overlapping = this._availablePeriods.filter(period =>
      ResourceConstraint.periodsOverlap(
        { startDate, endDate },
        { startDate: period.startDate, endDate: period.endDate }
      )
    );

    if (overlapping.length === 0) {
      return this._maxUnitsAvailable;
    }

    return Math.min(
      this._maxUnitsAvailable,
      ...overlapping.map(p => p.unitsAvailable || this._maxUnitsAvailable)
    );
  }

  /**
   * Calculate cost for using this resource
   */
  calculateCost(units: number, durationHours: number): number {
    return units * durationHours * this._costPerUnit;
  }

  /**
   * Check if allocation exceeds constraint
   */
  isOverallocated(allocatedUnits: number, startDate: Date, endDate: Date): boolean {
    const available = this.getAvailableUnits(startDate, endDate);
    return allocatedUnits > available;
  }

  /**
   * Get utilization percentage
   */
  getUtilization(allocatedUnits: number, startDate: Date, endDate: Date): number {
    const available = this.getAvailableUnits(startDate, endDate);
    if (available === 0) return 0;
    return (allocatedUnits / available) * 100;
  }

  /**
   * Check if two periods overlap
   */
  private static periodsOverlap(
    period1: { startDate: Date; endDate: Date },
    period2: { startDate: Date; endDate: Date }
  ): boolean {
    return period1.startDate <= period2.endDate && period2.startDate <= period1.endDate;
  }

  /**
   * Format for display
   */
  toString(): string {
    return `${this._resourceName} (${this._resourceType}): ${this._maxUnitsAvailable} units @ $${this._costPerUnit}/hr`;
  }
}

export type ConstraintResourceType = 
  | 'labor'
  | 'equipment'
  | 'material'
  | 'subcontractor'
  | 'facility';

export interface AvailabilityPeriod {
  startDate: Date;
  endDate: Date;
  unitsAvailable?: number; // If not specified, use maxUnitsAvailable
}
