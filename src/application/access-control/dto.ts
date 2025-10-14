import { Result, UniqueEntityID } from '@domain/shared'
import { AccessScope } from '@domain/access-control'
import { RoleAssignment } from '@domain/users'

export type ScopeInput =
  | { type: 'global' }
  | { type: 'project'; referenceId: string }
  | { type: 'location'; referenceId: string }

export type RoleAssignmentInput = {
  roleId: string
  scope: ScopeInput
}

export const createScope = (input: ScopeInput): Result<AccessScope> => {
  switch (input.type) {
    case 'global':
      return Result.ok(AccessScope.global())
    case 'project':
      return AccessScope.project(input.referenceId)
    case 'location':
      return AccessScope.location(input.referenceId)
    default:
      return Result.fail('unknown scope type')
  }
}

export const createRoleAssignment = (
  input: RoleAssignmentInput,
): Result<RoleAssignment> => {
  let roleId: UniqueEntityID
  try {
    roleId = new UniqueEntityID(input.roleId)
  } catch (error) {
    return Result.fail('roleId must be a valid UUID')
  }

  const scopeResult = createScope(input.scope)
  if (!scopeResult.isSuccess || !scopeResult.value) {
    return Result.fail(scopeResult.error ?? 'invalid scope')
  }

  const assignmentResult = RoleAssignment.create({
    roleId,
    scope: scopeResult.value,
  })

  if (!assignmentResult.isSuccess || !assignmentResult.value) {
    return Result.fail(assignmentResult.error ?? 'invalid role assignment')
  }

  return Result.ok(assignmentResult.value)
}
