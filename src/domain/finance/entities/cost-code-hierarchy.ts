import { Entity, Guard, Result, UniqueEntityID } from '../../shared'

export type CostCodeHierarchyProps = {
  code: string
  name: string
  description?: string
  parentCode?: string
  level: number // 1 = Division, 2 = Subdivision, 3 = Cost Type, 4 = Detail
  isActive: boolean
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

export class CostCodeHierarchy extends Entity<CostCodeHierarchyProps> {
  private constructor(props: CostCodeHierarchyProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get code(): string {
    return this.props.code
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get parentCode(): string | undefined {
    return this.props.parentCode
  }

  get level(): number {
    return this.props.level
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get sortOrder(): number | undefined {
    return this.props.sortOrder
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Computed
  get isDivision(): boolean {
    return this.props.level === 1
  }

  get isSubdivision(): boolean {
    return this.props.level === 2
  }

  get isCostType(): boolean {
    return this.props.level === 3
  }

  get isDetail(): boolean {
    return this.props.level === 4
  }

  // Factory method
  public static create(
    props: CostCodeHierarchyProps,
    id?: UniqueEntityID,
  ): Result<CostCodeHierarchy> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.code, argumentName: 'code' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.level, argumentName: 'level' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    // Validate code format (e.g., "01", "01.01", "01.01.01", "01.01.01.001")
    const codePattern = /^(\d{2})(\.(\d{2}))?(\.(\d{2}))?(\.(\d{3}))?$/
    if (!codePattern.test(props.code)) {
      return Result.fail('Invalid cost code format. Expected format: XX or XX.XX or XX.XX.XX or XX.XX.XX.XXX')
    }

    // Validate level based on code structure
    const codeParts = props.code.split('.')
    if (codeParts.length !== props.level) {
      return Result.fail(`Cost code level ${props.level} does not match code structure`)
    }

    // Validate level range
    if (props.level < 1 || props.level > 4) {
      return Result.fail('Cost code level must be between 1 and 4')
    }

    // Validate parent code for levels > 1
    if (props.level > 1 && !props.parentCode) {
      return Result.fail('Parent code is required for levels > 1')
    }

    // Validate name
    if (props.name.trim().length < 2) {
      return Result.fail('Name must be at least 2 characters')
    }

    return Result.ok(new CostCodeHierarchy(props, id))
  }

  // Methods
  public deactivate(): void {
    this.props.isActive = false
    this.touch()
  }

  public activate(): void {
    this.props.isActive = true
    this.touch()
  }

  public updateDescription(description: string): void {
    this.props.description = description
    this.touch()
  }

  public updateSortOrder(sortOrder: number): void {
    this.props.sortOrder = sortOrder
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }
}
