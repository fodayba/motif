import { Guard, Result, ValueObject } from '../../shared'
import type { CurrencyCode } from '../../shared'
import type { ActualCost } from './actual-cost'
import type { CostPerformanceIndex } from './cost-performance-index'

type EACProps = {
  amount: number
  currency: CurrencyCode
  method: 'cpi' | 'spi-cpi' | 'new-estimate' | 'bottom-up'
  asOfDate: Date
}

/**
 * Estimate at Completion (EAC)
 * Forecasts the total cost at project completion
 * Multiple calculation methods available
 */
export class EstimateAtCompletion extends ValueObject<EACProps> {
  private constructor(props: EACProps) {
    super(props)
  }

  get amount(): number {
    return this.props.amount
  }

  get currency(): CurrencyCode {
    return this.props.currency
  }

  get method(): EACProps['method'] {
    return this.props.method
  }

  get asOfDate(): Date {
    return this.props.asOfDate
  }

  public static create(props: EACProps): Result<EstimateAtCompletion> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.amount, argumentName: 'amount' },
      { argument: props.currency, argumentName: 'currency' },
      { argument: props.method, argumentName: 'method' },
      { argument: props.asOfDate, argumentName: 'asOfDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.amount < 0) {
      return Result.fail('EAC cannot be negative')
    }

    return Result.ok(new EstimateAtCompletion(props))
  }

  /**
   * Calculate EAC using CPI method (most common)
   * EAC = BAC / CPI
   * Assumes current cost performance will continue
   */
  public static calculateUsingCPI(
    budgetAtCompletion: number,
    currency: CurrencyCode,
    cpi: CostPerformanceIndex,
  ): Result<EstimateAtCompletion> {
    if (budgetAtCompletion < 0) {
      return Result.fail('budget at completion cannot be negative')
    }

    if (cpi.value === 0) {
      return Result.fail('CPI cannot be zero for EAC calculation')
    }

    const eacAmount = budgetAtCompletion / cpi.value

    return EstimateAtCompletion.create({
      amount: eacAmount,
      currency,
      method: 'cpi',
      asOfDate: cpi.asOfDate,
    })
  }

  /**
   * Calculate EAC for atypical variances
   * EAC = AC + (BAC - EV)
   * Assumes future work will be performed at budgeted rate
   */
  public static calculateForAtypicalVariance(
    budgetAtCompletion: number,
    currency: CurrencyCode,
    actualCost: ActualCost,
    earnedValue: number,
  ): Result<EstimateAtCompletion> {
    if (budgetAtCompletion < 0) {
      return Result.fail('budget at completion cannot be negative')
    }

    if (actualCost.currency !== currency) {
      return Result.fail('currency mismatch')
    }

    const eacAmount = actualCost.amount + (budgetAtCompletion - earnedValue)

    return EstimateAtCompletion.create({
      amount: eacAmount,
      currency,
      method: 'new-estimate',
      asOfDate: actualCost.asOfDate,
    })
  }

  /**
   * Calculate variance at completion
   * VAC = BAC - EAC
   */
  public calculateVarianceAtCompletion(budgetAtCompletion: number): number {
    return budgetAtCompletion - this.amount
  }
}
