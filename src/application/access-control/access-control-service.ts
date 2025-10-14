import { Result, UniqueEntityID } from '@domain/shared'
import {
  Role,
  type Permission,
  type RoleRepository,
} from '@domain/access-control'
import { type RoleAssignment, type User, type UserRepository } from '@domain/users'
import type { ScopeInput, RoleAssignmentInput } from './dto'
import { createRoleAssignment } from './dto'

export type AssignRoleInput = {
  userId: string
  assignment: RoleAssignmentInput
}

export type RevokeRoleInput = {
  userId: string
  roleId: string
}

export type PermissionCheckInput = {
  userId: string
  permission: Permission
  scope?: ScopeInput
}

export type ListPermissionsInput = {
  userId: string
  scope?: ScopeInput
}

export class AccessControlService {
  private readonly userRepository: UserRepository
  private readonly roleRepository: RoleRepository

  constructor(deps: { userRepository: UserRepository; roleRepository: RoleRepository }) {
    this.userRepository = deps.userRepository
    this.roleRepository = deps.roleRepository
  }

  async assignRole(input: AssignRoleInput): Promise<Result<User>> {
    const userResult = await this.loadUser(input.userId)
    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'user not found')
    }

    const user = userResult.value
    const assignmentResult = createRoleAssignment(input.assignment)
    if (!assignmentResult.isSuccess || !assignmentResult.value) {
      return Result.fail(assignmentResult.error ?? 'invalid role assignment')
    }

    const assignment = assignmentResult.value
    const role = await this.roleRepository.findById(assignment.roleId)
    if (!role) {
      return Result.fail('role not found')
    }

    const alreadyAssigned = user.roleAssignments.some((existing) =>
      this.isSameAssignment(existing, assignment),
    )

    if (alreadyAssigned) {
      return Result.fail('role already assigned for the given scope')
    }

    user.assignRole(assignment)
    await this.userRepository.save(user)

    return Result.ok(user)
  }

  async revokeRole(input: RevokeRoleInput): Promise<Result<User>> {
    const userResult = await this.loadUser(input.userId)
    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'user not found')
    }

    const user = userResult.value
    let roleId: UniqueEntityID

    try {
      roleId = new UniqueEntityID(input.roleId)
    } catch (error) {
      return Result.fail('roleId must be a valid UUID')
    }

    const before = user.roleAssignments.length
    user.removeRole(roleId)

    if (before === user.roleAssignments.length) {
      return Result.fail('role not assigned to user')
    }

    await this.userRepository.save(user)

    return Result.ok(user)
  }

  async userHasPermission(input: PermissionCheckInput): Promise<Result<boolean>> {
    const permissionsResult = await this.listUserPermissions({
      userId: input.userId,
      scope: input.scope,
    })

    if (!permissionsResult.isSuccess || !permissionsResult.value) {
      return Result.fail(permissionsResult.error ?? 'unable to resolve permissions')
    }

    return Result.ok(permissionsResult.value.includes(input.permission))
  }

  async listUserPermissions(input: ListPermissionsInput): Promise<Result<Permission[]>> {
    const userResult = await this.loadUser(input.userId)
    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'user not found')
    }

    const user = userResult.value
    const roleMapResult = await this.loadRoles(user.roleAssignments)
    if (!roleMapResult.isSuccess || !roleMapResult.value) {
      return Result.fail(roleMapResult.error ?? 'roles not found')
    }

    const roleMap = roleMapResult.value
    const permissions = new Set<Permission>()

    for (const assignment of user.roleAssignments) {
      const role = roleMap.get(assignment.roleId.toString())
      if (!role) {
        continue
      }

      if (!this.scopeMatches(assignment, input.scope)) {
        continue
      }

      for (const permission of role.permissions) {
        permissions.add(permission)
      }
    }

    return Result.ok(Array.from(permissions))
  }

  private async loadUser(userId: string): Promise<Result<User>> {
    let id: UniqueEntityID

    try {
      id = new UniqueEntityID(userId)
    } catch (error) {
      return Result.fail('userId must be a valid UUID')
    }

    const user = await this.userRepository.findById(id)
    if (!user) {
      return Result.fail('user not found')
    }

    return Result.ok(user)
  }

  private async loadRoles(assignments: RoleAssignment[]): Promise<Result<Map<string, Role>>> {
    const uniqueRoleIds: UniqueEntityID[] = []
    const seen = new Set<string>()

    for (const assignment of assignments) {
      const idString = assignment.roleId.toString()
      if (seen.has(idString)) {
        continue
      }

      seen.add(idString)
      uniqueRoleIds.push(assignment.roleId)
    }

    const roles = await Promise.all(
      uniqueRoleIds.map((roleId) => this.roleRepository.findById(roleId)),
    )

    const map = new Map<string, Role>()

    for (let index = 0; index < uniqueRoleIds.length; index += 1) {
      const role = roles[index]
      if (!role) {
        return Result.fail('role referenced by user assignment not found')
      }

      map.set(uniqueRoleIds[index].toString(), role)
    }

    return Result.ok(map)
  }

  private isSameAssignment(a: RoleAssignment, b: RoleAssignment): boolean {
    const sameRole = a.roleId.equals(b.roleId)
    const aScope = a.scope
    const bScope = b.scope
    const sameScopeType = aScope.type === bScope.type
    const sameReference = aScope.referenceId === bScope.referenceId

    return sameRole && sameScopeType && sameReference
  }

  private scopeMatches(assignment: RoleAssignment, scope?: ScopeInput): boolean {
    if (!scope) {
      return true
    }

    const assignedScope = assignment.scope

    if (scope.type === 'global') {
      return assignedScope.type === 'global'
    }

    if (assignedScope.type === 'global') {
      return true
    }

    if (assignedScope.type !== scope.type) {
      return false
    }

    return assignedScope.referenceId === scope.referenceId
  }
}
