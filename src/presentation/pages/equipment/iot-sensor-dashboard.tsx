import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Battery,
  Calendar,
  Check,
  ChevronDown,
  Droplet,
  Flame,
  Gauge,
  RefreshCw,
  Settings,
  TrendingUp,
  Wind,
  X,
  ArrowLeft,
} from 'lucide-react'
import './iot-sensor-dashboard.css'

// ============================================================================
// Types
// ============================================================================

type SensorType =
  | 'TEMPERATURE'
  | 'VIBRATION'
  | 'FUEL_LEVEL'
  | 'OIL_PRESSURE'
  | 'ENGINE_HOURS'
  | 'BATTERY_VOLTAGE'
  | 'HYDRAULIC_PRESSURE'
  | 'COOLANT_LEVEL'
  | 'TIRE_PRESSURE'
  | 'RPM'

type SeverityLevel = 'NORMAL' | 'WARNING' | 'CRITICAL'

type CalibrationStatus = 'CALIBRATED' | 'DUE_SOON' | 'OVERDUE'

interface SensorData {
  id: string
  equipmentId: string
  equipmentName: string
  sensorType: SensorType
  sensorId: string
  value: number
  unit: string
  timestamp: Date
  isAnomalous: boolean
  severityLevel: SeverityLevel
  thresholds: {
    min?: number
    max?: number
    warningMin?: number
    warningMax?: number
    criticalMin?: number
    criticalMax?: number
  }
  calibrationStatus: CalibrationStatus
  nextCalibrationDate?: Date
}

interface HistoricalReading {
  timestamp: Date
  value: number
  severityLevel: SeverityLevel
}

interface Alert {
  id: string
  sensorId: string
  equipmentName: string
  sensorType: SensorType
  message: string
  severityLevel: SeverityLevel
  timestamp: Date
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

// ============================================================================
// Helper Functions
// ============================================================================

function getSensorIcon(type: SensorType): React.ReactNode {
  switch (type) {
    case 'TEMPERATURE':
      return <Flame className="icon" />
    case 'VIBRATION':
      return <Activity className="icon" />
    case 'FUEL_LEVEL':
      return <Droplet className="icon" />
    case 'OIL_PRESSURE':
    case 'HYDRAULIC_PRESSURE':
    case 'TIRE_PRESSURE':
      return <Gauge className="icon" />
    case 'ENGINE_HOURS':
      return <Calendar className="icon" />
    case 'BATTERY_VOLTAGE':
      return <Battery className="icon" />
    case 'COOLANT_LEVEL':
      return <Wind className="icon" />
    case 'RPM':
      return <TrendingUp className="icon" />
    default:
      return <Settings className="icon" />
  }
}

function formatSensorType(type: SensorType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimeRangeMs(range: TimeRange): number {
  switch (range) {
    case '1h':
      return 60 * 60 * 1000
    case '6h':
      return 6 * 60 * 60 * 1000
    case '24h':
      return 24 * 60 * 60 * 1000
    case '7d':
      return 7 * 24 * 60 * 60 * 1000
    case '30d':
      return 30 * 24 * 60 * 60 * 1000
  }
}

// ============================================================================
// Mock Data Generation
// ============================================================================

function generateMockSensorData(): SensorData[] {
  const equipment = [
    { id: '1', name: 'CAT 320 Excavator #A45' },
    { id: '2', name: 'John Deere 644 Loader #B12' },
    { id: '3', name: 'Komatsu D65 Dozer #C78' },
    { id: '4', name: 'Volvo A40G Truck #D93' },
  ]

  const sensors: SensorData[] = []
  const now = new Date()

  equipment.forEach((eq) => {
    // Temperature
    const temp = 85 + Math.random() * 20
    sensors.push({
      id: `${eq.id}-temp`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      sensorType: 'TEMPERATURE',
      sensorId: `TEMP-${eq.id}`,
      value: temp,
      unit: '°C',
      timestamp: new Date(now.getTime() - Math.random() * 300000),
      isAnomalous: temp > 100,
      severityLevel: temp > 105 ? 'CRITICAL' : temp > 100 ? 'WARNING' : 'NORMAL',
      thresholds: {
        warningMax: 100,
        criticalMax: 105,
        min: 60,
        max: 110,
      },
      calibrationStatus: Math.random() > 0.7 ? 'DUE_SOON' : 'CALIBRATED',
      nextCalibrationDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    })

    // Vibration
    const vib = 0.5 + Math.random() * 1
    sensors.push({
      id: `${eq.id}-vib`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      sensorType: 'VIBRATION',
      sensorId: `VIB-${eq.id}`,
      value: vib,
      unit: 'mm/s',
      timestamp: new Date(now.getTime() - Math.random() * 300000),
      isAnomalous: vib > 1.2,
      severityLevel: vib > 1.5 ? 'CRITICAL' : vib > 1.2 ? 'WARNING' : 'NORMAL',
      thresholds: {
        warningMax: 1.2,
        criticalMax: 1.5,
        min: 0,
        max: 2,
      },
      calibrationStatus: 'CALIBRATED',
      nextCalibrationDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    })

    // Fuel Level
    const fuel = 20 + Math.random() * 60
    sensors.push({
      id: `${eq.id}-fuel`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      sensorType: 'FUEL_LEVEL',
      sensorId: `FUEL-${eq.id}`,
      value: fuel,
      unit: '%',
      timestamp: new Date(now.getTime() - Math.random() * 300000),
      isAnomalous: fuel < 20,
      severityLevel: fuel < 10 ? 'CRITICAL' : fuel < 20 ? 'WARNING' : 'NORMAL',
      thresholds: {
        warningMin: 20,
        criticalMin: 10,
        min: 0,
        max: 100,
      },
      calibrationStatus: 'CALIBRATED',
      nextCalibrationDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    })

    // Oil Pressure
    const oil = 35 + Math.random() * 20
    sensors.push({
      id: `${eq.id}-oil`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      sensorType: 'OIL_PRESSURE',
      sensorId: `OIL-${eq.id}`,
      value: oil,
      unit: 'PSI',
      timestamp: new Date(now.getTime() - Math.random() * 300000),
      isAnomalous: oil < 30 || oil > 60,
      severityLevel:
        oil < 25 || oil > 65 ? 'CRITICAL' : oil < 30 || oil > 60 ? 'WARNING' : 'NORMAL',
      thresholds: {
        warningMin: 30,
        warningMax: 60,
        criticalMin: 25,
        criticalMax: 65,
        min: 0,
        max: 80,
      },
      calibrationStatus: Math.random() > 0.8 ? 'OVERDUE' : 'CALIBRATED',
      nextCalibrationDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    })

    // Battery Voltage
    const battery = 12 + Math.random() * 2
    sensors.push({
      id: `${eq.id}-battery`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      sensorType: 'BATTERY_VOLTAGE',
      sensorId: `BAT-${eq.id}`,
      value: battery,
      unit: 'V',
      timestamp: new Date(now.getTime() - Math.random() * 300000),
      isAnomalous: battery < 12.4,
      severityLevel: battery < 12 ? 'CRITICAL' : battery < 12.4 ? 'WARNING' : 'NORMAL',
      thresholds: {
        warningMin: 12.4,
        criticalMin: 12,
        min: 11,
        max: 14.5,
      },
      calibrationStatus: 'CALIBRATED',
      nextCalibrationDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
    })
  })

  return sensors
}

function generateHistoricalData(
  sensor: SensorData,
  timeRange: TimeRange
): HistoricalReading[] {
  const readings: HistoricalReading[] = []
  const rangeMs = getTimeRangeMs(timeRange)
  const now = new Date()
  const startTime = now.getTime() - rangeMs

  // Generate 20-50 readings depending on time range
  const numReadings = timeRange === '1h' ? 20 : timeRange === '6h' ? 30 : 50
  const intervalMs = rangeMs / numReadings

  for (let i = 0; i < numReadings; i++) {
    const timestamp = new Date(startTime + i * intervalMs)
    const baseValue = sensor.value
    const variation = (sensor.thresholds.max || 100) * 0.1
    const value = baseValue + (Math.random() - 0.5) * variation

    // Determine severity based on thresholds
    let severityLevel: SeverityLevel = 'NORMAL'
    if (sensor.thresholds.criticalMin && value < sensor.thresholds.criticalMin)
      severityLevel = 'CRITICAL'
    else if (sensor.thresholds.criticalMax && value > sensor.thresholds.criticalMax)
      severityLevel = 'CRITICAL'
    else if (sensor.thresholds.warningMin && value < sensor.thresholds.warningMin)
      severityLevel = 'WARNING'
    else if (sensor.thresholds.warningMax && value > sensor.thresholds.warningMax)
      severityLevel = 'WARNING'

    readings.push({
      timestamp,
      value,
      severityLevel,
    })
  }

  return readings
}

function generateAlerts(sensors: SensorData[]): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()

  sensors
    .filter((s) => s.severityLevel !== 'NORMAL' || s.calibrationStatus !== 'CALIBRATED')
    .forEach((sensor, index) => {
      if (sensor.severityLevel !== 'NORMAL') {
        const messages = {
          CRITICAL: `Critical ${formatSensorType(sensor.sensorType).toLowerCase()} reading: ${sensor.value.toFixed(1)}${sensor.unit}`,
          WARNING: `${formatSensorType(sensor.sensorType)} reading outside normal range: ${sensor.value.toFixed(1)}${sensor.unit}`,
        }
        alerts.push({
          id: `alert-${sensor.id}-${index}`,
          sensorId: sensor.id,
          equipmentName: sensor.equipmentName,
          sensorType: sensor.sensorType,
          message: messages[sensor.severityLevel as 'CRITICAL' | 'WARNING'],
          severityLevel: sensor.severityLevel,
          timestamp: sensor.timestamp,
        })
      }

      if (sensor.calibrationStatus === 'OVERDUE') {
        alerts.push({
          id: `calib-${sensor.id}-overdue`,
          sensorId: sensor.id,
          equipmentName: sensor.equipmentName,
          sensorType: sensor.sensorType,
          message: `Calibration overdue for ${formatSensorType(sensor.sensorType).toLowerCase()}`,
          severityLevel: 'WARNING',
          timestamp: sensor.nextCalibrationDate || new Date(),
        })
      }
    })

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// ============================================================================
// Main Component
// ============================================================================

export function IoTSensorDashboard() {
  const navigate = useNavigate()
  const [sensors, setSensors] = useState<SensorData[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all')
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCalibrationPanel, setShowCalibrationPanel] = useState(false)

  // Load initial data
  useEffect(() => {
    loadSensorData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSensorData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSensorData = () => {
    // TODO: Replace with actual IoTSensorService call
    // const now = new Date()
    const mockData = generateMockSensorData()
    setSensors(mockData)
    setAlerts(generateAlerts(mockData))
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadSensorData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Filter sensors by selected equipment
  const filteredSensors = useMemo(() => {
    if (selectedEquipment === 'all') return sensors
    return sensors.filter((s) => s.equipmentId === selectedEquipment)
  }, [sensors, selectedEquipment])

  // Get unique equipment list
  const equipmentList = useMemo(() => {
    const unique = new Map<string, string>()
    sensors.forEach((s) => {
      unique.set(s.equipmentId, s.equipmentName)
    })
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }))
  }, [sensors])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: filteredSensors.length,
      active: filteredSensors.filter((s) => s.severityLevel === 'NORMAL').length,
      warning: filteredSensors.filter((s) => s.severityLevel === 'WARNING').length,
      critical: filteredSensors.filter((s) => s.severityLevel === 'CRITICAL').length,
      needsCalibration: filteredSensors.filter((s) => s.calibrationStatus !== 'CALIBRATED')
        .length,
    }
  }, [filteredSensors])

  // Historical data for selected sensor
  const historicalData = useMemo(() => {
    if (!selectedSensor) return []
    return generateHistoricalData(selectedSensor, timeRange)
  }, [selectedSensor, timeRange])

  return (
    <div className="iot-sensor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/equipment')}
            title="Back to Equipment"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>IoT Sensor Monitoring</h1>
            <p className="subtitle">Real-time equipment sensor data and alerts</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`icon ${isRefreshing ? 'spinning' : ''}`} />
            Refresh
          </button>
          <button
            className="btn-calibration"
            onClick={() => setShowCalibrationPanel(!showCalibrationPanel)}
          >
            <Calendar className="icon" />
            Calibration Schedule
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-primary">
            <Settings className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Sensors</p>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-success">
            <Check className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Normal</p>
            <p className="stat-value">{stats.active}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-warning">
            <AlertTriangle className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Warnings</p>
            <p className="stat-value">{stats.warning}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-danger">
            <X className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Critical</p>
            <p className="stat-value">{stats.critical}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-info">
            <Calendar className="icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Needs Calibration</p>
            <p className="stat-value">{stats.needsCalibration}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="equipment-filter">Equipment</label>
          <div className="select-wrapper">
            <select
              id="equipment-filter"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="all">All Equipment</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </div>

        <div className="filter-group">
          <label>Time Range</label>
          <div className="time-range-buttons">
            {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                className={`time-button ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Sensor Cards */}
        <div className="sensor-grid">
          {filteredSensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`sensor-card severity-${sensor.severityLevel.toLowerCase()}`}
              onClick={() => setSelectedSensor(sensor)}
            >
              <div className="sensor-header">
                <div className="sensor-icon-wrapper">{getSensorIcon(sensor.sensorType)}</div>
                <div className="sensor-meta">
                  <h3>{formatSensorType(sensor.sensorType)}</h3>
                  <p className="equipment-name">{sensor.equipmentName}</p>
                </div>
                {sensor.isAnomalous && (
                  <AlertTriangle className="anomaly-icon" />
                )}
              </div>

              <div className="sensor-value">
                <span className="value">{sensor.value.toFixed(1)}</span>
                <span className="unit">{sensor.unit}</span>
              </div>

              <div className="sensor-footer">
                <div className="sensor-status">
                  <span className={`status-badge status-${sensor.severityLevel.toLowerCase()}`}>
                    {sensor.severityLevel}
                  </span>
                  {sensor.calibrationStatus !== 'CALIBRATED' && (
                    <span className={`calibration-badge calibration-${sensor.calibrationStatus.toLowerCase()}`}>
                      {sensor.calibrationStatus === 'DUE_SOON' ? 'Cal Due Soon' : 'Cal Overdue'}
                    </span>
                  )}
                </div>
                <p className="timestamp">{formatRelativeTime(sensor.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts Panel */}
        <div className="alerts-panel">
          <div className="panel-header">
            <h2>Active Alerts</h2>
            <span className="alert-count">{alerts.length}</span>
          </div>

          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="empty-state">
                <Check className="empty-icon" />
                <p>No active alerts</p>
                <span>All sensors operating normally</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item severity-${alert.severityLevel.toLowerCase()}`}
                >
                  <div className="alert-icon">
                    {alert.severityLevel === 'CRITICAL' ? (
                      <X className="icon" />
                    ) : (
                      <AlertTriangle className="icon" />
                    )}
                  </div>
                  <div className="alert-content">
                    <p className="alert-equipment">{alert.equipmentName}</p>
                    <p className="alert-message">{alert.message}</p>
                    <p className="alert-timestamp">{formatRelativeTime(alert.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sensor Detail Sidebar */}
      {selectedSensor && (
        <div className="sensor-detail-sidebar">
          <div className="sidebar-overlay" onClick={() => setSelectedSensor(null)} />
          <div className="sidebar-content">
            <div className="sidebar-header">
              <div>
                <h2>{formatSensorType(selectedSensor.sensorType)}</h2>
                <p className="equipment-name">{selectedSensor.equipmentName}</p>
              </div>
              <button className="close-button" onClick={() => setSelectedSensor(null)}>
                <X className="icon" />
              </button>
            </div>

            <div className="sidebar-body">
              {/* Current Reading */}
              <div className="detail-section">
                <h3>Current Reading</h3>
                <div className="current-reading">
                  <div className="reading-value">
                    <span className="value">{selectedSensor.value.toFixed(2)}</span>
                    <span className="unit">{selectedSensor.unit}</span>
                  </div>
                  <div className="reading-meta">
                    <span className={`status-badge status-${selectedSensor.severityLevel.toLowerCase()}`}>
                      {selectedSensor.severityLevel}
                    </span>
                    <span className="timestamp">
                      {formatDateTime(selectedSensor.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thresholds */}
              <div className="detail-section">
                <h3>Thresholds</h3>
                <div className="thresholds">
                  {selectedSensor.thresholds.criticalMin !== undefined && (
                    <div className="threshold-item">
                      <span className="threshold-label">Critical Min</span>
                      <span className="threshold-value">
                        {selectedSensor.thresholds.criticalMin} {selectedSensor.unit}
                      </span>
                    </div>
                  )}
                  {selectedSensor.thresholds.warningMin !== undefined && (
                    <div className="threshold-item">
                      <span className="threshold-label">Warning Min</span>
                      <span className="threshold-value">
                        {selectedSensor.thresholds.warningMin} {selectedSensor.unit}
                      </span>
                    </div>
                  )}
                  {selectedSensor.thresholds.warningMax !== undefined && (
                    <div className="threshold-item">
                      <span className="threshold-label">Warning Max</span>
                      <span className="threshold-value">
                        {selectedSensor.thresholds.warningMax} {selectedSensor.unit}
                      </span>
                    </div>
                  )}
                  {selectedSensor.thresholds.criticalMax !== undefined && (
                    <div className="threshold-item">
                      <span className="threshold-label">Critical Max</span>
                      <span className="threshold-value">
                        {selectedSensor.thresholds.criticalMax} {selectedSensor.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historical Trend */}
              <div className="detail-section">
                <h3>Historical Trend</h3>
                <div className="trend-chart">
                  <svg width="100%" height="200" viewBox="0 0 400 200">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={`grid-${i}`}
                        x1="0"
                        y1={i * 50}
                        x2="400"
                        y2={i * 50}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Threshold zones */}
                    {selectedSensor.thresholds.warningMax && (
                      <>
                        {/* Warning zone */}
                        <rect
                          x="0"
                          y={
                            ((selectedSensor.thresholds.max! - selectedSensor.thresholds.warningMax) /
                              selectedSensor.thresholds.max!) *
                            200
                          }
                          width="400"
                          height={
                            ((selectedSensor.thresholds.warningMax -
                              (selectedSensor.thresholds.criticalMax || selectedSensor.thresholds.warningMax)) /
                              selectedSensor.thresholds.max!) *
                            200
                          }
                          fill="#fbbf24"
                          opacity="0.1"
                        />
                        {/* Critical zone */}
                        {selectedSensor.thresholds.criticalMax && (
                          <rect
                            x="0"
                            y="0"
                            width="400"
                            height={
                              ((selectedSensor.thresholds.max! - selectedSensor.thresholds.criticalMax) /
                                selectedSensor.thresholds.max!) *
                              200
                            }
                            fill="#ef4444"
                            opacity="0.1"
                          />
                        )}
                      </>
                    )}

                    {/* Data line */}
                    <polyline
                      points={historicalData
                        .map((reading, index) => {
                          const x = (index / (historicalData.length - 1)) * 400
                          const y =
                            200 -
                            (reading.value / (selectedSensor.thresholds.max || 100)) * 200
                          return `${x},${y}`
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />

                    {/* Data points */}
                    {historicalData.map((reading, index) => {
                      const x = (index / (historicalData.length - 1)) * 400
                      const y =
                        200 - (reading.value / (selectedSensor.thresholds.max || 100)) * 200
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="3"
                          fill={
                            reading.severityLevel === 'CRITICAL'
                              ? '#ef4444'
                              : reading.severityLevel === 'WARNING'
                                ? '#fbbf24'
                                : '#3b82f6'
                          }
                        />
                      )
                    })}
                  </svg>

                  {/* Y-axis labels */}
                  <div className="y-axis-labels">
                    <span>{(selectedSensor.thresholds.max || 100).toFixed(0)}</span>
                    <span>{((selectedSensor.thresholds.max || 100) * 0.75).toFixed(0)}</span>
                    <span>{((selectedSensor.thresholds.max || 100) * 0.5).toFixed(0)}</span>
                    <span>{((selectedSensor.thresholds.max || 100) * 0.25).toFixed(0)}</span>
                    <span>0</span>
                  </div>
                </div>
              </div>

              {/* Calibration Info */}
              <div className="detail-section">
                <h3>Calibration</h3>
                <div className="calibration-info">
                  <div className="calibration-status">
                    <span className={`status-badge status-${selectedSensor.calibrationStatus.toLowerCase()}`}>
                      {selectedSensor.calibrationStatus.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedSensor.nextCalibrationDate && (
                    <div className="calibration-date">
                      <span className="label">Next Calibration:</span>
                      <span className="date">
                        {selectedSensor.nextCalibrationDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sensor Info */}
              <div className="detail-section">
                <h3>Sensor Information</h3>
                <div className="sensor-info">
                  <div className="info-item">
                    <span className="label">Sensor ID:</span>
                    <span className="value">{selectedSensor.sensorId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Equipment ID:</span>
                    <span className="value">{selectedSensor.equipmentId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Type:</span>
                    <span className="value">{formatSensorType(selectedSensor.sensorType)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Schedule Panel */}
      {showCalibrationPanel && (
        <div className="calibration-panel">
          <div className="panel-overlay" onClick={() => setShowCalibrationPanel(false)} />
          <div className="panel-content">
            <div className="panel-header">
              <h2>Calibration Schedule</h2>
              <button className="close-button" onClick={() => setShowCalibrationPanel(false)}>
                <X className="icon" />
              </button>
            </div>

            <div className="panel-body">
              <div className="calibration-list">
                {filteredSensors
                  .filter((s) => s.nextCalibrationDate)
                  .sort((a, b) => a.nextCalibrationDate!.getTime() - b.nextCalibrationDate!.getTime())
                  .map((sensor) => (
                    <div key={sensor.id} className="calibration-item">
                      <div className="calibration-icon-wrapper">
                        {getSensorIcon(sensor.sensorType)}
                      </div>
                      <div className="calibration-details">
                        <p className="sensor-type">{formatSensorType(sensor.sensorType)}</p>
                        <p className="equipment-name">{sensor.equipmentName}</p>
                        <p className="calibration-date">
                          Due: {sensor.nextCalibrationDate!.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={`status-badge status-${sensor.calibrationStatus.toLowerCase()}`}>
                        {sensor.calibrationStatus.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
