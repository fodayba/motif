import { AggregateRoot, Guard, Money, Result, UniqueEntityID } from '../../shared'
import { TASK_PRIORITIES, type TaskPriority } from '../enums/task-priority'
import { TASK_STATUSES, type TaskStatus } from '../enums/task-status'
import type { TaskDependency } from '../value-objects/task-dependency'

export type TaskProps = {
  projectId: UniqueEntityID
  name: string
  description?: string
  wbsCode?: string // Work Breakdown Structure code (e.g., "1.2.3")
  status: TaskStatus
  priority: TaskPriority
  progress: number // 0-100
  plannedStartDate: Date
  plannedEndDate: Date
  actualStartDate?: Date
  actualEndDate?: Date
  duration: number // in days
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: Money
  actualCost?: Money
  assignedTo: UniqueEntityID[] // User IDs
  dependencies: TaskDependency[]
  parentTaskId?: UniqueEntityID
  milestoneId?: UniqueEntityID
  createdAt: Date
  updatedAt: Date
}

export class Task extends AggregateRoot<TaskProps> {
  private constructor(props: TaskProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get wbsCode(): string | undefined {
    return this.props.wbsCode
  }

  get status(): TaskStatus {
    return this.props.status
  }

  get priority(): TaskPriority {
    return this.props.priority
  }

  get progress(): number {
    return this.props.progress
  }

  get plannedStartDate(): Date {
    return this.props.plannedStartDate
  }

  get plannedEndDate(): Date {
    return this.props.plannedEndDate
  }

  get actualStartDate(): Date | undefined {
    return this.props.actualStartDate
  }

  get actualEndDate(): Date | undefined {
    return this.props.actualEndDate
  }

  get duration(): number {
    return this.props.duration
  }

  get estimatedHours(): number | undefined {
    return this.props.estimatedHours
  }

  get actualHours(): number | undefined {
    return this.props.actualHours
  }

  get estimatedCost(): Money | undefined {
    return this.props.estimatedCost
  }

  get actualCost(): Money | undefined {
    return this.props.actualCost
  }

  get assignedTo(): UniqueEntityID[] {
    return this.props.assignedTo
  }

  get dependencies(): TaskDependency[] {
    return this.props.dependencies
  }

  get parentTaskId(): UniqueEntityID | undefined {
    return this.props.parentTaskId
  }

  get milestoneId(): UniqueEntityID | undefined {
    return this.props.milestoneId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Computed properties
  get isOverdue(): boolean {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return false
    }
    return this.plannedEndDate < new Date()
  }

  get isDelayed(): boolean {
    if (!this.actualStartDate) {
      return this.plannedStartDate < new Date() && this.status === 'not-started'
    }
    // Task started late
    return this.actualStartDate > this.plannedStartDate
  }

  get isCompleted(): boolean {
    return this.status === 'completed' && this.progress === 100
  }

  get remainingDays(): number {
    if (this.isCompleted) {
      return 0
    }
    const now = new Date()
    const end = this.actualEndDate ?? this.plannedEndDate
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  get scheduleVariance(): number {
    // SV = (actual end - planned end) in days, negative means late
    if (!this.actualEndDate) {
      return 0
    }
    const diff = this.plannedEndDate.getTime() - this.actualEndDate.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  get costVariance(): number {
    // CV = estimated cost - actual cost
    if (!this.estimatedCost || !this.actualCost) {
      return 0
    }
    if (this.estimatedCost.currency !== this.actualCost.currency) {
      throw new Error('Cannot calculate cost variance: currency mismatch')
    }
    return this.estimatedCost.amount - this.actualCost.amount
  }

  // Business Logic Methods

  public start(startDate?: Date): Result<Task> {
    if (this.status === 'completed') {
      return Result.fail('cannot start a completed task')
    }

    if (this.status === 'cancelled') {
      return Result.fail('cannot start a cancelled task')
    }

    this.props.status = 'in-progress'
    this.props.actualStartDate = startDate ?? new Date()
    this.touch()

    return Result.ok(this)
  }

  public complete(completionDate?: Date): Result<Task> {
    if (this.status === 'not-started') {
      return Result.fail('cannot complete a task that has not started')
    }

    if (this.status === 'cancelled') {
      return Result.fail('cannot complete a cancelled task')
    }

    this.props.status = 'completed'
    this.props.progress = 100
    this.props.actualEndDate = completionDate ?? new Date()
    this.touch()

    return Result.ok(this)
  }

  public updateProgress(progress: number): Result<Task> {
    if (progress < 0 || progress > 100) {
      return Result.fail('progress must be between 0 and 100')
    }

    if (this.status === 'completed' && progress < 100) {
      return Result.fail('cannot reduce progress of completed task')
    }

    this.props.progress = progress

    // Auto-update status based on progress
    if (progress === 0 && this.status === 'in-progress') {
      this.props.status = 'not-started'
    } else if (progress > 0 && progress < 100 && this.status === 'not-started') {
      this.props.status = 'in-progress'
      this.props.actualStartDate = this.props.actualStartDate ?? new Date()
    } else if (progress === 100 && this.status !== 'completed') {
      this.props.status = 'completed'
      this.props.actualEndDate = this.props.actualEndDate ?? new Date()
    }

    this.touch()
    return Result.ok(this)
  }

  public updateStatus(status: TaskStatus): Result<Task> {
    if (!TASK_STATUSES.includes(status)) {
      return Result.fail('invalid task status')
    }

    // Validation rules
    if (status === 'completed' && this.progress < 100) {
      return Result.fail('cannot mark task as completed when progress is less than 100%')
    }

    if (status === 'not-started' && this.props.actualStartDate) {
      return Result.fail('cannot mark task as not-started when it has an actual start date')
    }

    this.props.status = status

    // Set timestamps based on status
    if (status === 'in-progress' && !this.props.actualStartDate) {
      this.props.actualStartDate = new Date()
    }

    if (status === 'completed' && !this.props.actualEndDate) {
      this.props.actualEndDate = new Date()
      this.props.progress = 100
    }

    this.touch()
    return Result.ok(this)
  }

  public updatePriority(priority: TaskPriority): Result<Task> {
    if (!TASK_PRIORITIES.includes(priority)) {
      return Result.fail('invalid task priority')
    }

    this.props.priority = priority
    this.touch()
    return Result.ok(this)
  }

  public assignUsers(userIds: UniqueEntityID[]): Result<Task> {
    if (userIds.length === 0) {
      return Result.fail('must assign at least one user')
    }

    this.props.assignedTo = [...userIds]
    this.touch()
    return Result.ok(this)
  }

  public addAssignee(userId: UniqueEntityID): Result<Task> {
    const alreadyAssigned = this.props.assignedTo.some((id) => id.equals(userId))
    if (alreadyAssigned) {
      return Result.fail('user is already assigned to this task')
    }

    this.props.assignedTo.push(userId)
    this.touch()
    return Result.ok(this)
  }

  public removeAssignee(userId: UniqueEntityID): Result<Task> {
    const index = this.props.assignedTo.findIndex((id) => id.equals(userId))
    if (index === -1) {
      return Result.fail('user is not assigned to this task')
    }

    this.props.assignedTo.splice(index, 1)

    if (this.props.assignedTo.length === 0) {
      return Result.fail('task must have at least one assignee')
    }

    this.touch()
    return Result.ok(this)
  }

  public addDependency(dependency: TaskDependency): Result<Task> {
    // Check for circular dependencies
    const isDuplicate = this.props.dependencies.some((dep) =>
      dep.predecessorId.equals(dependency.predecessorId),
    )

    if (isDuplicate) {
      return Result.fail('dependency already exists')
    }

    this.props.dependencies.push(dependency)
    this.touch()
    return Result.ok(this)
  }

  public removeDependency(predecessorId: UniqueEntityID): Result<Task> {
    const index = this.props.dependencies.findIndex((dep) => dep.predecessorId.equals(predecessorId))

    if (index === -1) {
      return Result.fail('dependency not found')
    }

    this.props.dependencies.splice(index, 1)
    this.touch()
    return Result.ok(this)
  }

  public reschedule(newStartDate: Date, newEndDate: Date): Result<Task> {
    if (newStartDate >= newEndDate) {
      return Result.fail('start date must be before end date')
    }

    if (this.status === 'completed') {
      return Result.fail('cannot reschedule completed task')
    }

    const newDuration = Math.ceil(
      (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    this.props.plannedStartDate = newStartDate
    this.props.plannedEndDate = newEndDate
    this.props.duration = newDuration

    this.touch()
    return Result.ok(this)
  }

  public updateActualCost(cost: Money): Result<Task> {
    if (cost.amount < 0) {
      return Result.fail('cost cannot be negative')
    }

    this.props.actualCost = cost
    this.touch()
    return Result.ok(this)
  }

  public updateActualHours(hours: number): Result<Task> {
    if (hours < 0) {
      return Result.fail('hours cannot be negative')
    }

    this.props.actualHours = hours
    this.touch()
    return Result.ok(this)
  }

  public linkToMilestone(milestoneId: UniqueEntityID): Result<Task> {
    this.props.milestoneId = milestoneId
    this.touch()
    return Result.ok(this)
  }

  public unlinkFromMilestone(): Result<Task> {
    this.props.milestoneId = undefined
    this.touch()
    return Result.ok(this)
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(props: TaskProps, id?: UniqueEntityID): Result<Task> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.priority, argumentName: 'priority' },
      { argument: props.progress, argumentName: 'progress' },
      { argument: props.plannedStartDate, argumentName: 'plannedStartDate' },
      { argument: props.plannedEndDate, argumentName: 'plannedEndDate' },
      { argument: props.duration, argumentName: 'duration' },
      { argument: props.assignedTo, argumentName: 'assignedTo' },
      { argument: props.dependencies, argumentName: 'dependencies' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!TASK_STATUSES.includes(props.status)) {
      return Result.fail('task status is invalid')
    }

    if (!TASK_PRIORITIES.includes(props.priority)) {
      return Result.fail('task priority is invalid')
    }

    if (props.progress < 0 || props.progress > 100) {
      return Result.fail('progress must be between 0 and 100')
    }

    if (props.plannedStartDate >= props.plannedEndDate) {
      return Result.fail('planned start date must be before planned end date')
    }

    if (props.duration <= 0) {
      return Result.fail('duration must be positive')
    }

    if (props.assignedTo.length === 0) {
      return Result.fail('task must be assigned to at least one user')
    }

    return Result.ok(
      new Task(
        {
          ...props,
          name: props.name.trim(),
          description: props.description?.trim(),
        },
        id,
      ),
    )
  }
}
