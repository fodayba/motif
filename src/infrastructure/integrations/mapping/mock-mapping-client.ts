import {
  type GeocodeResult,
  type IntegrationHealth,
  type MappingIntegrationClient,
  type RouteEstimate,
} from '@application/integrations'

const SAMPLE_ADDRESS: GeocodeResult = {
  latitude: 40.7128,
  longitude: -74.006,
  formattedAddress: '350 5th Ave, New York, NY 10118, USA',
  components: {
    street: '350 5th Ave',
    city: 'New York',
    state: 'NY',
    postalCode: '10118',
    country: 'USA',
  },
  accuracy: 'rooftop',
  source: 'mock-maps',
}

export class MockMappingIntegrationClient implements MappingIntegrationClient {
  async geocode(query: string): Promise<GeocodeResult | null> {
    if (!query.trim()) {
      return null
    }

    return {
      ...SAMPLE_ADDRESS,
      formattedAddress: `${query}, mock result`,
    }
  }

  async reverseGeocode(params: { latitude: number; longitude: number }): Promise<GeocodeResult | null> {
    if (!Number.isFinite(params.latitude) || !Number.isFinite(params.longitude)) {
      return null
    }

    return {
      ...SAMPLE_ADDRESS,
      latitude: params.latitude,
      longitude: params.longitude,
      formattedAddress: `Lat ${params.latitude.toFixed(4)}, Lng ${params.longitude.toFixed(4)}`,
    }
  }

  async estimateRoute(params: {
    origin: { latitude: number; longitude: number }
    destination: { latitude: number; longitude: number }
    travelMode?: 'driving' | 'walking' | 'transit'
  }): Promise<RouteEstimate | null> {
    const { origin, destination } = params
    if (!this.isValidCoord(origin) || !this.isValidCoord(destination)) {
      return null
    }

    const travelMode = params.travelMode ?? 'driving'
    const distanceKm = this.calculateDistance(origin, destination)
    const durationMinutes = this.estimateDuration(distanceKm, travelMode)

    return {
      origin,
      destination,
      distanceKm,
      durationMinutes,
      travelMode,
      congestionLevel: travelMode === 'driving' ? 'medium' : undefined,
      source: 'mock-maps',
    }
  }

  async checkHealth(): Promise<IntegrationHealth> {
    return {
      service: 'mock-mapping-integration',
      status: 'operational',
      checkedAt: new Date(),
      message: 'Mock mapping API responding normally',
    }
  }

  private isValidCoord(coord: { latitude: number; longitude: number }): boolean {
    return (
      Number.isFinite(coord.latitude) &&
      Number.isFinite(coord.longitude) &&
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
    )
  }

  private calculateDistance(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): number {
    const toRad = (degrees: number) => (degrees * Math.PI) / 180
    const R = 6371 // Earth radius in kilometers

    const dLat = toRad(destination.latitude - origin.latitude)
    const dLon = toRad(destination.longitude - origin.longitude)
    const lat1 = toRad(origin.latitude)
    const lat2 = toRad(destination.latitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 100) / 100
  }

  private estimateDuration(distanceKm: number, mode: 'driving' | 'walking' | 'transit'): number {
    const speedKph = mode === 'walking' ? 5 : mode === 'transit' ? 40 : 55
    const durationHours = distanceKm / speedKph
    return Math.round(durationHours * 60)
  }
}
