import { Result, UniqueEntityID } from '@domain/shared'
import { Email } from '@domain/shared/value-objects/email'
import { User, UserProfile, type RoleAssignment, type UserRepository } from '@domain/users'
import type { RoleRepository } from '@domain/access-control'
import { createRoleAssignment, type RoleAssignmentInput } from '../access-control/dto'
import type { IdentityGateway } from './identity-gateway'

export type UserProfileInput = {
  firstName: string
  lastName: string
  jobTitle?: string
}

export type InviteUserInput = {
  email: string
  profile: UserProfileInput
  roleAssignments?: RoleAssignmentInput[]
}

export type RegisterUserInput = InviteUserInput & {
  password: string
}

export type AuthenticateInput = {
  email: string
  password: string
}

export class AuthService {
  private readonly userRepository: UserRepository
  private readonly roleRepository: RoleRepository
  private readonly identityGateway: IdentityGateway

  constructor(deps: {
    userRepository: UserRepository
    roleRepository: RoleRepository
    identityGateway: IdentityGateway
  }) {
    this.userRepository = deps.userRepository
    this.roleRepository = deps.roleRepository
    this.identityGateway = deps.identityGateway
  }

  async inviteUser(input: InviteUserInput): Promise<Result<User>> {
    const emailResult = Email.create(input.email)
    if (!emailResult.isSuccess || !emailResult.value) {
      return Result.fail(emailResult.error ?? 'invalid email')
    }

    const existing = await this.userRepository.findByEmail(emailResult.value.value)
    if (existing) {
      return Result.fail('user with this email already exists')
    }

    const profileResult = UserProfile.create({
      firstName: input.profile.firstName,
      lastName: input.profile.lastName,
      jobTitle: input.profile.jobTitle,
    })

    if (!profileResult.isSuccess || !profileResult.value) {
      return Result.fail(profileResult.error ?? 'invalid profile')
    }

    const assignmentsResult = await this.resolveAssignments(
      input.roleAssignments ?? [],
    )

    if (!assignmentsResult.isSuccess || !assignmentsResult.value) {
      return Result.fail(assignmentsResult.error ?? 'invalid role assignments')
    }

    const userResult = User.create({
      email: emailResult.value,
      profile: profileResult.value,
      status: 'invited',
      roleAssignments: assignmentsResult.value,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'failed to create user')
    }

    const user = userResult.value

    await this.identityGateway.sendInvitation({
      userId: user.id,
      email: emailResult.value.value,
    })

    await this.userRepository.save(user)

    return Result.ok(user)
  }

  async registerUser(input: RegisterUserInput): Promise<Result<User>> {
    if (!input.password || input.password.trim().length < 8) {
      return Result.fail('password must be at least 8 characters')
    }

    const emailResult = Email.create(input.email)
    if (!emailResult.isSuccess || !emailResult.value) {
      return Result.fail(emailResult.error ?? 'invalid email')
    }

    const existing = await this.userRepository.findByEmail(emailResult.value.value)
    if (existing) {
      return Result.fail('user with this email already exists')
    }

    const profileResult = UserProfile.create({
      firstName: input.profile.firstName,
      lastName: input.profile.lastName,
      jobTitle: input.profile.jobTitle,
    })

    if (!profileResult.isSuccess || !profileResult.value) {
      return Result.fail(profileResult.error ?? 'invalid profile')
    }

    const assignmentsResult = await this.resolveAssignments(
      input.roleAssignments ?? [],
    )

    if (!assignmentsResult.isSuccess || !assignmentsResult.value) {
      return Result.fail(assignmentsResult.error ?? 'invalid role assignments')
    }

    const userResult = User.create({
      email: emailResult.value,
      profile: profileResult.value,
      status: 'active',
      roleAssignments: assignmentsResult.value,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'failed to create user')
    }

    const user = userResult.value

    await this.identityGateway.createCredentials({
      userId: user.id,
      email: emailResult.value.value,
      password: input.password,
    })

    await this.userRepository.save(user)

    return Result.ok(user)
  }

  async authenticate(input: AuthenticateInput): Promise<Result<User>> {
    const emailResult = Email.create(input.email)
    if (!emailResult.isSuccess || !emailResult.value) {
      return Result.fail(emailResult.error ?? 'invalid email')
    }

    const userId = await this.identityGateway.verifyCredentials({
      email: emailResult.value.value,
      password: input.password,
    })

    if (!userId) {
      return Result.fail('invalid credentials')
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      return Result.fail('user not found')
    }

    if (user.status !== 'active') {
      return Result.fail('user is not active')
    }

    user.recordSignIn(new Date())
    await this.userRepository.save(user)

    return Result.ok(user)
  }

  async signOut(userId: string): Promise<Result<void>> {
    const idResult = this.parseUniqueId(userId)
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid user id')
    }

    await this.identityGateway.revokeSessions(idResult.value)

    return Result.ok(undefined)
  }

  async activateUser(userId: string): Promise<Result<User>> {
    const userResult = await this.loadUser(userId)
    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'user not found')
    }

    const user = userResult.value
    user.activate()
    await this.userRepository.save(user)

    return Result.ok(user)
  }

  async suspendUser(userId: string): Promise<Result<User>> {
    const userResult = await this.loadUser(userId)
    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'user not found')
    }

    const user = userResult.value
    user.suspend()
    await this.userRepository.save(user)
    await this.identityGateway.revokeSessions(user.id)

    return Result.ok(user)
  }

  async disableUser(userId: string): Promise<Result<User>> {
    const userResult = await this.loadUser(userId)
    if (!userResult.isSuccess || !userResult.value) {
      return Result.fail(userResult.error ?? 'user not found')
    }

    const user = userResult.value
    user.disable()
    await this.userRepository.save(user)
    await this.identityGateway.revokeSessions(user.id)

    return Result.ok(user)
  }

  private async resolveAssignments(
    assignments: RoleAssignmentInput[],
  ): Promise<Result<RoleAssignment[]>> {
    const resolved: RoleAssignment[] = []

    for (const assignment of assignments) {
      const assignmentResult = createRoleAssignment(assignment)
      if (!assignmentResult.isSuccess || !assignmentResult.value) {
        return Result.fail(assignmentResult.error ?? 'invalid role assignment')
      }

      const role = await this.roleRepository.findById(assignmentResult.value.roleId)
      if (!role) {
        return Result.fail('role not found')
      }

      resolved.push(assignmentResult.value)
    }

    return Result.ok(resolved)
  }

  private parseUniqueId(value: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail('value must be a valid UUID')
    }
  }

  private async loadUser(userId: string): Promise<Result<User>> {
    const idResult = this.parseUniqueId(userId)
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid user id')
    }

    const user = await this.userRepository.findById(idResult.value)
    if (!user) {
      return Result.fail('user not found')
    }

    return Result.ok(user)
  }
}
