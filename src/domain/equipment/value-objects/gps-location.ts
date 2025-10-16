import { GeoCoordinate, Result, ValueObject } from '../../shared'

type GPSLocationProps = {
  coordinate: GeoCoordinate
  accuracy?: number
  altitude?: number
  timestamp: Date
  address?: string
}

export class GPSLocation extends ValueObject<GPSLocationProps> {
  private constructor(props: GPSLocationProps) {
    super(props)
  }

  get coordinate(): GeoCoordinate {
    return this.props.coordinate
  }

  get latitude(): number {
    return this.props.coordinate.latitude
  }

  get longitude(): number {
    return this.props.coordinate.longitude
  }

  get accuracy(): number | undefined {
    return this.props.accuracy
  }

  get altitude(): number | undefined {
    return this.props.altitude
  }

  get timestamp(): Date {
    return this.props.timestamp
  }

  get address(): string | undefined {
    return this.props.address
  }

  public static create(props: {
    coordinate: GeoCoordinate
    accuracy?: number
    altitude?: number
    timestamp?: Date
    address?: string
  }): Result<GPSLocation> {
    if (props.accuracy !== undefined && props.accuracy < 0) {
      return Result.fail('accuracy cannot be negative')
    }

    return Result.ok(
      new GPSLocation({
        coordinate: props.coordinate,
        accuracy: props.accuracy,
        altitude: props.altitude,
        timestamp: props.timestamp ?? new Date(),
        address: props.address,
      }),
    )
  }
}
