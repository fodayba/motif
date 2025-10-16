import { UniqueEntityID, GeoCoordinate } from '@domain/shared'
import { Geofence, type GeofenceRepository, GPSLocation } from '@domain/equipment'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type {
  FirestoreClient,
  FirestoreDocument,
  FirestoreQueryConstraint,
} from '../../firebase/types'

type GeofenceDocument = FirestoreDocument<{
  name: string
  centerLatitude: number
  centerLongitude: number
  centerAccuracy?: number
  centerAltitude?: number
  centerTimestamp: string
  centerAddress?: string
  radius: number
  projectId?: string
  siteId?: string
  isActive: boolean
  alertsEnabled: boolean
  authorizedEquipmentIds?: string[]
  createdAt: string
  updatedAt: string
}>

export class FirebaseGeofenceRepository
  extends FirestoreRepository<Geofence>
  implements GeofenceRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'geofences')
  }

  protected toPersistence(geofence: Geofence): GeofenceDocument {
    return {
      name: geofence.name,
      centerLatitude: geofence.center.latitude,
      centerLongitude: geofence.center.longitude,
      centerAccuracy: geofence.center.accuracy,
      centerAltitude: geofence.center.altitude,
      centerTimestamp: geofence.center.timestamp.toISOString(),
      centerAddress: geofence.center.address,
      radius: geofence.radius,
      projectId: geofence.projectId?.toString(),
      siteId: geofence.siteId?.toString(),
      isActive: geofence.isActive,
      alertsEnabled: geofence.alertsEnabled,
      authorizedEquipmentIds: geofence.authorizedEquipmentIds?.map((id) => id.toString()),
      createdAt: geofence.createdAt.toISOString(),
      updatedAt: geofence.updatedAt.toISOString(),
    }
  }

  protected toDomain(document: GeofenceDocument & { id: string }): Geofence | null {
    const coordinateResult = GeoCoordinate.create(
      document.centerLatitude,
      document.centerLongitude,
    )
    if (!coordinateResult.isSuccess) {
      console.error('Failed to reconstruct GeoCoordinate:', coordinateResult.error)
      return null
    }
    const centerResult = GPSLocation.create({
      coordinate: coordinateResult.value!,
      accuracy: document.centerAccuracy,
      altitude: document.centerAltitude,
      timestamp: new Date(document.centerTimestamp),
      address: document.centerAddress,
    })
    if (!centerResult.isSuccess) {
      console.error('Failed to reconstruct GPS location:', centerResult.error)
      return null
    }
    const geofenceResult = Geofence.create(
      {
        name: document.name,
        center: centerResult.value!,
        radius: document.radius,
        projectId: document.projectId ? new UniqueEntityID(document.projectId) : undefined,
        siteId: document.siteId ? new UniqueEntityID(document.siteId) : undefined,
        isActive: document.isActive,
        alertsEnabled: document.alertsEnabled,
        authorizedEquipmentIds: document.authorizedEquipmentIds?.map(
          (id) => new UniqueEntityID(id),
        ),
        createdAt: new Date(document.createdAt),
        updatedAt: new Date(document.updatedAt),
      },
      new UniqueEntityID(document.id),
    )
    if (!geofenceResult.isSuccess) {
      console.error('Failed to reconstruct Geofence:', geofenceResult.error)
      return null
    }
    return geofenceResult.value ?? null
  }

  protected obtainId(geofence: Geofence): UniqueEntityID | null {
    return geofence.id
  }

  async findByProjectId(projectId: string): Promise<Geofence[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectId', op: '==', value: projectId },
      { field: 'name', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findBySiteId(siteId: string): Promise<Geofence[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'siteId', op: '==', value: siteId },
      { field: 'name', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findActive(): Promise<Geofence[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'isActive', op: '==', value: true },
      { field: 'name', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findByLocation(location: GPSLocation): Promise<Geofence[]> {
    const allGeofences = await this.findActive()
    return allGeofences.filter((geofence) => geofence.isLocationWithinGeofence(location))
  }

  async findAll(): Promise<Geofence[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'name', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }
}
