import {
  AggregateRoot,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { IncidentSeverity } from '../enums/incident-severity'
import { INCIDENT_SEVERITIES } from '../enums/incident-severity'
import type { IncidentStatus } from '../enums/incident-status'
import { INCIDENT_STATUSES } from '../enums/incident-status'
import { CorrectiveAction } from '../value-objects/corrective-action'
import type { IncidentLocation } from '../value-objects/incident-location'

export type SafetyIncidentProps = {
  projectId: UniqueEntityID
  reporterId: UniqueEntityID
  status: IncidentStatus
  severity: IncidentSeverity
  title: string
  description: string
  location: IncidentLocation
  occurredAt: Date
  reportedAt: Date
  correctiveActions: CorrectiveAction[]
  followUpNotes?: string
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class SafetyIncident extends AggregateRoot<SafetyIncidentProps> {
  private constructor(props: SafetyIncidentProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get projectId(): UniqueEntityID {
    return this.props.projectId
  }

  get reporterId(): UniqueEntityID {
    return this.props.reporterId
  }

  get status(): IncidentStatus {
    return this.props.status
  }

  get severity(): IncidentSeverity {
    return this.props.severity
  }

  get title(): string {
    return this.props.title
  }

  get description(): string {
    return this.props.description
  }

  get location(): IncidentLocation {
    return this.props.location
  }

  get occurredAt(): Date {
    return this.props.occurredAt
  }

  get reportedAt(): Date {
    return this.props.reportedAt
  }

  get correctiveActions(): CorrectiveAction[] {
    return [...this.props.correctiveActions]
  }

  get followUpNotes(): string | undefined {
    return this.props.followUpNotes
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(props: SafetyIncidentProps, id?: UniqueEntityID): Result<SafetyIncident> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.projectId, argumentName: 'projectId' },
      { argument: props.reporterId, argumentName: 'reporterId' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.severity, argumentName: 'severity' },
      { argument: props.title, argumentName: 'title' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.location, argumentName: 'location' },
      { argument: props.occurredAt, argumentName: 'occurredAt' },
      { argument: props.reportedAt, argumentName: 'reportedAt' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!INCIDENT_SEVERITIES.includes(props.severity)) {
      return Result.fail('incident severity is invalid')
    }

    if (!INCIDENT_STATUSES.includes(props.status)) {
      return Result.fail('incident status is invalid')
    }

    if (props.title.trim().length < 5) {
      return Result.fail('incident title must be at least 5 characters')
    }

    if (props.description.trim().length < 10) {
      return Result.fail('incident description must be at least 10 characters')
    }

    return Result.ok(
      new SafetyIncident(
        {
          ...props,
          title: props.title.trim(),
          description: props.description.trim(),
          followUpNotes: props.followUpNotes?.trim(),
          correctiveActions: [...props.correctiveActions],
        },
        id,
      ),
    )
  }

  public addCorrectiveAction(action: CorrectiveAction) {
    this.props.correctiveActions = [...this.props.correctiveActions, action]
    this.touch()
  }

  public updateCorrectiveAction(updated: CorrectiveAction): Result<void> {
    const index = this.props.correctiveActions.findIndex((action) =>
      action.actionId.equals(updated.actionId),
    )

    if (index === -1) {
      return Result.fail('corrective action not found')
    }

    const actions = [...this.props.correctiveActions]
    actions[index] = updated
    this.props.correctiveActions = actions
    this.touch()

    return Result.ok(undefined)
  }

  public updateStatus(status: IncidentStatus) {
    if (!INCIDENT_STATUSES.includes(status)) {
      throw new Error('incident status is invalid')
    }

    this.props.status = status
    if (status === 'closed') {
      this.props.closedAt = new Date()
    }
    this.touch()
  }

  public escalate() {
    this.props.status = 'escalated'
    this.touch()
  }

  public addFollowUp(note: string) {
    const noteText = note.trim()
    if (noteText.length === 0) {
      throw new Error('follow-up note cannot be empty')
    }

    const existing = this.props.followUpNotes ?? ''
    this.props.followUpNotes = [existing, noteText].filter(Boolean).join('\n')
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
