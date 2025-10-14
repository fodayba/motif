import type { HttpErrorDetail, HttpInterceptor } from '../types'

type ExponentialBackoffOptions = {
  baseDelayMs?: number
  maxDelayMs?: number
  jitter?: boolean
}

const defaultBackoff: Required<ExponentialBackoffOptions> = {
  baseDelayMs: 250,
  maxDelayMs: 10_000,
  jitter: true,
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const createRetryInterceptor = (
  shouldRetry: (error: HttpErrorDetail) => boolean,
  options?: ExponentialBackoffOptions,
): HttpInterceptor & { calculateDelay: (attempt: number) => number } => {
  const config = { ...defaultBackoff, ...(options ?? {}) }

  const calculateDelay = (attempt: number) => {
    const exponential = config.baseDelayMs * 2 ** (attempt - 1)
    const delay = clamp(exponential, config.baseDelayMs, config.maxDelayMs)

    if (!config.jitter) {
      return delay
    }

    const jitterValue = (delay / 2) * Math.random()
    return delay / 2 + jitterValue
  }

  return {
    calculateDelay,
    async onError(error) {
      if (!shouldRetry(error)) {
        return error
      }

      return {
        ...error,
        message: `${error.message} (retrying)`,
      }
    },
  }
}
