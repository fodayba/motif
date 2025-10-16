import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'

export type PackingSlipStatus = 'pending' | 'in-progress' | 'packed' | 'shipped' | 'cancelled'

export type PackageItem = {
  itemId: UniqueEntityID
  itemName: string
  sku: string
  quantity: number
  unit: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: 'in' | 'cm'
  }
}

export type Package = {
  packageNumber: string
  items: PackageItem[]
  weight?: number
  weightUnit?: 'lb' | 'kg'
  dimensions?: {
    length: number
    width: number
    height: number
    unit: 'in' | 'cm'
  }
  trackingNumber?: string
  packedBy?: UniqueEntityID
  packedAt?: Date
}

export type PackingSlipProps = {
  packingSlipNumber: string
  status: PackingSlipStatus
  pickListId: UniqueEntityID
  orderReference: UniqueEntityID
  orderType: 'requisition' | 'transfer' | 'sales-order' | 'work-order'
  shipToName: string
  shipToAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  shipFromWarehouseId: UniqueEntityID
  shipFromWarehouseName: string
  packages: Package[]
  carrierName?: string
  shippingMethod?: string
  estimatedShipDate?: Date
  actualShipDate?: Date
  notes?: string
  createdBy: UniqueEntityID
  createdAt: Date
  updatedAt: Date
}

export class PackingSlip extends AggregateRoot<PackingSlipProps> {
  private constructor(props: PackingSlipProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get packingSlipNumber(): string {
    return this.props.packingSlipNumber
  }

  get status(): PackingSlipStatus {
    return this.props.status
  }

  get pickListId(): UniqueEntityID {
    return this.props.pickListId
  }

  get orderReference(): UniqueEntityID {
    return this.props.orderReference
  }

  get orderType(): string {
    return this.props.orderType
  }

  get shipToName(): string {
    return this.props.shipToName
  }

  get shipToAddress(): PackingSlipProps['shipToAddress'] {
    return this.props.shipToAddress
  }

  get shipFromWarehouseId(): UniqueEntityID {
    return this.props.shipFromWarehouseId
  }

  get shipFromWarehouseName(): string {
    return this.props.shipFromWarehouseName
  }

  get packages(): Package[] {
    return this.props.packages
  }

  get carrierName(): string | undefined {
    return this.props.carrierName
  }

  get shippingMethod(): string | undefined {
    return this.props.shippingMethod
  }

  get estimatedShipDate(): Date | undefined {
    return this.props.estimatedShipDate
  }

  get actualShipDate(): Date | undefined {
    return this.props.actualShipDate
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get createdBy(): UniqueEntityID {
    return this.props.createdBy
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(
    props: PackingSlipProps,
    id?: UniqueEntityID,
  ): Result<PackingSlip> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.packingSlipNumber, argumentName: 'packingSlipNumber' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.pickListId, argumentName: 'pickListId' },
      { argument: props.orderReference, argumentName: 'orderReference' },
      { argument: props.orderType, argumentName: 'orderType' },
      { argument: props.shipToName, argumentName: 'shipToName' },
      { argument: props.shipToAddress, argumentName: 'shipToAddress' },
      { argument: props.shipFromWarehouseId, argumentName: 'shipFromWarehouseId' },
      { argument: props.shipFromWarehouseName, argumentName: 'shipFromWarehouseName' },
      { argument: props.packages, argumentName: 'packages' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.packages.length === 0) {
      return Result.fail('Packing slip must have at least one package')
    }

    return Result.ok(new PackingSlip(props, id))
  }

  public startPacking(): Result<void> {
    if (this.props.status !== 'pending') {
      return Result.fail('Can only start packing pending slips')
    }

    this.props.status = 'in-progress'
    this.props.updatedAt = new Date()

    return Result.ok(undefined as void)
  }

  public packPackage(
    packageNumber: string,
    packedBy: UniqueEntityID,
    trackingNumber?: string,
  ): Result<void> {
    if (this.props.status !== 'in-progress') {
      return Result.fail('Packing slip must be in progress')
    }

    const pkg = this.props.packages.find(p => p.packageNumber === packageNumber)
    if (!pkg) {
      return Result.fail('Package not found')
    }

    pkg.packedBy = packedBy
    pkg.packedAt = new Date()
    if (trackingNumber) {
      pkg.trackingNumber = trackingNumber
    }

    this.props.updatedAt = new Date()

    // Check if all packages are packed
    const allPackagesPacked = this.props.packages.every(p => p.packedAt !== undefined)
    if (allPackagesPacked) {
      this.props.status = 'packed'
    }

    return Result.ok(undefined as void)
  }

  public ship(
    carrierName: string,
    shippingMethod: string,
    shipDate?: Date,
  ): Result<void> {
    if (this.props.status !== 'packed') {
      return Result.fail('Can only ship packed slips')
    }

    // Verify all packages have tracking numbers
    const missingTracking = this.props.packages.some(p => !p.trackingNumber)
    if (missingTracking) {
      return Result.fail('All packages must have tracking numbers before shipping')
    }

    this.props.status = 'shipped'
    this.props.carrierName = carrierName
    this.props.shippingMethod = shippingMethod
    this.props.actualShipDate = shipDate ?? new Date()
    this.props.updatedAt = new Date()

    return Result.ok(undefined as void)
  }

  public cancel(reason?: string): Result<void> {
    if (this.props.status === 'shipped' || this.props.status === 'cancelled') {
      return Result.fail('Cannot cancel shipped or already cancelled packing slips')
    }

    this.props.status = 'cancelled'
    this.props.notes = reason ? `Cancelled: ${reason}` : 'Cancelled'
    this.props.updatedAt = new Date()

    return Result.ok(undefined as void)
  }

  public getTotalWeight(): { value: number; unit: string } {
    let totalWeight = 0
    let unit = 'lb'

    this.props.packages.forEach(pkg => {
      if (pkg.weight && pkg.weightUnit) {
        // Convert to common unit (lb)
        const weight = pkg.weightUnit === 'kg' ? pkg.weight * 2.20462 : pkg.weight
        totalWeight += weight
        unit = pkg.weightUnit === 'kg' ? 'kg' : 'lb'
      }
    })

    return { value: totalWeight, unit }
  }

  public getTotalPackages(): number {
    return this.props.packages.length
  }

  public isShipped(): boolean {
    return this.props.status === 'shipped'
  }
}
