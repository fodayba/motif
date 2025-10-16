import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { MaintenanceScheduleType } from '../enums/maintenance-schedule-type'
import { MAINTENANCE_SCHEDULE_TYPES } from '../enums/maintenance-schedule-type'
import type { MaintenanceType } from '../enums/maintenance-type'
import { MAINTENANCE_TYPES } from '../enums/maintenance-type'

export type MaintenanceScheduleProps = {
  equipmentId: UniqueEntityID
  scheduleType: MaintenanceScheduleType
  maintenanceType: MaintenanceType
  interval: number // Value depends on scheduleType (hours, miles, days)
  lastMaintenanceDate?: Date
  nextDueDate: Date
  estimatedCost: number
  estimatedDuration: number // in hours
  description: string
  taskList?: string[]
  partsRequired?: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class MaintenanceSchedule extends AggregateRoot<MaintenanceScheduleProps> {
  private constructor(props: MaintenanceScheduleProps, id?: UniqueEntityID) {
    super(props, id)
  }

  // Getters
  get equipmentId(): UniqueEntityID {
    return this.props.equipmentId
  }

  get scheduleType(): MaintenanceScheduleType {
    return this.props.scheduleType
  }

  get maintenanceType(): MaintenanceType {
    return this.props.maintenanceType
  }

  get interval(): number {
    return this.props.interval
  }

  get lastMaintenanceDate(): Date | undefined {
    return this.props.lastMaintenanceDate
  }

  get nextDueDate(): Date {
    return this.props.nextDueDate
  }

  get estimatedCost(): number {
    return this.props.estimatedCost
  }

  get estimatedDuration(): number {
    return this.props.estimatedDuration
  }

  get description(): string {
    return this.props.description
  }

  get taskList(): string[] | undefined {
    return this.props.taskList
  }

  get partsRequired(): string[] | undefined {
    return this.props.partsRequired
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Logic Methods

  public isOverdue(): boolean {
    return new Date() > this.nextDueDate
  }

  public isDueSoon(daysThreshold: number = 7): boolean {
    const daysUntilDue = Math.floor(
      (this.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntilDue <= daysThreshold && daysUntilDue >= 0
  }

  public getDaysOverdue(): number {
    const now = new Date()
    if (now <= this.nextDueDate) return 0
    return Math.floor((now.getTime() - this.nextDueDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  public calculateNextDueDate(): Date {
    const baseDate = this.lastMaintenanceDate || new Date()
    const nextDate = new Date(baseDate)

    switch (this.scheduleType) {
      case 'HOURS':
        // For hours-based, we can't calculate without current operating hours
        // This should be handled by external service
        return this.nextDueDate
      case 'CALENDAR':
        nextDate.setDate(nextDate.getDate() + this.interval)
        return nextDate
      case 'MILEAGE':
        // For mileage-based, we can't calculate without current mileage
        // This should be handled by external service
        return this.nextDueDate
      case 'CONDITION_BASED':
        // Condition-based maintenance is determined by sensor data
        return this.nextDueDate
      default:
        return this.nextDueDate
    }
  }

  public recordMaintenanceCompleted(completionDate: Date): Result<MaintenanceSchedule> {
    this.props.lastMaintenanceDate = completionDate
    this.props.nextDueDate = this.calculateNextDueDate()
    this.touch()
    return Result.ok(this)
  }

  public updateNextDueDate(date: Date): Result<MaintenanceSchedule> {
    if (date <= new Date()) {
      return Result.fail('next due date must be in the future')
    }
    this.props.nextDueDate = date
    this.touch()
    return Result.ok(this)
  }

  public updateInterval(interval: number): Result<MaintenanceSchedule> {
    if (interval <= 0) {
      return Result.fail('interval must be greater than 0')
    }
    this.props.interval = interval
    this.props.nextDueDate = this.calculateNextDueDate()
    this.touch()
    return Result.ok(this)
  }

  public updateEstimatedCost(cost: number): Result<MaintenanceSchedule> {
    if (cost < 0) {
      return Result.fail('estimated cost cannot be negative')
    }
    this.props.estimatedCost = cost
    this.touch()
    return Result.ok(this)
  }

  public activate(): Result<MaintenanceSchedule> {
    if (this.isActive) {
      return Result.fail('schedule is already active')
    }
    this.props.isActive = true
    this.touch()
    return Result.ok(this)
  }

  public deactivate(): Result<MaintenanceSchedule> {
    if (!this.isActive) {
      return Result.fail('schedule is already inactive')
    }
    this.props.isActive = false
    this.touch()
    return Result.ok(this)
  }

  public updateTaskList(tasks: string[]): void {
    this.props.taskList = tasks
    this.touch()
  }

  public addTask(task: string): void {
    if (!this.props.taskList) {
      this.props.taskList = []
    }
    this.props.taskList.push(task)
    this.touch()
  }

  public removeTask(task: string): void {
    if (!this.props.taskList) return
    this.props.taskList = this.props.taskList.filter((t) => t !== task)
    this.touch()
  }

  public updatePartsRequired(parts: string[]): void {
    this.props.partsRequired = parts
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(
    props: MaintenanceScheduleProps,
    id?: UniqueEntityID,
  ): Result<MaintenanceSchedule> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.equipmentId, argumentName: 'equipmentId' },
      { argument: props.scheduleType, argumentName: 'scheduleType' },
      { argument: props.maintenanceType, argumentName: 'maintenanceType' },
      { argument: props.interval, argumentName: 'interval' },
      { argument: props.nextDueDate, argumentName: 'nextDueDate' },
      { argument: props.estimatedCost, argumentName: 'estimatedCost' },
      { argument: props.estimatedDuration, argumentName: 'estimatedDuration' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.isActive, argumentName: 'isActive' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!MAINTENANCE_SCHEDULE_TYPES.includes(props.scheduleType)) {
      return Result.fail(`invalid schedule type: ${props.scheduleType}`)
    }

    if (!MAINTENANCE_TYPES.includes(props.maintenanceType)) {
      return Result.fail(`invalid maintenance type: ${props.maintenanceType}`)
    }

    if (props.interval <= 0) {
      return Result.fail('interval must be greater than 0')
    }

    if (props.estimatedCost < 0) {
      return Result.fail('estimated cost cannot be negative')
    }

    if (props.estimatedDuration <= 0) {
      return Result.fail('estimated duration must be greater than 0')
    }

    if (props.lastMaintenanceDate && props.lastMaintenanceDate > new Date()) {
      return Result.fail('last maintenance date cannot be in the future')
    }

    return Result.ok(
      new MaintenanceSchedule(
        {
          ...props,
          description: props.description.trim(),
        },
        id,
      ),
    )
  }
}
