import { Guard, Result, ValueObject } from '../../shared'

type StorageLocationProps = {
  siteId: string
  zone?: string
  bin?: string
}

export class StorageLocation extends ValueObject<StorageLocationProps> {
  private constructor(props: StorageLocationProps) {
    super(props)
  }

  get siteId(): string {
    return this.props.siteId
  }

  get zone(): string | undefined {
    return this.props.zone
  }

  get bin(): string | undefined {
    return this.props.bin
  }

  public static create(props: StorageLocationProps): Result<StorageLocation> {
    const guardResult = Guard.againstEmptyString(props.siteId, 'siteId')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(
      new StorageLocation({
        siteId: props.siteId.trim(),
        zone: props.zone?.trim(),
        bin: props.bin?.trim(),
      }),
    )
  }
}
