import {
  type IntegrationHealth,
  type WeatherAlert,
  type WeatherForecast,
  type WeatherIntegrationClient,
} from '@application/integrations'

const SAMPLE_FORECAST: WeatherForecast = {
  location: {
    latitude: 34.0522,
    longitude: -118.2437,
    label: 'Los Angeles, CA',
  },
  generatedAt: new Date(),
  periods: Array.from({ length: 6 }).map((_, index) => {
    const timestamp = new Date(Date.now() + index * 1000 * 60 * 60 * 3)
    return {
      timestamp,
      temperatureCelsius: 22 - index,
      feelsLikeCelsius: 22 - index + 0.5,
      windSpeedKph: 12 + index,
      precipitationProbability: index * 0.1,
      summary: index < 2 ? 'Partly cloudy' : 'Increasing clouds',
    }
  }),
}

const SAMPLE_ALERTS: WeatherAlert[] = [
  {
    id: 'mock-alert-001',
    type: 'wind',
    title: 'Wind Advisory',
    description: 'Gusts up to 35 mph expected on elevated job sites.',
    severity: 'moderate',
    effectiveFrom: new Date(Date.now() - 1000 * 60 * 30),
    effectiveTo: new Date(Date.now() + 1000 * 60 * 60 * 3),
    source: 'mock-weather-service',
  },
]

export class MockWeatherIntegrationClient implements WeatherIntegrationClient {
  async getForecast(params: {
    latitude: number
    longitude: number
    hours?: number
  }): Promise<WeatherForecast> {
    const hours = params.hours ?? SAMPLE_FORECAST.periods.length * 3
    const interval = 1000 * 60 * 60 * 3

    return {
      location: {
        latitude: params.latitude,
        longitude: params.longitude,
        label: SAMPLE_FORECAST.location.label,
      },
      generatedAt: new Date(),
      periods: Array.from({ length: Math.ceil(hours / 3) }).map((_, index) => {
        const base = SAMPLE_FORECAST.periods[index % SAMPLE_FORECAST.periods.length]
        return {
          ...base,
          timestamp: new Date(Date.now() + index * interval),
        }
      }),
    }
  }

  async getAlerts(_params: { latitude: number; longitude: number }): Promise<WeatherAlert[]> {
    return SAMPLE_ALERTS.map((alert) => ({
      ...alert,
      effectiveFrom: new Date(alert.effectiveFrom),
      effectiveTo: new Date(alert.effectiveTo),
    }))
  }

  async checkHealth(): Promise<IntegrationHealth> {
    return {
      service: 'mock-weather-integration',
      status: 'operational',
      checkedAt: new Date(),
      message: 'Mock weather API responding normally',
    }
  }
}
