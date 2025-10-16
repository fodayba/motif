import { Guard, Result, ValueObject } from '../../shared'
import type { CurrencyCode } from '../../shared'

type PlannedValueProps = {
  amount: number
  currency: CurrencyCode
  asOfDate: Date
}

/**
 * Planned Value (PV) - Also known as Budgeted Cost of Work Scheduled (BCWS)
 * The authorized budget assigned to scheduled work to be accomplished
 */
export class PlannedValue extends ValueObject<PlannedValueProps> {
  private constructor(props: PlannedValueProps) {
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

  public static create(props: PlannedValueProps): Result<PlannedValue> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.amount, argumentName: 'amount' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.amount < 0) {
      return Result.fail('planned value cannot be negative')
    }

    return Result.ok(new PlannedValue(props))
  }

  /**
   * Calculate PV based on budget at completion and schedule progress
   * PV = BAC × (Time Elapsed / Total Scheduled Time)
   */
  public static calculateFromSchedule(
    budgetAtCompletion: number,
    currency: CurrencyCode,
    projectStartDate: Date,
    projectEndDate: Date,
    asOfDate: Date,
  ): Result<PlannedValue> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: budgetAtCompletion, argumentName: 'budgetAtCompletion' },
      { argument: currency, argumentName: 'currency' },
      { argument: projectStartDate, argumentName: 'projectStartDate' },
      { argument: projectEndDate, argumentName: 'projectEndDate' },
      { argument: asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (budgetAtCompletion < 0) {
      return Result.fail('budget at completion cannot be negative')
    }

    if (projectStartDate >= projectEndDate) {
      return Result.fail('project start date must be before end date')
    }

    const totalDuration = projectEndDate.getTime() - projectStartDate.getTime()
    const elapsedTime = Math.max(0, asOfDate.getTime() - projectStartDate.getTime())
    const scheduledProgress = Math.min(1, elapsedTime / totalDuration)

    const pvAmount = budgetAtCompletion * scheduledProgress

    return PlannedValue.create({
      amount: pvAmount,
      currency,
      asOfDate,
    })
  }
}
