export type IntegrationHealth = {
  service: string
  status: 'operational' | 'degraded' | 'down'
  checkedAt: Date
  message?: string
}

export type IntegrationOperationResult = {
  success: boolean
  message?: string
  referenceId?: string
  metadata?: Record<string, unknown>
}
