export class UniqueEntityID {
  private readonly value: string

  constructor(id?: string) {
    if (id && !UniqueEntityID.isValid(id)) {
      throw new Error('UniqueEntityID must be a uuid string')
    }

    this.value = id ?? crypto.randomUUID()
  }

  public toString(): string {
    return this.value
  }

  public equals(other: UniqueEntityID | undefined | null): boolean {
    if (!other) {
      return false
    }

    return this.value === other.value
  }

  private static isValid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  }
}
