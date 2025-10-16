import type { MaintenanceSchedule } from '../entities/maintenance-schedule'

export interface MaintenanceRepository {
  findByEquipmentId(equipmentId: string): Promise<MaintenanceSchedule[]>
  findOverdue(): Promise<MaintenanceSchedule[]>
  findDueSoon(daysThreshold: number): Promise<MaintenanceSchedule[]>
  findByType(maintenanceType: string): Promise<MaintenanceSchedule[]>
  findActive(): Promise<MaintenanceSchedule[]>
  findAll(): Promise<MaintenanceSchedule[]>
}
