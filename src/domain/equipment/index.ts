/**
 * Equipment Domain - Public API
 * Exports all types, entities, value objects, enums, and interfaces
 */

// Entities
export * from './entities/equipment'
export * from './entities/maintenance-schedule'
export * from './entities/geofence'
export * from './entities/iot-sensor'
export * from './entities/check-in-out'
export * from './entities/equipment-transfer'

// Enums
export * from './enums/equipment-category'
export * from './enums/equipment-status'
export * from './enums/maintenance-type'
export * from './enums/maintenance-status'
export * from './enums/maintenance-schedule-type'
export * from './enums/sensor-type'
export * from './enums/depreciation-method'
export * from './enums/geofence-alert-type'
export * from './enums/transfer-status'

// Value Objects
export * from './value-objects/asset-number'
export * from './value-objects/gps-location'
export * from './value-objects/operating-hours'
export * from './value-objects/utilization-rate'

// Repositories
export * from './repositories/equipment-repository'
export * from './repositories/maintenance-repository'
export * from './repositories/geofence-repository'

// Types (from the old types.ts file)
export * from './types'

