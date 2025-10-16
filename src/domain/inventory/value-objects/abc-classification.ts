import { Result, ValueObject } from '../../shared'

export type ABCCategory = 'A' | 'B' | 'C'

interface ABCClassificationProps extends Record<string, unknown> {
  category: ABCCategory
  annualUsageValue: number
  percentageOfTotalValue: number
  calculatedAt: Date
}

export class ABCClassification extends ValueObject<ABCClassificationProps> {
  private constructor(props: ABCClassificationProps) {
    super(props)
  }

  get category(): ABCCategory {
    return this.props.category
  }

  get annualUsageValue(): number {
    return this.props.annualUsageValue
  }

  get percentageOfTotalValue(): number {
    return this.props.percentageOfTotalValue
  }

  get calculatedAt(): Date {
    return this.props.calculatedAt
  }

  public static create(props: ABCClassificationProps): Result<ABCClassification> {
    if (!['A', 'B', 'C'].includes(props.category)) {
      return Result.fail('Category must be A, B, or C')
    }

    if (props.annualUsageValue < 0) {
      return Result.fail('Annual usage value cannot be negative')
    }

    if (props.percentageOfTotalValue < 0 || props.percentageOfTotalValue > 100) {
      return Result.fail('Percentage of total value must be between 0 and 100')
    }

    return Result.ok(new ABCClassification(props))
  }

  public isHighValue(): boolean {
    return this.category === 'A'
  }

  public isMediumValue(): boolean {
    return this.category === 'B'
  }

  public isLowValue(): boolean {
    return this.category === 'C'
  }
}
