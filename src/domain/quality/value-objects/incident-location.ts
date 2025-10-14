import { GeoCoordinate, Guard, Result, ValueObject } from '../../shared'

type IncidentLocationProps = {
  siteName: string
  area?: string
  coordinate?: GeoCoordinate
}

export class IncidentLocation extends ValueObject<IncidentLocationProps> {
  private constructor(props: IncidentLocationProps) {
    super(props)
  }

  get siteName(): string {
    return this.props.siteName
  }

  get area(): string | undefined {
    return this.props.area
  }

  get coordinate(): GeoCoordinate | undefined {
    return this.props.coordinate
  }

  public static create(props: IncidentLocationProps): Result<IncidentLocation> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.siteName, argumentName: 'siteName' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(
      new IncidentLocation({
        siteName: props.siteName.trim(),
        area: props.area?.trim(),
        coordinate: props.coordinate,
      }),
    )
  }
}
