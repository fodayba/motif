import { Result, ValueObject, GeoCoordinate, Guard } from '../../shared'

type ProjectLocationProps = {
  addressLine1: string
  addressLine2?: string
  city: string
  stateProvince?: string
  postalCode?: string
  country: string
  coordinate?: GeoCoordinate
}

export class ProjectLocation extends ValueObject<ProjectLocationProps> {
  private constructor(props: ProjectLocationProps) {
    super(props)
  }

  get addressLine1(): string {
    return this.props.addressLine1
  }

  get addressLine2(): string | undefined {
    return this.props.addressLine2
  }

  get city(): string {
    return this.props.city
  }

  get stateProvince(): string | undefined {
    return this.props.stateProvince
  }

  get postalCode(): string | undefined {
    return this.props.postalCode
  }

  get country(): string {
    return this.props.country
  }

  get coordinate(): GeoCoordinate | undefined {
    return this.props.coordinate
  }

  public static create(props: ProjectLocationProps): Result<ProjectLocation> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.addressLine1, argumentName: 'addressLine1' },
      { argument: props.city, argumentName: 'city' },
      { argument: props.country, argumentName: 'country' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(
      new ProjectLocation({
        addressLine1: props.addressLine1.trim(),
        addressLine2: props.addressLine2?.trim(),
        city: props.city.trim(),
        stateProvince: props.stateProvince?.trim(),
        postalCode: props.postalCode?.trim(),
        country: props.country.trim(),
        coordinate: props.coordinate,
      }),
    )
  }
}
