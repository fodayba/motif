import { Guard, Result, ValueObject } from '../../shared'
import type { CurrencyCode } from '../../shared'
import type { EarnedValue } from './earned-value'
import type { PlannedValue } from './planned-value'

type ScheduleVarianceProps = {
  amount: number
  currency: CurrencyCode
  asOfDate: Date
}

/**
 * Schedule Variance (SV)
 * Measures schedule performance in monetary terms: SV = EV - PV
 * SV > 0 = Ahead of schedule
 * SV = 0 = On schedule
 * SV < 0 = Behind schedule
 */
export class ScheduleVariance extends ValueObject<ScheduleVarianceProps> {
  private constructor(props: ScheduleVarianceProps) {
    super(props)
  }

  get amount(): number {
    return this.props.amount
  }

  get currency(): CurrencyCode {
    return this.props.currency
  }

  get asOfDate(): Date {
    return this.props.asOfDate
  }

  get isAheadOfSchedule(): boolean {
    return this.props.amount > 0
  }

  get isOnSchedule(): boolean {
    return Math.abs(this.props.amount) < 100 // Within $100 tolerance
  }

  get isBehindSchedule(): boolean {
    return this.props.amount < 0
  }

  public static create(props: ScheduleVarianceProps): Result<ScheduleVariance> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.amount, argumentName: 'amount' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new ScheduleVariance(props))
  }

  /**
   * Calculate SV from EV and PV
   * SV = EV - PV
   */
  public static calculateFromEVAndPV(
    earnedValue: EarnedValue,
    plannedValue: PlannedValue,
  ): Result<ScheduleVariance> {
    if (earnedValue.currency !== plannedValue.currency) {
      return Result.fail('EV and PV must have the same currency')
    }

    const svAmount = earnedValue.amount - plannedValue.amount

    return ScheduleVariance.create({
      amount: svAmount,
      currency: earnedValue.currency,
      asOfDate: earnedValue.asOfDate,
    })
  }
}
