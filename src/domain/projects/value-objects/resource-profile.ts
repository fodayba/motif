import { Result } from '../../shared/core/result';
import { ResourceConstraint } from './resource-constraint';

/**
 * Resource Profile Value Object
 * Represents resource allocation over time for leveling analysis
 */
export class ResourceProfile {
  private readonly _constraint: ResourceConstraint
  private readonly _allocations: ResourceAllocationPoint[]

  private constructor(
    constraint: ResourceConstraint,
    allocations: ResourceAllocationPoint[]
  ) {
    this._constraint = constraint
    this._allocations = allocations
  }

  get constraint(): ResourceConstraint {
    return this._constraint;
  }

  get allocations(): ResourceAllocationPoint[] {
    return [...this._allocations];
  }

  /**
   * Create resource profile
   */
  static create(
    constraint: ResourceConstraint,
    allocations: ResourceAllocationPoint[]
  ): Result<ResourceProfile> {
    // Sort allocations by date
    const sorted = [...allocations].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    return Result.ok(new ResourceProfile(constraint, sorted));
  }

  /**
   * Get peak allocation (highest units allocated at any time)
   */
  getPeakAllocation(): number {
    if (this._allocations.length === 0) return 0;
    return Math.max(...this._allocations.map(a => a.unitsAllocated));
  }

  /**
   * Get average allocation
   */
  getAverageAllocation(): number {
    if (this._allocations.length === 0) return 0;
    const sum = this._allocations.reduce((acc, a) => acc + a.unitsAllocated, 0);
    return sum / this._allocations.length;
  }

  /**
   * Get resource utilization percentage
   */
  getUtilizationPercentage(): number {
    const peak = this.getPeakAllocation();
    const maxUnits = this._constraint.maxUnitsAvailable;
    if (maxUnits === 0) return 0;
    return (peak / maxUnits) * 100;
  }

  /**
   * Identify overallocation periods
   */
  getOverallocationPeriods(): OverallocationPeriod[] {
    const overallocations: OverallocationPeriod[] = [];
    let currentPeriod: OverallocationPeriod | null = null;

    for (const allocation of this._allocations) {
      const isOverallocated = allocation.unitsAllocated > this._constraint.maxUnitsAvailable;

      if (isOverallocated) {
        if (!currentPeriod) {
          currentPeriod = {
            startDate: allocation.date,
            endDate: allocation.date,
            peakOverallocation: allocation.unitsAllocated - this._constraint.maxUnitsAvailable,
            affectedTasks: [...allocation.taskIds]
          };
        } else {
          currentPeriod.endDate = allocation.date;
          const overallocation = allocation.unitsAllocated - this._constraint.maxUnitsAvailable;
          if (overallocation > currentPeriod.peakOverallocation) {
            currentPeriod.peakOverallocation = overallocation;
          }
          currentPeriod.affectedTasks = [
            ...new Set([...currentPeriod.affectedTasks, ...allocation.taskIds])
          ];
        }
      } else if (currentPeriod) {
        overallocations.push(currentPeriod);
        currentPeriod = null;
      }
    }

    if (currentPeriod) {
      overallocations.push(currentPeriod);
    }

    return overallocations;
  }

  /**
   * Calculate resource smoothness (variance in allocation)
   * Lower values indicate smoother, more level resource usage
   */
  calculateSmoothness(): number {
    if (this._allocations.length < 2) return 0;

    const mean = this.getAverageAllocation();
    const variance = this._allocations.reduce((sum, a) => {
      const diff = a.unitsAllocated - mean;
      return sum + diff * diff;
    }, 0) / this._allocations.length;

    return Math.sqrt(variance); // Standard deviation
  }

  /**
   * Check if profile is level (within tolerance)
   */
  isLevel(tolerancePercentage: number = 10): boolean {
    const peak = this.getPeakAllocation();
    const avg = this.getAverageAllocation();
    if (avg === 0) return true;

    const variation = ((peak - avg) / avg) * 100;
    return variation <= tolerancePercentage;
  }

  /**
   * Get allocation at specific date
   */
  getAllocationAt(date: Date): number {
    const allocation = this._allocations.find(
      a => a.date.toDateString() === date.toDateString()
    );
    return allocation?.unitsAllocated || 0;
  }

  /**
   * Get histogram data for visualization
   */
  getHistogramData(bucketSize: number = 1): HistogramBucket[] {
    const buckets = new Map<number, HistogramBucket>();

    for (const allocation of this._allocations) {
      const bucket = Math.floor(allocation.unitsAllocated / bucketSize) * bucketSize;
      
      if (!buckets.has(bucket)) {
        buckets.set(bucket, {
          minUnits: bucket,
          maxUnits: bucket + bucketSize,
          count: 0,
          totalDays: 0
        });
      }

      const bucketData = buckets.get(bucket)!;
      bucketData.count++;
      bucketData.totalDays++;
    }

    return Array.from(buckets.values()).sort((a, b) => a.minUnits - b.minUnits);
  }

  /**
   * Format for display
   */
  toString(): string {
    const peak = this.getPeakAllocation();
    const avg = this.getAverageAllocation();
    const utilization = this.getUtilizationPercentage();
    
    return `${this._constraint.resourceName}: Peak ${peak.toFixed(1)}, Avg ${avg.toFixed(1)}, Utilization ${utilization.toFixed(1)}%`;
  }
}

export interface ResourceAllocationPoint {
  date: Date;
  unitsAllocated: number;
  taskIds: string[];
}

export interface OverallocationPeriod {
  startDate: Date;
  endDate: Date;
  peakOverallocation: number;
  affectedTasks: string[];
}

export interface HistogramBucket {
  minUnits: number;
  maxUnits: number;
  count: number;
  totalDays: number;
}
