import { UniqueEntityID } from '@domain/shared'
import {
  MaintenanceSchedule,
  type MaintenanceRepository,
  type MaintenanceScheduleType,
  type MaintenanceType,
} from '@domain/equipment'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type {
  FirestoreClient,
  FirestoreDocument,
  FirestoreQueryConstraint,
} from '../../firebase/types'

type MaintenanceScheduleDocument = FirestoreDocument<{
  equipmentId: string
  scheduleType: MaintenanceScheduleType
  maintenanceType: MaintenanceType
  interval: number
  lastMaintenanceDate?: string
  nextDueDate: string
  estimatedCost: number
  estimatedDuration: number
  description: string
  taskList?: string[]
  partsRequired?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}>

export class FirebaseMaintenanceRepository
  extends FirestoreRepository<MaintenanceSchedule>
  implements MaintenanceRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'maintenance-schedules')
  }

  protected toPersistence(schedule: MaintenanceSchedule): MaintenanceScheduleDocument {
    return {
      equipmentId: schedule.equipmentId.toString(),
      scheduleType: schedule.scheduleType,
      maintenanceType: schedule.maintenanceType,
      interval: schedule.interval,
      lastMaintenanceDate: schedule.lastMaintenanceDate?.toISOString(),
      nextDueDate: schedule.nextDueDate.toISOString(),
      estimatedCost: schedule.estimatedCost,
      estimatedDuration: schedule.estimatedDuration,
      description: schedule.description,
      taskList: schedule.taskList,
      partsRequired: schedule.partsRequired,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    }
  }

  protected toDomain(
    document: MaintenanceScheduleDocument & { id: string },
  ): MaintenanceSchedule | null {
    const scheduleResult = MaintenanceSchedule.create(
      {
        equipmentId: new UniqueEntityID(document.equipmentId),
        scheduleType: document.scheduleType,
        maintenanceType: document.maintenanceType,
        interval: document.interval,
        lastMaintenanceDate: document.lastMaintenanceDate
          ? new Date(document.lastMaintenanceDate)
          : undefined,
        nextDueDate: new Date(document.nextDueDate),
        estimatedCost: document.estimatedCost,
        estimatedDuration: document.estimatedDuration,
        description: document.description,
        taskList: document.taskList,
        partsRequired: document.partsRequired,
        isActive: document.isActive,
        createdAt: new Date(document.createdAt),
        updatedAt: new Date(document.updatedAt),
      },
      new UniqueEntityID(document.id),
    )

    if (!scheduleResult.isSuccess) {
      console.error('Failed to reconstruct MaintenanceSchedule:', scheduleResult.error)
      return null
    }

    return scheduleResult.value ?? null
  }

  protected obtainId(schedule: MaintenanceSchedule): UniqueEntityID | null {
    return schedule.id
  }

  async findByEquipmentId(equipmentId: string): Promise<MaintenanceSchedule[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'equipmentId', op: '==', value: equipmentId },
      { field: 'nextDueDate', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findOverdue(): Promise<MaintenanceSchedule[]> {
    const now = new Date().toISOString()
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'isActive', op: '==', value: true },
      { field: 'nextDueDate', op: '<', value: now },
      { field: 'nextDueDate', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findDueSoon(daysThreshold: number): Promise<MaintenanceSchedule[]> {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysThreshold)
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'isActive', op: '==', value: true },
      { field: 'nextDueDate', op: '>=', value: now.toISOString() },
      { field: 'nextDueDate', op: '<=', value: futureDate.toISOString() },
      { field: 'nextDueDate', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findByType(maintenanceType: string): Promise<MaintenanceSchedule[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'maintenanceType', op: '==', value: maintenanceType },
      { field: 'nextDueDate', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findActive(): Promise<MaintenanceSchedule[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'isActive', op: '==', value: true },
      { field: 'nextDueDate', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }

  async findAll(): Promise<MaintenanceSchedule[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'nextDueDate', op: 'orderBy', direction: 'asc' },
    ]
    return this.list(constraints)
  }
}
