import { Guard, Result, UniqueEntityID, ValueObject } from '../../shared'

type CorrectiveActionProps = {
  actionId: UniqueEntityID
  description: string
  ownerId: UniqueEntityID
  dueDate: Date
  completedAt?: Date
}

export class CorrectiveAction extends ValueObject<CorrectiveActionProps> {
  private constructor(props: CorrectiveActionProps) {
    super(props)
  }

  get actionId(): UniqueEntityID {
    return this.props.actionId
  }

  get description(): string {
    return this.props.description
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId
  }

  get dueDate(): Date {
    return this.props.dueDate
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt
  }

  get isCompleted(): boolean {
    return Boolean(this.props.completedAt)
  }

  public static create(
    props: Omit<CorrectiveActionProps, 'actionId'> & { actionId?: UniqueEntityID },
  ): Result<CorrectiveAction> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.description, argumentName: 'description' },
      { argument: props.ownerId, argumentName: 'ownerId' },
      { argument: props.dueDate, argumentName: 'dueDate' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (props.description.trim().length === 0) {
      return Result.fail('corrective action description cannot be empty')
    }

    return Result.ok(
      new CorrectiveAction({
        actionId: props.actionId ?? new UniqueEntityID(),
        description: props.description.trim(),
        ownerId: props.ownerId,
        dueDate: props.dueDate,
        completedAt: props.completedAt,
      }),
    )
  }

  public markComplete(at: Date) {
    this.props.completedAt = at
  }
}
