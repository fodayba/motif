import { Result } from '@domain/shared'
import type { HttpErrorDetail, HttpResponse, HttpRequest } from '../types'

export class HttpError extends Error {
  readonly status: number
  readonly code?: string
  readonly request: HttpRequest
  readonly response?: HttpResponse
  readonly causeError?: unknown

  constructor(detail: HttpErrorDetail) {
    super(detail.message)
    this.name = 'HttpError'
    this.status = detail.status
    this.code = detail.code
    this.request = detail.request
    this.response = detail.response
    this.causeError = detail.cause
  }

  static from(detail: HttpErrorDetail): HttpError {
    if (detail.cause instanceof HttpError) {
      return detail.cause
    }

    return new HttpError(detail)
  }

  static wrap(detail: HttpErrorDetail): Result<never> {
    const error = HttpError.from(detail)
    return Result.fail(error.message)
  }
}
