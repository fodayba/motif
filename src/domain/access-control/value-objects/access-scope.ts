import { Result, ValueObject } from '../../shared'

export type ScopeType = 'global' | 'project' | 'location'

type AccessScopeProps = {
  type: ScopeType
  referenceId?: string
}

export class AccessScope extends ValueObject<AccessScopeProps> {
  private constructor(props: AccessScopeProps) {
    super(props)
  }

  get type(): ScopeType {
    return this.props.type
  }

  get referenceId(): string | undefined {
    return this.props.referenceId
  }

  public static global(): AccessScope {
    return new AccessScope({ type: 'global' })
  }

  public static project(projectId: string): Result<AccessScope> {
    if (!projectId) {
      return Result.fail('projectId is required')
    }

    return Result.ok(new AccessScope({ type: 'project', referenceId: projectId }))
  }

  public static location(locationId: string): Result<AccessScope> {
    if (!locationId) {
      return Result.fail('locationId is required')
    }

    return Result.ok(new AccessScope({ type: 'location', referenceId: locationId }))
  }
}
