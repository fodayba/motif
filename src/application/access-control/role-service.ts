import { Result } from '@domain/shared'
import { AccessScope, Role, type Permission, type RoleRepository } from '@domain/access-control'
import { createScope, type ScopeInput } from './dto'

export type CreateRoleInput = {
  name: string
  description?: string
  permissions: Permission[]
  scopes?: ScopeInput[]
  isSystemRole?: boolean
}

export type UpdateRoleInput = {
  roleId: Role['id']
  name?: string
  description?: string
  permissions?: Permission[]
  scopes?: ScopeInput[]
}

export class RoleService {
  private readonly repository: RoleRepository

  constructor(repository: RoleRepository) {
    this.repository = repository
  }

  async createRole(input: CreateRoleInput): Promise<Result<Role>> {
    const existing = await this.repository.findByName(input.name.trim())
    if (existing) {
      return Result.fail('role name must be unique')
    }

    const scopesResult = await this.resolveScopes(input.scopes)
    if (!scopesResult.isSuccess || !scopesResult.value) {
      return Result.fail(scopesResult.error ?? 'invalid scopes')
    }

    const roleResult = Role.create({
      name: input.name.trim(),
      description: input.description?.trim(),
      permissions: input.permissions,
      scopes: scopesResult.value,
      isSystemRole: Boolean(input.isSystemRole),
    })

    if (!roleResult.isSuccess || !roleResult.value) {
      return Result.fail(roleResult.error ?? 'failed to create role')
    }

    const role = roleResult.value
    await this.repository.save(role)

    return Result.ok(role)
  }

  async updateRole(input: UpdateRoleInput): Promise<Result<Role>> {
    const role = await this.repository.findById(input.roleId)
    if (!role) {
      return Result.fail('role not found')
    }

    if (role.isSystemRole && input.name) {
      return Result.fail('cannot rename a system role')
    }

    const scopesResult = input.scopes
      ? await this.resolveScopes(input.scopes)
      : Result.ok(role.scopes)
    if (!scopesResult.isSuccess || !scopesResult.value) {
      return Result.fail(scopesResult.error ?? 'invalid scopes')
    }

    const updatedResult = Role.create(
      {
        name: input.name?.trim() ?? role.name,
        description: input.description?.trim() ?? role.description,
        permissions: input.permissions ?? role.permissions,
        scopes: scopesResult.value,
        isSystemRole: role.isSystemRole,
      },
      role.id,
    )

    if (!updatedResult.isSuccess || !updatedResult.value) {
      return Result.fail(updatedResult.error ?? 'failed to update role')
    }

    const updated = updatedResult.value
    await this.repository.save(updated)

    return Result.ok(updated)
  }

  async deleteRole(roleId: Role['id']): Promise<Result<void>> {
    const role = await this.repository.findById(roleId)
    if (!role) {
      return Result.fail('role not found')
    }

    if (role.isSystemRole) {
      return Result.fail('cannot delete a system role')
    }

    await this.repository.delete(role)

    return Result.ok(undefined)
  }

  async listRoles(): Promise<Role[]> {
    return this.repository.list()
  }

  private async resolveScopes(scopes?: ScopeInput[]): Promise<Result<AccessScope[]>> {
    if (!scopes || scopes.length === 0) {
      return Result.ok([AccessScope.global()])
    }

    const resolved: AccessScope[] = []

    for (const scope of scopes) {
      const scopeResult = createScope(scope)
      if (!scopeResult.isSuccess || !scopeResult.value) {
        return Result.fail(scopeResult.error ?? 'invalid scope')
      }

      resolved.push(scopeResult.value)
    }

    return Result.ok(resolved)
  }
}
