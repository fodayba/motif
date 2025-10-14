export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpRequest = {
  method: HttpMethod
  url: string
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
}

export type HttpResponse<T = unknown> = {
  status: number
  headers: Record<string, string>
  data: T
  request: HttpRequest
}

export type HttpErrorDetail = {
  status: number
  message: string
  code?: string
  request: HttpRequest
  response?: HttpResponse
  cause?: unknown
}

export type RetryPolicy = {
  maxRetries: number
  retryDelay: (attempt: number, error: HttpErrorDetail) => number
  shouldRetry: (error: HttpErrorDetail) => boolean
}

export type HttpInterceptor = {
  onRequest?(request: HttpRequest): Promise<HttpRequest> | HttpRequest
  onResponse?<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> | HttpResponse<T>
  onError?(error: HttpErrorDetail): Promise<HttpErrorDetail> | HttpErrorDetail
}

export type HttpClientConfig = {
  baseUrl?: string
  defaultHeaders?: Record<string, string>
  retryPolicy?: RetryPolicy
  interceptors?: HttpInterceptor[]
  timeoutMs?: number
}

export interface HttpClient {
  request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>>
  get<T = unknown>(url: string, config?: Omit<HttpRequest, 'method' | 'url'>): Promise<HttpResponse<T>>
  post<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequest, 'method' | 'url' | 'body'>,
  ): Promise<HttpResponse<T>>
  put<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequest, 'method' | 'url' | 'body'>,
  ): Promise<HttpResponse<T>>
  patch<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequest, 'method' | 'url' | 'body'>,
  ): Promise<HttpResponse<T>>
  delete<T = unknown>(
    url: string,
    config?: Omit<HttpRequest, 'method' | 'url'>,
  ): Promise<HttpResponse<T>>
}
