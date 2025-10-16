import { Guard, Result, UniqueEntityID, ValueObject } from '../../shared'
import { DEPENDENCY_TYPES, type DependencyType } from '../enums/dependency-type'

type TaskDependencyProps = {
  predecessorId: UniqueEntityID
  dependencyType: DependencyType
  lag: number // in days, can be negative for lead time
}

export class TaskDependency extends ValueObject<TaskDependencyProps> {
  private constructor(props: TaskDependencyProps) {
    super(props)
  }

  get predecessorId(): UniqueEntityID {
    return this.props.predecessorId
  }

  get dependencyType(): DependencyType {
    return this.props.dependencyType
  }

  get lag(): number {
    return this.props.lag
  }

  get isLeadTime(): boolean {
    return this.props.lag < 0
  }

  public static create(props: TaskDependencyProps): Result<TaskDependency> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.predecessorId, argumentName: 'predecessorId' },
      { argument: props.dependencyType, argumentName: 'dependencyType' },
      { argument: props.lag, argumentName: 'lag' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!DEPENDENCY_TYPES.includes(props.dependencyType)) {
      return Result.fail('dependency type is invalid')
    }

    return Result.ok(new TaskDependency(props))
  }
}
