import { Guard, Result, ValueObject } from '../../shared'

type ProjectNameProps = {
  value: string
}

export class ProjectName extends ValueObject<ProjectNameProps> {
  private constructor(props: ProjectNameProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(raw: string): Result<ProjectName> {
    const guardResult = Guard.againstEmptyString(raw, 'project name')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (raw.length < 3) {
      return Result.fail('project name must be at least 3 characters')
    }

    return Result.ok(new ProjectName({ value: raw.trim() }))
  }
}
