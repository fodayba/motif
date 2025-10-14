import {
  AggregateRoot,
  Email,
  Guard,
  Result,
  UniqueEntityID,
} from '../../shared'
import type { RoleAssignment } from '../value-objects/role-assignment'
import type { UserProfile } from '../value-objects/user-profile'
import type { UserStatus } from '../value-objects/user-status'
import { USER_STATUSES } from '../value-objects/user-status'

export type UserProps = {
  email: Email
  profile: UserProfile
  status: UserStatus
  roleAssignments: RoleAssignment[]
  lastSignInAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get email(): Email {
    return this.props.email
  }

  get profile(): UserProfile {
    return this.props.profile
  }

  get status(): UserStatus {
    return this.props.status
  }

  get roleAssignments(): RoleAssignment[] {
    return [...this.props.roleAssignments]
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get lastSignInAt(): Date | undefined {
    return this.props.lastSignInAt
  }

  public static create(props: UserProps, id?: UniqueEntityID): Result<User> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.email, argumentName: 'email' },
      { argument: props.profile, argumentName: 'profile' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!USER_STATUSES.includes(props.status)) {
      return Result.fail('status is invalid')
    }

    return Result.ok(
      new User(
        {
          ...props,
          roleAssignments: [...props.roleAssignments],
        },
        id,
      ),
    )
  }

  public activate() {
    this.props.status = 'active'
    this.touch()
  }

  public suspend() {
    this.props.status = 'suspended'
    this.touch()
  }

  public disable() {
    this.props.status = 'disabled'
    this.touch()
  }

  public recordSignIn(at: Date) {
    this.props.lastSignInAt = at
    this.touch()
  }

  public assignRole(assignment: RoleAssignment) {
    this.props.roleAssignments = [...this.props.roleAssignments, assignment]
    this.touch()
  }

  public removeRole(roleId: UniqueEntityID) {
    this.props.roleAssignments = this.props.roleAssignments.filter(
      (assignment) => !assignment.roleId.equals(roleId),
    )
    this.touch()
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
