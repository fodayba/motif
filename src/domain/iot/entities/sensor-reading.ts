import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'

export interface SensorReadingProps {
  deviceId: UniqueEntityID
  metric: string
  value: number
  unit: string
  capturedAt: Date
  metadata?: Record<string, unknown>
}

export class SensorReading extends AggregateRoot<SensorReadingProps> {
  get deviceId(): UniqueEntityID {
    return this.props.deviceId
  }

  get metric(): string {
    return this.props.metric
  }

  get value(): number {
    return this.props.value
  }

  get unit(): string {
    return this.props.unit
  }

  get capturedAt(): Date {
    return this.props.capturedAt
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata
  }

  public static create(props: SensorReadingProps, id?: UniqueEntityID): Result<SensorReading> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.deviceId, argumentName: 'deviceId' },
      { argument: props.metric, argumentName: 'metric' },
      { argument: props.value, argumentName: 'value' },
      { argument: props.unit, argumentName: 'unit' },
      { argument: props.capturedAt, argumentName: 'capturedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.metric.trim().length === 0) {
      return Result.fail('metric cannot be empty')
    }

    if (props.unit.trim().length === 0) {
      return Result.fail('unit cannot be empty')
    }

    return Result.ok(new SensorReading({ ...props }, id))
  }
}
