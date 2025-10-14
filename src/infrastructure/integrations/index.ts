import type {
  AccountingIntegrationClient,
  MappingIntegrationClient,
  WeatherIntegrationClient,
} from '@application/integrations'
import { MockAccountingIntegrationClient } from './accounting/mock-accounting-client'
import { MockWeatherIntegrationClient } from './weather/mock-weather-client'
import { MockMappingIntegrationClient } from './mapping/mock-mapping-client'

export * from './accounting/mock-accounting-client'
export * from './weather/mock-weather-client'
export * from './mapping/mock-mapping-client'

export type ExternalIntegrationClients = {
  accounting: AccountingIntegrationClient
  weather: WeatherIntegrationClient
  mapping: MappingIntegrationClient
}

export const createMockIntegrationClients = (): ExternalIntegrationClients => {
  const accounting = new MockAccountingIntegrationClient()
  const weather = new MockWeatherIntegrationClient()
  const mapping = new MockMappingIntegrationClient()

  return { accounting, weather, mapping }
}
