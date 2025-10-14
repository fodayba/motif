import type { IntegrationHealth } from './types'

export type WeatherAlert = {
  id: string
  type: 'storm' | 'wind' | 'heat' | 'cold' | 'flood' | 'lightning'
  title: string
  description: string
  severity: 'minor' | 'moderate' | 'severe'
  effectiveFrom: Date
  effectiveTo: Date
  source: string
}

export type WeatherForecastPeriod = {
  timestamp: Date
  temperatureCelsius: number
  feelsLikeCelsius?: number
  windSpeedKph?: number
  precipitationProbability?: number
  summary: string
}

export type WeatherForecast = {
  location: {
    latitude: number
    longitude: number
    label?: string
  }
  generatedAt: Date
  periods: WeatherForecastPeriod[]
}

export interface WeatherIntegrationClient {
  getForecast(params: { latitude: number; longitude: number; hours?: number }): Promise<WeatherForecast>
  getAlerts(params: { latitude: number; longitude: number }): Promise<WeatherAlert[]>
  checkHealth(): Promise<IntegrationHealth>
}
