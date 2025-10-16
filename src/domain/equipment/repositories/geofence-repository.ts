import type { Geofence } from '../entities/geofence'
import type { GPSLocation } from '../value-objects/gps-location'

export interface GeofenceRepository {
  findByProjectId(projectId: string): Promise<Geofence[]>
  findBySiteId(siteId: string): Promise<Geofence[]>
  findActive(): Promise<Geofence[]>
  findByLocation(location: GPSLocation): Promise<Geofence[]>
  findAll(): Promise<Geofence[]>
}
