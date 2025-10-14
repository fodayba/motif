import type { IntegrationHealth } from './types'

export type GeocodeResult = {
  latitude: number
  longitude: number
  formattedAddress: string
  components: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  accuracy: 'rooftop' | 'range_interpolated' | 'approximate'
  source: string
}

export type RouteEstimate = {
  origin: { latitude: number; longitude: number }
  destination: { latitude: number; longitude: number }
  distanceKm: number
  durationMinutes: number
  travelMode: 'driving' | 'walking' | 'transit'
  congestionLevel?: 'low' | 'medium' | 'high'
  source: string
}

export interface MappingIntegrationClient {
  geocode(query: string): Promise<GeocodeResult | null>
  reverseGeocode(params: { latitude: number; longitude: number }): Promise<GeocodeResult | null>
  estimateRoute(params: {
    origin: { latitude: number; longitude: number }
    destination: { latitude: number; longitude: number }
    travelMode?: 'driving' | 'walking' | 'transit'
  }): Promise<RouteEstimate | null>
  checkHealth(): Promise<IntegrationHealth>
}
