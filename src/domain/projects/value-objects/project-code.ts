import { Guard, Result, ValueObject } from '../../shared'

type ProjectCodeProps = {
  value: string
}

const PROJECT_CODE_REGEX = /^[A-Z0-9-]{3,20}$/

export class ProjectCode extends ValueObject<ProjectCodeProps> {
  private constructor(props: ProjectCodeProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  public static create(raw: string): Result<ProjectCode> {
    const guardResult = Guard.againstEmptyString(raw, 'project code')
    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    const normalized = raw.toUpperCase()

    if (!PROJECT_CODE_REGEX.test(normalized)) {
      return Result.fail('project code must be 3-20 chars, alphanumeric or dash')
    }

    return Result.ok(new ProjectCode({ value: normalized }))
  }
}
