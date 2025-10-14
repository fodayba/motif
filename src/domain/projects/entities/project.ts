import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'
import type { ProjectStatus } from '../../shared'
import { PROJECT_STATUSES } from '../../shared'
import type { ProjectCode } from '../value-objects/project-code'
import type { ProjectLocation } from '../value-objects/project-location'
import type { ProjectName } from '../value-objects/project-name'

type ProjectProps = {
  code: ProjectCode
  name: ProjectName
  location: ProjectLocation
  clientName: string
  budget: Money
  status: ProjectStatus
  startDate: Date
  endDate?: Date
  projectManagerId?: UniqueEntityID
  createdAt: Date
  updatedAt: Date
}

export class Project extends AggregateRoot<ProjectProps> {
  private constructor(props: ProjectProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get code(): ProjectCode {
    return this.props.code
  }

  get name(): ProjectName {
    return this.props.name
  }

  get location(): ProjectLocation {
    return this.props.location
  }

  get clientName(): string {
    return this.props.clientName
  }

  get budget(): Money {
    return this.props.budget
  }

  get status(): ProjectStatus {
    return this.props.status
  }

  get startDate(): Date {
    return this.props.startDate
  }

  get endDate(): Date | undefined {
    return this.props.endDate
  }

  get projectManagerId(): UniqueEntityID | undefined {
    return this.props.projectManagerId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(props: ProjectProps, id?: UniqueEntityID): Result<Project> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.code, argumentName: 'code' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.location, argumentName: 'location' },
      { argument: props.clientName, argumentName: 'clientName' },
      { argument: props.budget, argumentName: 'budget' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.startDate, argumentName: 'startDate' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!PROJECT_STATUSES.includes(props.status)) {
      return Result.fail('project status is invalid')
    }

    return Result.ok(
      new Project(
        {
          ...props,
          clientName: props.clientName.trim(),
        },
        id,
      ),
    )
  }

  public assignManager(managerId: UniqueEntityID) {
    this.props.projectManagerId = managerId
    this.touch()
  }

  public updateStatus(status: ProjectStatus) {
    if (!PROJECT_STATUSES.includes(status)) {
      throw new Error('project status is invalid')
    }

    this.props.status = status
    this.touch()
  }

  public updateBudget(budget: Money) {
    this.props.budget = budget
    this.touch()
  }

  public setEndDate(endDate: Date | undefined) {
    this.props.endDate = endDate
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
