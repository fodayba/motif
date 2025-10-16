export const SENSOR_TYPES = [
  'TEMPERATURE',
  'VIBRATION',
  'FUEL_LEVEL',
  'OIL_PRESSURE',
  'ENGINE_HOURS',
  'BATTERY_VOLTAGE',
  'HYDRAULIC_PRESSURE',
  'COOLANT_LEVEL',
  'TIRE_PRESSURE',
  'RPM',
] as const

export type SensorType = (typeof SENSOR_TYPES)[number]
