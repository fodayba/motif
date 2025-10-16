import { Guard, Result, ValueObject } from '../../shared'
import type { EarnedValue } from './earned-value'
import type { PlannedValue } from './planned-value'

type SPIProps = {
  value: number
  asOfDate: Date
}

/**
 * Schedule Performance Index (SPI)
 * Measures schedule efficiency: SPI = EV / PV
 * SPI > 1.0 = Ahead of schedule
 * SPI = 1.0 = On schedule
 * SPI < 1.0 = Behind schedule
 */
export class SchedulePerformanceIndex extends ValueObject<SPIProps> {
  private constructor(props: SPIProps) {
    super(props)
  }

  get value(): number {
    return this.props.value
  }

  get asOfDate(): Date {
    return this.props.asOfDate
  }

  get isAheadOfSchedule(): boolean {
    return this.props.value > 1.0
  }

  get isOnSchedule(): boolean {
    return Math.abs(this.props.value - 1.0) < 0.02 // Within 2% tolerance
  }

  get isBehindSchedule(): boolean {
    return this.props.value < 1.0
  }

  get performanceDescription(): string {
    if (this.isAheadOfSchedule) {
      return 'Ahead of schedule'
    }
    if (this.isOnSchedule) {
      return 'On schedule'
    }
    return 'Behind schedule'
  }

  public static create(props: SPIProps): Result<SchedulePerformanceIndex> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.value, argumentName: 'value' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.value < 0) {
      return Result.fail('SPI cannot be negative')
    }

    return Result.ok(new SchedulePerformanceIndex(props))
  }

  /**
   * Calculate SPI from EV and PV
   * SPI = EV / PV
   */
  public static calculateFromEVAndPV(
    earnedValue: EarnedValue,
    plannedValue: PlannedValue,
  ): Result<SchedulePerformanceIndex> {
    if (earnedValue.currency !== plannedValue.currency) {
      return Result.fail('EV and PV must have the same currency')
    }

    if (plannedValue.amount === 0) {
      return Result.fail('planned value cannot be zero for SPI calculation')
    }

    const spiValue = earnedValue.amount / plannedValue.amount

    return SchedulePerformanceIndex.create({
      value: spiValue,
      asOfDate: earnedValue.asOfDate,
    })
  }
}
