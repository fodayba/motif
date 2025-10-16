import { Result, ValueObject } from '../../shared'

type OperatingHoursProps = {
  hours: number
}

export class OperatingHours extends ValueObject<OperatingHoursProps> {
  private constructor(props: OperatingHoursProps) {
    super(props)
  }

  get hours(): number {
    return this.props.hours
  }

  public add(additionalHours: number): Result<OperatingHours> {
    return OperatingHours.create(this.hours + additionalHours)
  }

  public subtract(hoursToSubtract: number): Result<OperatingHours> {
    return OperatingHours.create(this.hours - hoursToSubtract)
  }

  public static create(hours: number): Result<OperatingHours> {
    if (Number.isNaN(hours) || hours < 0) {
      return Result.fail('operating hours cannot be negative')
    }

    return Result.ok(new OperatingHours({ hours }))
  }

  public static zero(): OperatingHours {
    return new OperatingHours({ hours: 0 })
  }
}
