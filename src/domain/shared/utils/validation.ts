import { Result } from '../core'

export const Validation = {
  positiveNumber(value: number, field: string): Result<void> {
    if (Number.isNaN(value) || value <= 0) {
      return Result.fail(`${field} must be greater than zero`)
    }

    return Result.ok(undefined)
  },
  nonNegativeNumber(value: number, field: string): Result<void> {
    if (Number.isNaN(value) || value < 0) {
      return Result.fail(`${field} cannot be negative`)
    }

    return Result.ok(undefined)
  },
  percentage(value: number, field: string): Result<void> {
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return Result.fail(`${field} must be between 0 and 100`)
    }

    return Result.ok(undefined)
  },
  dateOrder(start: Date, end: Date, startLabel: string, endLabel: string): Result<void> {
    if (start.getTime() > end.getTime()) {
      return Result.fail(`${startLabel} must be before ${endLabel}`)
    }

    return Result.ok(undefined)
  },
  dateNotInFuture(date: Date, label: string): Result<void> {
    const now = new Date()
    if (date.getTime() > now.getTime()) {
      return Result.fail(`${label} cannot be in the future`)
    }

    return Result.ok(undefined)
  },
}
