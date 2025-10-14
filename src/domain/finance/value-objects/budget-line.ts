import { Guard, Money, Result, ValueObject } from '../../shared'
import type { CostCategory } from '../enums/cost-category'
import type { CostCode } from './cost-code'

type BudgetLineProps = {
  lineId: string
  costCode: CostCode
  category: CostCategory
  description: string
  planned: Money
  committed: Money
  actual: Money
}

const validateCurrency = (values: Money[]): boolean => {
  if (values.length === 0) {
    return true
  }

  const baseCurrency = values[0].currency
  return values.every((value) => value.currency === baseCurrency)
}

export class BudgetLine extends ValueObject<BudgetLineProps> {
  private constructor(props: BudgetLineProps) {
    super(props)
  }

  get lineId(): string {
    return this.props.lineId
  }

  get costCode(): CostCode {
    return this.props.costCode
  }

  get category(): CostCategory {
    return this.props.category
  }

  get description(): string {
    return this.props.description
  }

  get planned(): Money {
    return this.props.planned
  }

  get committed(): Money {
    return this.props.committed
  }

  get actual(): Money {
    return this.props.actual
  }

  get variance(): number {
    return this.props.planned.amount - this.props.actual.amount
  }

  public static create(props: BudgetLineProps): Result<BudgetLine> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.lineId, argumentName: 'lineId' },
      { argument: props.costCode, argumentName: 'costCode' },
      { argument: props.category, argumentName: 'category' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.planned, argumentName: 'planned' },
      { argument: props.committed, argumentName: 'committed' },
      { argument: props.actual, argumentName: 'actual' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!validateCurrency([props.planned, props.committed, props.actual])) {
      return Result.fail('budget line amounts must share the same currency')
    }

    if (props.description.trim().length === 0) {
      return Result.fail('budget line description cannot be empty')
    }

    return Result.ok(
      new BudgetLine({
        ...props,
        description: props.description.trim(),
      }),
    )
  }
}
