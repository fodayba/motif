import { AggregateRoot, Guard, Result } from '../../shared'

export interface MetricSnapshotProps {
  metric: string
  value: number
  dimensions?: Record<string, string>
  capturedAt: Date
  comparedTo?: number | null
}

export class MetricSnapshot extends AggregateRoot<MetricSnapshotProps> {
  get metric(): string {
    return this.props.metric
  }

  get value(): number {
    return this.props.value
  }

  get dimensions(): Record<string, string> | undefined {
    return this.props.dimensions
  }

  get capturedAt(): Date {
    return this.props.capturedAt
  }

  get comparedTo(): number | null {
    return this.props.comparedTo ?? null
  }

  public static create(props: MetricSnapshotProps): Result<MetricSnapshot> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.metric, argumentName: 'metric' },
      { argument: props.value, argumentName: 'value' },
      { argument: props.capturedAt, argumentName: 'capturedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.metric.trim().length === 0) {
      return Result.fail('metric cannot be empty')
    }

    return Result.ok(new MetricSnapshot({ ...props }))
  }
}
