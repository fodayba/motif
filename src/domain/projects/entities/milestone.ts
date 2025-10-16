import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import { MILESTONE_STATUSES, type MilestoneStatus } from '../enums/milestone-status'

export type MilestoneEvidence = {
  id: string
  submittedBy: UniqueEntityID
  submittedAt: Date
  type: 'document' | 'photo' | 'inspection' | 'approval'
  fileUrl?: string
  notes?: string
}

export type MilestoneProps = {
  projectId: UniqueEntityID
  name: string
  description?: string
  dueDate: Date
  completedDate?: Date
  status: MilestoneStatus
  critical: boolean // Is this milestone on the critical path?
  dependencies: UniqueEntityID[] // Task IDs that must be completed
  proofRequired: boolean
  evidence: MilestoneEvidence[]
  createdAt: Date
  updatedAt: Date
}

export class Milestone extends AggregateRoot<MilestoneProps> {
  private constructor(props: MilestoneProps, id?: UniqueEntityID) {
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

  get dueDate(): Date {
    return this.props.dueDate
  }

  get completedDate(): Date | undefined {
    return this.props.completedDate
  }

  get status(): MilestoneStatus {
    return this.props.status
  }

  get critical(): boolean {
    return this.props.critical
  }

  get dependencies(): UniqueEntityID[] {
    return this.props.dependencies
  }

  get proofRequired(): boolean {
    return this.props.proofRequired
  }

  get evidence(): MilestoneEvidence[] {
    return this.props.evidence
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Computed properties
  get isOverdue(): boolean {
    if (this.status === 'achieved') {
      return false
    }
    return this.dueDate < new Date()
  }

  get isDueSoon(): boolean {
    if (this.status === 'achieved' || this.status === 'missed') {
      return false
    }
    const daysUntilDue = this.daysUntilDue
    return daysUntilDue >= 0 && daysUntilDue <= 7
  }

  get daysUntilDue(): number {
    const now = new Date()
    const diff = this.dueDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  get hasEvidence(): boolean {
    return this.evidence.length > 0
  }

  get lastEvidenceSubmittedAt(): Date | undefined {
    if (this.evidence.length === 0) {
      return undefined
    }
    return this.evidence.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0]
      .submittedAt
  }

  // Business Logic Methods

  public achieve(completionDate?: Date): Result<Milestone> {
    if (this.status === 'achieved') {
      return Result.fail('milestone is already achieved')
    }

    if (this.proofRequired && !this.hasEvidence) {
      return Result.fail('proof of completion is required before achieving this milestone')
    }

    this.props.status = 'achieved'
    this.props.completedDate = completionDate ?? new Date()
    this.touch()

    return Result.ok(this)
  }

  public markAsMissed(): Result<Milestone> {
    if (this.status === 'achieved') {
      return Result.fail('cannot mark an achieved milestone as missed')
    }

    if (!this.isOverdue) {
      return Result.fail('cannot mark milestone as missed before due date')
    }

    this.props.status = 'missed'
    this.touch()

    return Result.ok(this)
  }

  public reopen(): Result<Milestone> {
    if (this.status === 'pending') {
      return Result.fail('milestone is already pending')
    }

    this.props.status = 'pending'
    this.props.completedDate = undefined
    this.touch()

    return Result.ok(this)
  }

  public addEvidence(evidence: Omit<MilestoneEvidence, 'id'>): Result<Milestone> {
    const newEvidence: MilestoneEvidence = {
      ...evidence,
      id: crypto.randomUUID(),
    }

    this.props.evidence.push(newEvidence)
    this.touch()

    return Result.ok(this)
  }

  public removeEvidence(evidenceId: string): Result<Milestone> {
    const index = this.props.evidence.findIndex((e) => e.id === evidenceId)
    if (index === -1) {
      return Result.fail('evidence not found')
    }

    this.props.evidence.splice(index, 1)
    this.touch()

    return Result.ok(this)
  }

  public reschedule(newDueDate: Date): Result<Milestone> {
    if (this.status === 'achieved') {
      return Result.fail('cannot reschedule an achieved milestone')
    }

    if (newDueDate < new Date()) {
      return Result.fail('new due date cannot be in the past')
    }

    this.props.dueDate = newDueDate

    // Update status if previously missed
    if (this.status === 'missed') {
      this.props.status = 'pending'
    }

    this.touch()
    return Result.ok(this)
  }

  public markAsCritical(): Result<Milestone> {
    this.props.critical = true
    this.touch()
    return Result.ok(this)
  }

  public markAsNonCritical(): Result<Milestone> {
    this.props.critical = false
    this.touch()
    return Result.ok(this)
  }

  public addDependency(taskId: UniqueEntityID): Result<Milestone> {
    const alreadyExists = this.props.dependencies.some((id) => id.equals(taskId))
    if (alreadyExists) {
      return Result.fail('dependency already exists')
    }

    this.props.dependencies.push(taskId)
    this.touch()
    return Result.ok(this)
  }

  public removeDependency(taskId: UniqueEntityID): Result<Milestone> {
    const index = this.props.dependencies.findIndex((id) => id.equals(taskId))
    if (index === -1) {
      return Result.fail('dependency not found')
    }

    this.props.dependencies.splice(index, 1)
    this.touch()
    return Result.ok(this)
  }

  public updateDescription(description: string): Result<Milestone> {
    this.props.description = description.trim()
    this.touch()
    return Result.ok(this)
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  // Factory Method
  public static create(props: MilestoneProps, id?: UniqueEntityID): Result<Milestone> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.dueDate, argumentName: 'dueDate' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.critical, argumentName: 'critical' },
      { argument: props.dependencies, argumentName: 'dependencies' },
      { argument: props.proofRequired, argumentName: 'proofRequired' },
      { argument: props.evidence, argumentName: 'evidence' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!MILESTONE_STATUSES.includes(props.status)) {
      return Result.fail('milestone status is invalid')
    }

    const trimmedName = props.name.trim()
    if (trimmedName.length === 0) {
      return Result.fail('milestone name cannot be empty')
    }

    if (trimmedName.length > 200) {
      return Result.fail('milestone name cannot exceed 200 characters')
    }

    return Result.ok(
      new Milestone(
        {
          ...props,
          name: trimmedName,
          description: props.description?.trim(),
        },
        id,
      ),
    )
  }
}
