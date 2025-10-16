import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'

export type TaskDependencyProps = {
  projectId: UniqueEntityID
  predecessorId: UniqueEntityID
  successorId: UniqueEntityID
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
  lagDays: number
  createdAt: Date
  updatedAt: Date
}

/**
 * TaskDependency Entity
 * 
 * Represents a dependency relationship between two tasks.
 * Defines the type of dependency and any lag time.
 */
export class TaskDependency extends AggregateRoot<TaskDependencyProps> {
  private constructor(props: TaskDependencyProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get predecessorId(): UniqueEntityID {
    return this.props.predecessorId
  }

  get successorId(): UniqueEntityID {
    return this.props.successorId
  }

  get type(): string {
    return this.props.type
  }

  get lagDays(): number {
    return this.props.lagDays
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  /**
   * Update the lag time for this dependency
   */
  public updateLag(lagDays: number): Result<void> {
    this.props.lagDays = lagDays
    this.props.updatedAt = new Date()
    return Result.ok(undefined)
  }

  /**
   * Create a new TaskDependency
   */
  public static create(props: TaskDependencyProps, id?: UniqueEntityID): Result<TaskDependency> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.predecessorId, argumentName: 'predecessorId' },
      { argument: props.successorId, argumentName: 'successorId' },
      { argument: props.type, argumentName: 'type' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    const validTypes = ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish']
    if (!validTypes.includes(props.type)) {
      return Result.fail('Invalid dependency type')
    }

    const dependency = new TaskDependency({
      ...props,
      lagDays: props.lagDays || 0,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    }, id)

    return Result.ok(dependency)
  }
}
