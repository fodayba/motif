export class Result<T> {
  private readonly success: boolean
  private readonly data?: T
  private readonly failure?: string

  private constructor(success: boolean, data?: T, failure?: string) {
    this.success = success
    this.data = data
    this.failure = failure
  }

  get isSuccess(): boolean {
    return this.success
  }

  get value(): T | undefined {
    return this.data
  }

  get error(): string | undefined {
    return this.failure
  }

  public static ok<T>(value: T): Result<T> {
    return new Result<T>(true, value)
  }

  public static fail<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error)
  }
}
