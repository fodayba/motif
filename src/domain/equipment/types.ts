/**
 * Equipment Domain Types
 * Additional type definitions for the Asset & Equipment Management domain
 * Core enums and entities are exported from their respective files
 */

import type { EquipmentCategory } from './enums/equipment-category'
import type { EquipmentStatus } from './enums/equipment-status'
import type { MaintenanceType } from './enums/maintenance-type'
import type { MaintenanceStatus } from './enums/maintenance-status'
import type { MaintenanceScheduleType } from './enums/maintenance-schedule-type'
import type { SensorType } from './enums/sensor-type'
import type { DepreciationMethod } from './enums/depreciation-method'
import type { GPSLocation } from './value-objects/gps-location'
import type { Equipment } from './entities/equipment'

// ============================================================================
// Supporting Types and Interfaces
// ============================================================================

export interface Address {
  readonly street?: string
  readonly city?: string
  readonly state?: string
  readonly zipCode?: string
  readonly country?: string
  readonly formattedAddress?: string
}

export interface EquipmentSpecifications {
  readonly manufacturer?: string
  readonly model?: string
  readonly year?: number
  readonly serialNumber?: string
  readonly capacity?: string
  readonly weight?: string
  readonly dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: 'ft' | 'm'
  }
  readonly powerSource?: string
  readonly fuelType?: 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'other'
  readonly customFields?: Record<string, unknown>
}

export interface UtilizationMetrics {
  readonly totalHoursUsed: number
  readonly averageHoursPerDay: number
  readonly utilizationRate: number // Percentage
  readonly idleTimeHours: number
  readonly costPerHour: number
  readonly lastUsedDate?: Date
}

export interface FinancialMetrics {
  readonly acquisitionCost: number
  readonly currentValue: number
  readonly accumulatedDepreciation: number
  readonly bookValue: number
  readonly totalMaintenanceCost: number
  readonly totalOperatingCost: number
  readonly roi: number // Return on Investment percentage
}

// ============================================================================
// Additional Domain Entities (used for reads/reports, not aggregates)
// ============================================================================

export interface MaintenanceRecord {
  readonly id: string
  readonly equipmentId: string
  readonly scheduleId?: string
  readonly type: MaintenanceType
  readonly status: MaintenanceStatus
  readonly scheduledDate: Date
  readonly completedDate?: Date
  readonly performedBy?: string
  readonly laborHours?: number
  readonly laborCost?: number
  readonly partsCost?: number
  readonly totalCost?: number
  readonly description: string
  readonly notes?: string
  readonly checklistItems?: MaintenanceChecklistItem[]
  readonly attachments?: string[]
  readonly nextMaintenanceDate?: Date
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface MaintenanceChecklistItem {
  readonly id: string
  readonly description: string
  readonly isCompleted: boolean
  readonly completedBy?: string
  readonly completedDate?: Date
  readonly notes?: string
}

export interface IoTSensorData {
  readonly id: string
  readonly equipmentId: string
  readonly sensorType: SensorType
  readonly value: number
  readonly unit: string
  readonly timestamp: Date
  readonly isAnomalous: boolean
  readonly anomalyScore?: number
}

export interface MaintenancePrediction {
  readonly equipmentId: string
  readonly predictedFailureDate: Date
  readonly confidence: number // 0-1
  readonly failureType: string
  readonly recommendedAction: string
  readonly estimatedCost: number
  readonly priority: 'low' | 'medium' | 'high' | 'critical'
  readonly basedOnSensors: SensorType[]
  readonly generatedAt: Date
}

export interface GeofenceAlert {
  readonly id: string
  readonly equipmentId: string
  readonly geofenceId: string
  readonly alertType: string
  readonly location: GPSLocation
  readonly timestamp: Date
  readonly isAcknowledged: boolean
  readonly acknowledgedBy?: string
  readonly acknowledgedAt?: Date
  readonly notes?: string
}

export interface Certification {
  readonly id: string
  readonly name: string
  readonly issuingAuthority: string
  readonly certificationNumber: string
  readonly issueDate: Date
  readonly expiryDate: Date
  readonly documentUrl?: string
}

export interface LocationHistory {
  readonly equipmentId: string
  readonly location: GPSLocation
  readonly projectId?: string
  readonly siteId?: string
  readonly timestamp: Date
  readonly recordedBy?: 'GPS' | 'MANUAL' | 'RFID' | 'QR'
}

export interface DepreciationCalculation {
  readonly equipmentId: string
  readonly method: DepreciationMethod
  readonly acquisitionCost: number
  readonly salvageValue: number
  readonly usefulLife: number // in years or usage units
  readonly currentAge: number // in years or usage units
  readonly accumulatedDepreciation: number
  readonly bookValue: number
  readonly calculatedAt: Date
}

export interface ROIAnalysis {
  readonly equipmentId: string
  readonly acquisitionCost: number
  readonly totalRevenue: number
  readonly totalMaintenanceCost: number
  readonly totalOperatingCost: number
  readonly netProfit: number
  readonly roi: number // Percentage
  readonly paybackPeriodMonths: number
  readonly utilizationRate: number
  readonly costPerHour: number
  readonly revenuePerHour: number
  readonly analysisDate: Date
}

export interface DisposalRecommendation {
  readonly equipmentId: string
  readonly recommendedAction: 'SELL' | 'TRADE_IN' | 'SCRAP' | 'DONATE' | 'RETAIN'
  readonly estimatedResaleValue: number
  readonly marketConditions: 'STRONG' | 'MODERATE' | 'WEAK'
  readonly optimalDisposalDate: Date
  readonly reasoning: string
  readonly alternativeOptions?: Array<{
    action: string
    estimatedValue: number
    pros: string[]
    cons: string[]
  }>
  readonly generatedAt: Date
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface IEquipmentRepository {
  findById(id: string): Promise<Equipment | null>
  findAll(): Promise<Equipment[]>
  findByStatus(status: EquipmentStatus): Promise<Equipment[]>
  findByCategory(category: EquipmentCategory): Promise<Equipment[]>
  findByProject(projectId: string): Promise<Equipment[]>
  findBySite(siteId: string): Promise<Equipment[]>
  save(equipment: Equipment): Promise<void>
  update(id: string, equipment: Partial<Equipment>): Promise<void>
  delete(id: string): Promise<void>
}

export interface IMaintenanceRepository {
  findById(id: string): Promise<MaintenanceRecord | null>
  findByEquipment(equipmentId: string): Promise<MaintenanceRecord[]>
  findOverdue(): Promise<MaintenanceRecord[]>
  findScheduled(startDate: Date, endDate: Date): Promise<MaintenanceRecord[]>
  save(record: MaintenanceRecord): Promise<void>
  update(id: string, record: Partial<MaintenanceRecord>): Promise<void>
  delete(id: string): Promise<void>
}

export interface IGeofenceRepository {
  findById(id: string): Promise<import('./entities/geofence').Geofence | null>
  findAll(): Promise<import('./entities/geofence').Geofence[]>
  findActive(): Promise<import('./entities/geofence').Geofence[]>
  findByProject(projectId: string): Promise<import('./entities/geofence').Geofence[]>
  save(geofence: import('./entities/geofence').Geofence): Promise<void>
  update(id: string, geofence: Partial<import('./entities/geofence').Geofence>): Promise<void>
  delete(id: string): Promise<void>
}

