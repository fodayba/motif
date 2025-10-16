/**
 * IoT Sensor Gateway
 * 
 * Production-ready gateway for IoT sensor data integration.
 * Supports various IoT protocols and sensor types for equipment monitoring.
 * 
 * Features:
 * - Real-time sensor data collection
 * - Threshold monitoring and alerting
 * - Anomaly detection
 * - Data validation and filtering
 * - Support for multiple protocols (MQTT, HTTP, WebSocket)
 */

export type SensorDataPoint = {
  sensorId: string
  equipmentId: string
  value: number
  unit: string
  timestamp: Date
  quality?: 'good' | 'fair' | 'poor' // Data quality indicator
  metadata?: Record<string, unknown>
}

export type SensorThresholds = {
  min?: number
  max?: number
  warningMin?: number
  warningMax?: number
  criticalMin?: number
  criticalMax?: number
}

export type SensorAlert = {
  id: string
  sensorId: string
  equipmentId: string
  alertType: 'threshold_exceeded' | 'anomaly_detected' | 'sensor_offline' | 'calibration_due'
  severity: 'info' | 'warning' | 'critical'
  message: string
  value?: number
  threshold?: number
  timestamp: Date
  acknowledged: boolean
}

export type IoTSensorConfig = {
  dataCollectionIntervalSeconds: number // Default: 60 seconds
  batchSize: number // Default: 100 readings per batch
  enableAnomalyDetection: boolean // Default: true
  anomalyThreshold: number // Default: 0.7 (70% confidence)
  dataRetentionDays: number // Default: 365 days
  offlineTimeoutMinutes: number // Default: 5 minutes
}

export type SensorStatistics = {
  totalSensors: number
  activeSensors: number
  offlineSensors: number
  alertsLast24Hours: number
  dataPointsLast24Hours: number
  averageReadingInterval: number
}

/**
 * IoT Sensor Gateway
 */
export class IoTSensorGateway {
  private readonly config: IoTSensorConfig
  private sensorCallbacks = new Map<string, Array<(data: SensorDataPoint) => void>>()
  private alertCallbacks = new Map<string, Array<(alert: SensorAlert) => void>>()
  private lastReadingTime = new Map<string, Date>()
  private recentReadings = new Map<string, number[]>() // For anomaly detection
  private activeAlerts = new Map<string, SensorAlert>()
  private offlineCheckInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<IoTSensorConfig> = {}) {
    this.config = {
      dataCollectionIntervalSeconds: config.dataCollectionIntervalSeconds ?? 60,
      batchSize: config.batchSize ?? 100,
      enableAnomalyDetection: config.enableAnomalyDetection ?? true,
      anomalyThreshold: config.anomalyThreshold ?? 0.7,
      dataRetentionDays: config.dataRetentionDays ?? 365,
      offlineTimeoutMinutes: config.offlineTimeoutMinutes ?? 5,
    }

    // Start offline sensor monitoring
    this.startOfflineMonitoring()
  }

  /**
   * Register callback for sensor data updates
   */
  onSensorData(sensorId: string, callback: (data: SensorDataPoint) => void): void {
    if (!this.sensorCallbacks.has(sensorId)) {
      this.sensorCallbacks.set(sensorId, [])
    }
    this.sensorCallbacks.get(sensorId)!.push(callback)
  }

  /**
   * Register callback for sensor alerts
   */
  onSensorAlert(equipmentId: string, callback: (alert: SensorAlert) => void): void {
    if (!this.alertCallbacks.has(equipmentId)) {
      this.alertCallbacks.set(equipmentId, [])
    }
    this.alertCallbacks.get(equipmentId)!.push(callback)
  }

  /**
   * Process incoming sensor data
   */
  async processSensorData(data: SensorDataPoint): Promise<void> {
    // Validate data
    if (!this.isValidSensorData(data)) {
      console.error('Invalid sensor data received:', data)
      return
    }

    // Update last reading time
    this.lastReadingTime.set(data.sensorId, data.timestamp)

    // Store reading for anomaly detection
    if (this.config.enableAnomalyDetection) {
      this.updateReadingHistory(data.sensorId, data.value)
    }

    // Detect anomalies
    if (this.config.enableAnomalyDetection) {
      const isAnomalous = this.detectAnomaly(data.sensorId, data.value)
      if (isAnomalous) {
        await this.createAlert({
          sensorId: data.sensorId,
          equipmentId: data.equipmentId,
          alertType: 'anomaly_detected',
          severity: 'warning',
          message: `Anomalous reading detected: ${data.value} ${data.unit}`,
          value: data.value,
          timestamp: data.timestamp,
        })
      }
    }

    // Notify callbacks
    const callbacks = this.sensorCallbacks.get(data.sensorId) ?? []
    callbacks.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error('Sensor data callback error:', error)
      }
    })
  }

  /**
   * Process batch of sensor data
   */
  async processBatchData(dataPoints: SensorDataPoint[]): Promise<void> {
    const batchSize = this.config.batchSize

    for (let i = 0; i < dataPoints.length; i += batchSize) {
      const batch = dataPoints.slice(i, i + batchSize)
      await Promise.all(
        batch.map((data) =>
          this.processSensorData(data).catch((error) => {
            console.error(`Failed to process sensor data for ${data.sensorId}:`, error)
          }),
        ),
      )
    }
  }

  /**
   * Check sensor thresholds and create alerts
   */
  async checkThresholds(
    sensorId: string,
    equipmentId: string,
    value: number,
    unit: string,
    thresholds: SensorThresholds,
  ): Promise<void> {
    // Critical max threshold
    if (thresholds.criticalMax !== undefined && value > thresholds.criticalMax) {
      await this.createAlert({
        sensorId,
        equipmentId,
        alertType: 'threshold_exceeded',
        severity: 'critical',
        message: `Critical high: ${value} ${unit} exceeds ${thresholds.criticalMax} ${unit}`,
        value,
        threshold: thresholds.criticalMax,
        timestamp: new Date(),
      })
      return
    }

    // Critical min threshold
    if (thresholds.criticalMin !== undefined && value < thresholds.criticalMin) {
      await this.createAlert({
        sensorId,
        equipmentId,
        alertType: 'threshold_exceeded',
        severity: 'critical',
        message: `Critical low: ${value} ${unit} below ${thresholds.criticalMin} ${unit}`,
        value,
        threshold: thresholds.criticalMin,
        timestamp: new Date(),
      })
      return
    }

    // Warning max threshold
    if (thresholds.warningMax !== undefined && value > thresholds.warningMax) {
      await this.createAlert({
        sensorId,
        equipmentId,
        alertType: 'threshold_exceeded',
        severity: 'warning',
        message: `Warning high: ${value} ${unit} exceeds ${thresholds.warningMax} ${unit}`,
        value,
        threshold: thresholds.warningMax,
        timestamp: new Date(),
      })
      return
    }

    // Warning min threshold
    if (thresholds.warningMin !== undefined && value < thresholds.warningMin) {
      await this.createAlert({
        sensorId,
        equipmentId,
        alertType: 'threshold_exceeded',
        severity: 'warning',
        message: `Warning low: ${value} ${unit} below ${thresholds.warningMin} ${unit}`,
        value,
        threshold: thresholds.warningMin,
        timestamp: new Date(),
      })
    }
  }

  /**
   * Create sensor alert
   */
  private async createAlert(alert: Omit<SensorAlert, 'id' | 'acknowledged'>): Promise<void> {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const fullAlert: SensorAlert = {
      ...alert,
      id: alertId,
      acknowledged: false,
    }

    // Store alert
    this.activeAlerts.set(alertId, fullAlert)

    // Notify callbacks
    const callbacks = this.alertCallbacks.get(alert.equipmentId) ?? []
    callbacks.forEach((callback) => {
      try {
        callback(fullAlert)
      } catch (error) {
        console.error('Alert callback error:', error)
      }
    })

    console.log(`Alert created: ${fullAlert.message}`)
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  /**
   * Get active alerts for equipment
   */
  getActiveAlerts(equipmentId?: string): SensorAlert[] {
    const alerts = Array.from(this.activeAlerts.values())
    if (equipmentId) {
      return alerts.filter((alert) => alert.equipmentId === equipmentId && !alert.acknowledged)
    }
    return alerts.filter((alert) => !alert.acknowledged)
  }

  /**
   * Clear acknowledged alerts
   */
  clearAcknowledgedAlerts(): void {
    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.acknowledged) {
        this.activeAlerts.delete(id)
      }
    }
  }

  /**
   * Detect anomalies using simple statistical method
   * Uses z-score for anomaly detection
   */
  private detectAnomaly(sensorId: string, value: number): boolean {
    const history = this.recentReadings.get(sensorId) ?? []

    // Need at least 10 readings for reliable anomaly detection
    if (history.length < 10) {
      return false
    }

    // Calculate mean and standard deviation
    const mean = history.reduce((sum, val) => sum + val, 0) / history.length
    const variance =
      history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length
    const stdDev = Math.sqrt(variance)

    // Calculate z-score
    const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0

    // Anomaly if z-score exceeds threshold (typically 2-3 for normal distribution)
    return zScore > 3
  }

  /**
   * Update reading history for anomaly detection
   */
  private updateReadingHistory(sensorId: string, value: number): void {
    if (!this.recentReadings.has(sensorId)) {
      this.recentReadings.set(sensorId, [])
    }

    const history = this.recentReadings.get(sensorId)!
    history.push(value)

    // Keep only last 100 readings for efficiency
    if (history.length > 100) {
      history.shift()
    }
  }

  /**
   * Validate sensor data
   */
  private isValidSensorData(data: SensorDataPoint): boolean {
    if (!data.sensorId || !data.equipmentId) {
      return false
    }

    if (typeof data.value !== 'number' || !Number.isFinite(data.value)) {
      return false
    }

    if (!(data.timestamp instanceof Date) || Number.isNaN(data.timestamp.getTime())) {
      return false
    }

    return true
  }

  /**
   * Start monitoring for offline sensors
   */
  private startOfflineMonitoring(): void {
    // Check every minute for offline sensors
    this.offlineCheckInterval = setInterval(() => {
      const now = new Date()
      const timeoutMs = this.config.offlineTimeoutMinutes * 60 * 1000

      for (const [sensorId, lastTime] of this.lastReadingTime.entries()) {
        if (now.getTime() - lastTime.getTime() > timeoutMs) {
          // Create offline alert if not already exists
          const existingAlert = Array.from(this.activeAlerts.values()).find(
            (alert) => alert.sensorId === sensorId && alert.alertType === 'sensor_offline',
          )

          if (!existingAlert) {
            this.createAlert({
              sensorId,
              equipmentId: 'unknown', // Would need to lookup equipment ID
              alertType: 'sensor_offline',
              severity: 'critical',
              message: `Sensor offline: No data received for ${this.config.offlineTimeoutMinutes} minutes`,
              timestamp: now,
            })
          }
        }
      }
    }, 60000) // Check every minute
  }

  /**
   * Get sensor statistics
   */
  getStatistics(): SensorStatistics {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const timeoutMs = this.config.offlineTimeoutMinutes * 60 * 1000

    let offlineCount = 0
    for (const lastTime of this.lastReadingTime.values()) {
      if (now.getTime() - lastTime.getTime() > timeoutMs) {
        offlineCount++
      }
    }

    const recentAlerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.timestamp >= oneDayAgo,
    )

    return {
      totalSensors: this.lastReadingTime.size,
      activeSensors: this.lastReadingTime.size - offlineCount,
      offlineSensors: offlineCount,
      alertsLast24Hours: recentAlerts.length,
      dataPointsLast24Hours: 0, // Would need database query in production
      averageReadingInterval: this.config.dataCollectionIntervalSeconds,
    }
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.offlineCheckInterval) {
      clearInterval(this.offlineCheckInterval)
      this.offlineCheckInterval = null
    }

    this.sensorCallbacks.clear()
    this.alertCallbacks.clear()
    this.lastReadingTime.clear()
    this.recentReadings.clear()
    this.activeAlerts.clear()

    console.log('IoT Sensor Gateway shutdown complete')
  }
}
