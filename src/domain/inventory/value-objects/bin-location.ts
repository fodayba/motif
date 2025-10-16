import { Result, ValueObject } from '../../shared'

interface BinLocationProps extends Record<string, unknown> {
  warehouse: string
  zone: string
  aisle: string
  rack: string
  shelf: string
  bin: string
}

export class BinLocation extends ValueObject<BinLocationProps> {
  private constructor(props: BinLocationProps) {
    super(props)
  }

  get warehouse(): string {
    return this.props.warehouse
  }

  get zone(): string {
    return this.props.zone
  }

  get aisle(): string {
    return this.props.aisle
  }

  get rack(): string {
    return this.props.rack
  }

  get shelf(): string {
    return this.props.shelf
  }

  get bin(): string {
    return this.props.bin
  }

  public static create(props: BinLocationProps): Result<BinLocation> {
    if (!props.warehouse || props.warehouse.trim().length === 0) {
      return Result.fail('Warehouse identifier is required')
    }

    if (!props.zone || props.zone.trim().length === 0) {
      return Result.fail('Zone identifier is required')
    }

    if (!props.aisle || props.aisle.trim().length === 0) {
      return Result.fail('Aisle identifier is required')
    }

    if (!props.rack || props.rack.trim().length === 0) {
      return Result.fail('Rack identifier is required')
    }

    if (!props.shelf || props.shelf.trim().length === 0) {
      return Result.fail('Shelf identifier is required')
    }

    if (!props.bin || props.bin.trim().length === 0) {
      return Result.fail('Bin identifier is required')
    }

    return Result.ok(
      new BinLocation({
        warehouse: props.warehouse.toUpperCase().trim(),
        zone: props.zone.toUpperCase().trim(),
        aisle: props.aisle.toUpperCase().trim(),
        rack: props.rack.toUpperCase().trim(),
        shelf: props.shelf.toUpperCase().trim(),
        bin: props.bin.toUpperCase().trim(),
      }),
    )
  }

  public toString(): string {
    return `${this.warehouse}-${this.zone}-${this.aisle}-${this.rack}-${this.shelf}-${this.bin}`
  }

  public toShortString(): string {
    return `${this.aisle}${this.rack}-${this.shelf}${this.bin}`
  }
}
