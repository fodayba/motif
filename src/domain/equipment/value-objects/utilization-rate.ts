import { Result, ValueObject } from '../../shared'

type UtilizationRateProps = {
  rate: number // 0-100 percentage
}

export class UtilizationRate extends ValueObject<UtilizationRateProps> {
  private constructor(props: UtilizationRateProps) {
    super(props)
  }

  get rate(): number {
    return this.props.rate
  }

  get percentage(): string {
    return `${this.rate.toFixed(2)}%`
  }

  public isLow(): boolean {
    return this.rate < 50
  }

  public isOptimal(): boolean {
    return this.rate >= 70 && this.rate <= 90
  }

  public isHigh(): boolean {
    return this.rate > 90
  }

  public static create(rate: number): Result<UtilizationRate> {
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      return Result.fail('utilization rate must be between 0 and 100')
    }

    return Result.ok(new UtilizationRate({ rate }))
  }

  public static fromUsage(
    hoursUsed: number,
    hoursAvailable: number,
  ): Result<UtilizationRate> {
    if (hoursAvailable === 0) {
      return Result.fail('hours available cannot be zero')
    }

    const rate = (hoursUsed / hoursAvailable) * 100
    return UtilizationRate.create(rate)
  }
}
