import { Result, ValueObject } from '../core'

type GeoCoordinateProps = {
  latitude: number
  longitude: number
}

export class GeoCoordinate extends ValueObject<GeoCoordinateProps> {
  private constructor(props: GeoCoordinateProps) {
    super(props)
  }

  get latitude(): number {
    return this.props.latitude
  }

  get longitude(): number {
    return this.props.longitude
  }

  public static create(latitude: number, longitude: number): Result<GeoCoordinate> {
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      return Result.fail('latitude must be between -90 and 90')
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      return Result.fail('longitude must be between -180 and 180')
    }

    return Result.ok(new GeoCoordinate({ latitude, longitude }))
  }
}
