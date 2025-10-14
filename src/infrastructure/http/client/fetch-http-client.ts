import { HttpError } from '../errors/http-error'
import type {
  HttpClient,
  HttpClientConfig,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  RetryPolicy,
} from '../types'

const buildUrl = (baseUrl: string | undefined, url: string, query?: HttpRequest['query']) => {
  const target = new URL(url, baseUrl)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        target.searchParams.set(key, String(value))
      }
    })
  }

  return target.toString()
}

const defaultRetryPolicy: RetryPolicy = {
  maxRetries: 0,
  retryDelay: () => 0,
  shouldRetry: () => false,
}

export class FetchHttpClient implements HttpClient {
  private readonly config: HttpClientConfig
  private readonly interceptors: HttpInterceptor[]
  private readonly retryPolicy: RetryPolicy

  constructor(config?: HttpClientConfig) {
    this.config = config ?? {}
    this.interceptors = [...(config?.interceptors ?? [])]
    this.retryPolicy = config?.retryPolicy ?? defaultRetryPolicy
  }

  async request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>> {
    const mergedRequest = await this.applyRequestInterceptors({
      ...request,
      headers: {
        ...(this.config.defaultHeaders ?? {}),
        ...(request.headers ?? {}),
      },
    })

    const url = buildUrl(this.config.baseUrl, mergedRequest.url, mergedRequest.query)

    const response = await this.executeWithRetry<T>({
      ...mergedRequest,
      url,
    })

    return response
  }

  get<T = unknown>(url: string, config?: Omit<HttpRequest, 'method' | 'url'>) {
    return this.request<T>({
      method: 'GET',
      url,
      ...config,
    })
  }

  post<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequest, 'method' | 'url' | 'body'>,
  ) {
    return this.request<T>({
      method: 'POST',
      url,
      body,
      ...config,
    })
  }

  put<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequest, 'method' | 'url' | 'body'>,
  ) {
    return this.request<T>({
      method: 'PUT',
      url,
      body,
      ...config,
    })
  }

  patch<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequest, 'method' | 'url' | 'body'>,
  ) {
    return this.request<T>({
      method: 'PATCH',
      url,
      body,
      ...config,
    })
  }

  delete<T = unknown>(
    url: string,
    config?: Omit<HttpRequest, 'method' | 'url'>,
  ) {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    })
  }

  private async executeWithRetry<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    let attempt = 0
    let lastError: HttpError | undefined

    while (attempt <= this.retryPolicy.maxRetries) {
      try {
        const response = await this.executeRequest<T>(request)
        return await this.applyResponseInterceptors(response)
      } catch (error) {
        const httpError = HttpError.from(
          error instanceof HttpError
            ? {
                status: error.status,
                message: error.message,
                request: error.request,
                response: error.response,
                code: error.code,
                cause: error.causeError,
              }
            : {
                status: 0,
                message: error instanceof Error ? error.message : 'network error',
                request,
                cause: error,
              },
        )

        lastError = httpError

        if (attempt >= this.retryPolicy.maxRetries) {
          throw await this.applyErrorInterceptors(httpError)
        }

        if (!this.retryPolicy.shouldRetry({
          status: httpError.status,
          message: httpError.message,
          code: httpError.code,
          request,
          response: httpError.response,
          cause: httpError.causeError,
        })) {
          throw await this.applyErrorInterceptors(httpError)
        }

        const delay = this.retryPolicy.retryDelay(attempt + 1, {
          status: httpError.status,
          message: httpError.message,
          code: httpError.code,
          request,
          response: httpError.response,
          cause: httpError.causeError,
        })

        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        attempt += 1
      }
    }

    throw lastError ?? new Error('Http request failed')
  }

  private async executeRequest<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const controller = new AbortController()
    const timeout = this.config.timeoutMs
    const timeoutId = timeout
      ? setTimeout(() => {
          controller.abort()
        }, timeout)
      : undefined

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: this.serializeBody(request.body),
        signal: request.signal ?? controller.signal,
      })

      const data = await this.parseResponseBody<T>(response)
      const headers = Object.fromEntries(response.headers.entries())

      const httpResponse: HttpResponse<T> = {
        status: response.status,
        headers,
        data,
        request,
      }

      if (!response.ok) {
        throw new HttpError({
          status: response.status,
          message: this.extractErrorMessage(data, response.statusText),
          request,
          response: httpResponse,
        })
      }

      return httpResponse
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpError({
          status: 0,
          message: 'request aborted',
          request,
          cause: error,
        })
      }

      throw new HttpError({
        status: 0,
        message: error instanceof Error ? error.message : 'network error',
        request,
        cause: error,
      })
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }

  private async applyRequestInterceptors(request: HttpRequest): Promise<HttpRequest> {
    let current = request

    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        current = await interceptor.onRequest(current)
      }
    }

    return current
  }

  private async applyResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let current = response

    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        current = await interceptor.onResponse(current)
      }
    }

    return current
  }

  private async applyErrorInterceptors(error: HttpError): Promise<HttpError> {
    let current: HttpError = error

    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        const detail = await interceptor.onError({
          status: current.status,
          message: current.message,
          code: current.code,
          request: current.request,
          response: current.response,
          cause: current.causeError,
        })

        current = HttpError.from(detail)
      }
    }

    return current
  }

  private serializeBody(body: unknown): BodyInit | undefined {
    if (body === undefined || body === null) {
      return undefined
    }

    if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
      return body
    }

    if (typeof body === 'string') {
      return body
    }

    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      return body as ArrayBuffer
    }

    if (typeof body === 'object') {
      return JSON.stringify(body)
    }

    return String(body)
  }

  private async parseResponseBody<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') ?? ''

    if (response.status === 204 || contentType.includes('application/octet-stream')) {
      return undefined as T
    }

    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    if (contentType.includes('text/')) {
      return (await response.text()) as unknown as T
    }

    return (await response.arrayBuffer()) as unknown as T
  }

  private extractErrorMessage(data: unknown, fallback: string): string {
    if (typeof data === 'string') {
      return data
    }

    if (data && typeof data === 'object') {
      const message = (data as Record<string, unknown>).message
      if (typeof message === 'string') {
        return message
      }
    }

    return fallback
  }
}
