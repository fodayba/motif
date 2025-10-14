import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'
import type { Permission } from '../enums/permission'
import { PERMISSIONS } from '../enums/permission'
import type { AccessScope } from '../value-objects/access-scope'

type RoleProps = {
  name: string
  description?: string
  permissions: Permission[]
  scopes: AccessScope[]
  isSystemRole: boolean
}

export class Role extends AggregateRoot<RoleProps> {
  private constructor(props: RoleProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get permissions(): Permission[] {
    return [...this.props.permissions]
  }

  get scopes(): AccessScope[] {
    return [...this.props.scopes]
  }

  get isSystemRole(): boolean {
    return this.props.isSystemRole
  }

  public static create(props: RoleProps, id?: UniqueEntityID): Result<Role> {
    const guardResult = Guard.againstEmptyString(props.name, 'role name')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    const invalidPermission = props.permissions.find(
      (permission) => !PERMISSIONS.includes(permission),
    )

    if (invalidPermission) {
      return Result.fail(`invalid permission: ${invalidPermission}`)
    }

    return Result.ok(
      new Role(
        {
          ...props,
          permissions: Array.from(new Set(props.permissions)),
        },
        id,
      ),
    )
  }

  public assignScope(scope: AccessScope) {
    this.props.scopes = [...this.props.scopes, scope]
  }

  public removeScope(scopeType: AccessScope['type'], referenceId?: string) {
    this.props.scopes = this.props.scopes.filter((scope) => {
      if (scope.type !== scopeType) {
        return true
      }

      return scope.referenceId !== referenceId
    })
  }
}
