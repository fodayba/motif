import { Result, UniqueEntityID, ValueObject } from '../../shared'
import type { AccessScope } from '../../access-control'

export type RoleAssignmentProps = {
  roleId: UniqueEntityID
  scope: AccessScope
}

export class RoleAssignment extends ValueObject<RoleAssignmentProps> {
  private constructor(props: RoleAssignmentProps) {
    super(props)
  }

  get roleId(): UniqueEntityID {
    return this.props.roleId
  }

  get scope(): AccessScope {
    return this.props.scope
  }

  public static create(props: RoleAssignmentProps): Result<RoleAssignment> {
    if (!props.roleId) {
      return Result.fail('roleId is required')
    }

    return Result.ok(new RoleAssignment(props))
  }
}
