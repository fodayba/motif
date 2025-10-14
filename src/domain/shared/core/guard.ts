type GuardResult = { success: true } | { success: false; message: string }

type GuardArgument = {
  argument: unknown
  argumentName: string
}

export const Guard = {
  againstNullOrUndefined: (value: unknown, name: string): GuardResult => {
    if (value === null || value === undefined) {
      return { success: false, message: `${name} is required` }
    }

    return { success: true }
  },
  againstNullOrUndefinedBulk: (args: GuardArgument[]): GuardResult => {
    for (const arg of args) {
      if (arg.argument === null || arg.argument === undefined) {
        return { success: false, message: `${arg.argumentName} is required` }
      }
    }

    return { success: true }
  },
  againstEmptyString: (value: string, name: string): GuardResult => {
    if (value.trim().length === 0) {
      return { success: false, message: `${name} cannot be empty` }
    }

    return { success: true }
  },
  againstNegative: (value: number, name: string): GuardResult => {
    if (value < 0) {
      return { success: false, message: `${name} cannot be negative` }
    }

    return { success: true }
  },
}
