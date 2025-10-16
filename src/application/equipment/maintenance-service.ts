import { Result, UniqueEntityID, Money } from '@domain/shared'
import {
  MaintenanceSchedule,
  type MaintenanceScheduleType,
  type MaintenanceType,
} from '@domain/equipment'

/**
 * Maintenance Application Service
 * Orchestrates maintenance scheduling and tracking use cases
 */

// ============================================================================
// Repository Interfaces (to be implemented in infrastructure layer)
// ============================================================================

export interface MaintenanceScheduleRepository {
  findById(id: UniqueEntityID): Promise<MaintenanceSchedule | null>
  findByEquipment(equipmentId: UniqueEntityID): Promise<MaintenanceSchedule[]>
  findActive(): Promise<MaintenanceSchedule[]>
  findOverdue(): Promise<MaintenanceSchedule[]>
  findDueSoon(daysThreshold: number): Promise<MaintenanceSchedule[]>
  save(schedule: MaintenanceSchedule): Promise<void>
  delete(schedule: MaintenanceSchedule): Promise<void>
}

// ============================================================================
// Input Types
// ============================================================================

export type CreateMaintenanceScheduleInput = {
  equipmentId: string
  scheduleType: MaintenanceScheduleType
  maintenanceType: MaintenanceType
  interval: number
  description: string
  estimatedCost: number
  estimatedDuration: number
  taskList?: string[]
  partsRequired?: string[]
  nextDueDate: Date
}

export type UpdateMaintenanceScheduleInput = {
  scheduleId: string
  interval?: number
  estimatedCost?: number
  estimatedDuration?: number
  description?: string
  taskList?: string[]
  partsRequired?: string[]
}

export type RecordMaintenanceCompletionInput = {
  scheduleId: string
  completionDate: Date
}

export type DeactivateScheduleInput = {
  scheduleId: string
}

// ============================================================================
// Output Types
// ============================================================================

export type MaintenanceScheduleDTO = {
  id: string
  equipmentId: string
  scheduleType: MaintenanceScheduleType
  maintenanceType: MaintenanceType
  interval: number
  lastMaintenanceDate?: Date
  nextDueDate: Date
  estimatedCost: number
  estimatedDuration: number
  description: string
  taskList?: string[]
  partsRequired?: string[]
  isActive: boolean
  isOverdue: boolean
  isDueSoon: boolean
  daysOverdue?: number
  createdAt: Date
  updatedAt: Date
}

export type MaintenanceSummary = {
  id: string
  equipmentId: string
  maintenanceType: MaintenanceType
  nextDueDate: Date
  isOverdue: boolean
  daysOverdue?: number
}

export type MaintenanceCalendarEvent = {
  scheduleId: string
  equipmentId: string
  equipmentName: string
  maintenanceType: MaintenanceType
  scheduledDate: Date
  estimatedDuration: number
  estimatedCost: number
  description: string
}

// ============================================================================
// Maintenance Service
// ============================================================================

export class MaintenanceService {
  private readonly maintenanceScheduleRepo: MaintenanceScheduleRepository

  constructor(maintenanceScheduleRepo: MaintenanceScheduleRepository) {
    this.maintenanceScheduleRepo = maintenanceScheduleRepo
  }

  /**
   * Create a new maintenance schedule
   */
  async createSchedule(
    input: CreateMaintenanceScheduleInput,
  ): Promise<Result<MaintenanceScheduleDTO>> {
    try {
      const scheduleResult = MaintenanceSchedule.create({
        equipmentId: new UniqueEntityID(input.equipmentId),
        scheduleType: input.scheduleType,
        maintenanceType: input.maintenanceType,
        interval: input.interval,
        description: input.description,
        estimatedCost: input.estimatedCost,
        estimatedDuration: input.estimatedDuration,
        taskList: input.taskList,
        partsRequired: input.partsRequired,
        nextDueDate: input.nextDueDate,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (!scheduleResult.isSuccess) {
        return Result.fail(scheduleResult.error ?? 'Failed to create maintenance schedule')
      }

      await this.maintenanceScheduleRepo.save(scheduleResult.value!)

      return Result.ok(this.toDTO(scheduleResult.value!))
    } catch (error) {
      return Result.fail(`Failed to create maintenance schedule: ${error}`)
    }
  }

  /**
   * Get maintenance schedule by ID
   */
  async getScheduleById(scheduleId: string): Promise<Result<MaintenanceScheduleDTO>> {
    try {
      const schedule = await this.maintenanceScheduleRepo.findById(new UniqueEntityID(scheduleId))
      if (!schedule) {
        return Result.fail('Maintenance schedule not found')
      }
      return Result.ok(this.toDTO(schedule))
    } catch (error) {
      return Result.fail(`Failed to get maintenance schedule: ${error}`)
    }
  }

  /**
   * Get all schedules for an equipment
   */
  async getSchedulesByEquipment(equipmentId: string): Promise<Result<MaintenanceScheduleDTO[]>> {
    try {
      const schedules = await this.maintenanceScheduleRepo.findByEquipment(
        new UniqueEntityID(equipmentId),
      )
      const dtos = schedules.map((schedule) => this.toDTO(schedule))
      return Result.ok(dtos)
    } catch (error) {
      return Result.fail(`Failed to get maintenance schedules: ${error}`)
    }
  }

  /**
   * Update maintenance schedule
   */
  async updateSchedule(
    input: UpdateMaintenanceScheduleInput,
  ): Promise<Result<MaintenanceScheduleDTO>> {
    try {
      const schedule = await this.maintenanceScheduleRepo.findById(
        new UniqueEntityID(input.scheduleId),
      )
      if (!schedule) {
        return Result.fail('Maintenance schedule not found')
      }

      if (input.interval !== undefined) {
        const updateResult = schedule.updateInterval(input.interval)
        if (!updateResult.isSuccess) {
          return Result.fail(updateResult.error ?? 'Failed to update interval')
        }
      }

      if (input.estimatedCost !== undefined) {
        const updateResult = schedule.updateEstimatedCost(input.estimatedCost)
        if (!updateResult.isSuccess) {
          return Result.fail(updateResult.error ?? 'Failed to update estimated cost')
        }
      }

      if (input.taskList !== undefined) {
        schedule.updateTaskList(input.taskList)
      }

      if (input.partsRequired !== undefined) {
        schedule.updatePartsRequired(input.partsRequired)
      }

      await this.maintenanceScheduleRepo.save(schedule)

      return Result.ok(this.toDTO(schedule))
    } catch (error) {
      return Result.fail(`Failed to update maintenance schedule: ${error}`)
    }
  }

  /**
   * Record maintenance completion
   */
  async recordCompletion(
    input: RecordMaintenanceCompletionInput,
  ): Promise<Result<MaintenanceScheduleDTO>> {
    try {
      const schedule = await this.maintenanceScheduleRepo.findById(
        new UniqueEntityID(input.scheduleId),
      )
      if (!schedule) {
        return Result.fail('Maintenance schedule not found')
      }

      const completionResult = schedule.recordMaintenanceCompleted(input.completionDate)
      if (!completionResult.isSuccess) {
        return Result.fail(completionResult.error ?? 'Failed to record completion')
      }

      await this.maintenanceScheduleRepo.save(schedule)

      return Result.ok(this.toDTO(schedule))
    } catch (error) {
      return Result.fail(`Failed to record maintenance completion: ${error}`)
    }
  }

  /**
   * Activate maintenance schedule
   */
  async activateSchedule(scheduleId: string): Promise<Result<MaintenanceScheduleDTO>> {
    try {
      const schedule = await this.maintenanceScheduleRepo.findById(new UniqueEntityID(scheduleId))
      if (!schedule) {
        return Result.fail('Maintenance schedule not found')
      }

      const activateResult = schedule.activate()
      if (!activateResult.isSuccess) {
        return Result.fail(activateResult.error ?? 'Failed to activate schedule')
      }

      await this.maintenanceScheduleRepo.save(schedule)

      return Result.ok(this.toDTO(schedule))
    } catch (error) {
      return Result.fail(`Failed to activate maintenance schedule: ${error}`)
    }
  }

  /**
   * Deactivate maintenance schedule
   */
  async deactivateSchedule(input: DeactivateScheduleInput): Promise<Result<MaintenanceScheduleDTO>> {
    try {
      const schedule = await this.maintenanceScheduleRepo.findById(
        new UniqueEntityID(input.scheduleId),
      )
      if (!schedule) {
        return Result.fail('Maintenance schedule not found')
      }

      const deactivateResult = schedule.deactivate()
      if (!deactivateResult.isSuccess) {
        return Result.fail(deactivateResult.error ?? 'Failed to deactivate schedule')
      }

      await this.maintenanceScheduleRepo.save(schedule)

      return Result.ok(this.toDTO(schedule))
    } catch (error) {
      return Result.fail(`Failed to deactivate maintenance schedule: ${error}`)
    }
  }

  /**
   * Get overdue maintenance schedules
   */
  async getOverdueSchedules(): Promise<Result<MaintenanceSummary[]>> {
    try {
      const schedules = await this.maintenanceScheduleRepo.findOverdue()
      const summaries = schedules.map((schedule) => this.toSummary(schedule))
      return Result.ok(summaries)
    } catch (error) {
      return Result.fail(`Failed to get overdue schedules: ${error}`)
    }
  }

  /**
   * Get maintenance schedules due soon
   */
  async getSchedulesDueSoon(daysThreshold: number = 7): Promise<Result<MaintenanceSummary[]>> {
    try {
      const schedules = await this.maintenanceScheduleRepo.findDueSoon(daysThreshold)
      const summaries = schedules.map((schedule) => this.toSummary(schedule))
      return Result.ok(summaries)
    } catch (error) {
      return Result.fail(`Failed to get schedules due soon: ${error}`)
    }
  }

  /**
   * Get maintenance calendar for date range
   */
  async getMaintenanceCalendar(
    startDate: Date,
    endDate: Date,
  ): Promise<Result<MaintenanceCalendarEvent[]>> {
    try {
      const activeSchedules = await this.maintenanceScheduleRepo.findActive()

      // Filter schedules with nextDueDate in the range
      const schedulesInRange = activeSchedules.filter((schedule) => {
        return schedule.nextDueDate >= startDate && schedule.nextDueDate <= endDate
      })

      // Convert to calendar events
      const events: MaintenanceCalendarEvent[] = schedulesInRange.map((schedule) => ({
        scheduleId: schedule.id.toString(),
        equipmentId: schedule.equipmentId.toString(),
        equipmentName: '', // TODO: Fetch from equipment repository
        maintenanceType: schedule.maintenanceType,
        scheduledDate: schedule.nextDueDate,
        estimatedDuration: schedule.estimatedDuration,
        estimatedCost: schedule.estimatedCost,
        description: schedule.description,
      }))

      return Result.ok(events)
    } catch (error) {
      return Result.fail(`Failed to get maintenance calendar: ${error}`)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private toDTO(schedule: MaintenanceSchedule): MaintenanceScheduleDTO {
    return {
      id: schedule.id.toString(),
      equipmentId: schedule.equipmentId.toString(),
      scheduleType: schedule.scheduleType,
      maintenanceType: schedule.maintenanceType,
      interval: schedule.interval,
      lastMaintenanceDate: schedule.lastMaintenanceDate,
      nextDueDate: schedule.nextDueDate,
      estimatedCost: schedule.estimatedCost,
      estimatedDuration: schedule.estimatedDuration,
      description: schedule.description,
      taskList: schedule.taskList,
      partsRequired: schedule.partsRequired,
      isActive: schedule.isActive,
      isOverdue: schedule.isOverdue(),
      isDueSoon: schedule.isDueSoon(),
      daysOverdue: schedule.getDaysOverdue() > 0 ? schedule.getDaysOverdue() : undefined,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    }
  }

  private toSummary(schedule: MaintenanceSchedule): MaintenanceSummary {
    return {
      id: schedule.id.toString(),
      equipmentId: schedule.equipmentId.toString(),
      maintenanceType: schedule.maintenanceType,
      nextDueDate: schedule.nextDueDate,
      isOverdue: schedule.isOverdue(),
      daysOverdue: schedule.getDaysOverdue() > 0 ? schedule.getDaysOverdue() : undefined,
    }
  }
}
