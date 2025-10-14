export abstract class ValueObject<Props extends Record<string, unknown>> {
  protected readonly props: Props

  protected constructor(props: Props) {
    this.props = Object.freeze(props)
  }

  public equals(object?: ValueObject<Props>): boolean {
    if (object === null || object === undefined) {
      return false
    }

    if (object === this) {
      return true
    }

    return ValueObject.shallowEqual(this.props, object.props)
  }

  private static shallowEqual<T extends Record<string, unknown>>(a: T, b: T) {
    const entries = Object.entries(a)
    return entries.every(([key, value]) => Object.is(value, b[key as keyof T]))
  }
}
