import { Guard, Result, ValueObject } from '../../shared'

type AssetNumberProps = {
  value: string
}

const ASSET_NUMBER_REGEX = /^[A-Z]{2,4}-\d{4,8}$/

export class AssetNumber extends ValueObject<AssetNumberProps> {
  private constructor(props: AssetNumberProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(raw: string): Result<AssetNumber> {
    const guardResult = Guard.againstEmptyString(raw, 'assetNumber')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    const normalized = raw.toUpperCase().trim()

    if (!ASSET_NUMBER_REGEX.test(normalized)) {
      return Result.fail(
        'asset number must follow format: XX-0000 (2-4 letters, dash, 4-8 digits)',
      )
    }

    return Result.ok(new AssetNumber({ value: normalized }))
  }
}
