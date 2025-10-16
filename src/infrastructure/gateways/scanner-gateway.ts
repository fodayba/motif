/**
 * Scanner Gateway Configuration
 */
export interface ScannerGatewayConfig {
  /** Enable continuous scanning mode (mobile camera stays active) */
  enableContinuousScanning: boolean
  /** Vibrate on successful scan (mobile devices) */
  enableHapticFeedback: boolean
  /** Play sound on successful scan */
  enableAudioFeedback: boolean
  /** Cache scanned equipment data for offline mode (in minutes) */
  offlineCacheDuration: number
  /** Batch scan limit before requiring sync */
  batchScanLimit: number
  /** Enable RFID scanning (if hardware is available) */
  enableRFIDScanning: boolean
  /** RFID scan timeout in milliseconds */
  rfidScanTimeout: number
  /** Barcode format support (QR, CODE128, etc.) */
  supportedFormats: string[]
  /** Enable duplicate scan prevention (time window in seconds) */
  duplicateScanPreventionWindow: number
}

/**
 * Scanner Types
 */
export type ScannerType = 'QR' | 'BARCODE' | 'RFID'

/**
 * Scan Result Status
 */
export type ScanStatus = 'success' | 'invalid' | 'not_found' | 'duplicate' | 'offline_cached'

/**
 * Equipment Scan Data Structure
 */
export interface EquipmentScanData {
  /** Equipment unique identifier */
  equipmentId: string
  /** Equipment name */
  equipmentName: string
  /** Equipment asset number/code */
  assetNumber: string
  /** Equipment status */
  status: string
  /** Current project assignment */
  currentProjectId?: string
  currentProjectName?: string
  /** Current site location */
  currentSiteId?: string
  currentSiteName?: string
  /** Last known location */
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: Date
  }
  /** Operator information */
  currentOperatorId?: string
  currentOperatorName?: string
  /** Metadata */
  metadata?: Record<string, any>
}

/**
 * Scan Result
 */
export interface ScanResult {
  /** Unique scan ID */
  scanId: string
  /** Scanned code/tag */
  code: string
  /** Scanner type used */
  scannerType: ScannerType
  /** Scan timestamp */
  timestamp: Date
  /** Scan status */
  status: ScanStatus
  /** Equipment data (if found) */
  equipmentData?: EquipmentScanData
  /** Error message (if any) */
  errorMessage?: string
  /** User who performed the scan */
  scannedBy?: string
  /** Location where scan occurred */
  scanLocation?: {
    latitude: number
    longitude: number
  }
}

/**
 * Check-In/Check-Out Scan Data
 */
export interface CheckInOutScanData {
  scanId: string
  equipmentId: string
  operatorUserId: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: Date
  location: {
    latitude: number
    longitude: number
    accuracy?: number
  }
  digitalSignature: string
  projectId?: string
  siteId?: string
  operatorCertifications?: string[]
  equipmentCondition?: string
  meterReading?: number
  fuelLevel?: number
  damageReported: boolean
  damageDescription?: string
  photos?: string[]
  notes?: string
}

/**
 * Batch Scan Operation
 */
export interface BatchScanOperation {
  operationId: string
  scans: ScanResult[]
  startTime: Date
  endTime?: Date
  totalScans: number
  successfulScans: number
  failedScans: number
  status: 'in_progress' | 'completed' | 'syncing' | 'synced'
}

/**
 * Scanner Statistics
 */
export interface ScannerStatistics {
  totalScans: number
  successfulScans: number
  failedScans: number
  qrScans: number
  barcodeScans: number
  rfidScans: number
  offlineScans: number
  averageScanTime: number
  lastScanTime?: Date
  activeScanners: number
}

/**
 * Scanner Health Status
 */
export interface ScannerHealth {
  cameraAvailable: boolean
  rfidReaderAvailable: boolean
  offlineModeActive: boolean
  pendingSyncCount: number
  lastSync?: Date
  batteryLevel?: number
  storageAvailable: boolean
}

/**
 * QR/RFID Scanner Gateway
 * 
 * Provides equipment identification and scanning capabilities using QR codes,
 * barcodes, and RFID tags. Supports both online and offline operation with
 * batch synchronization.
 * 
 * @example
 * ```typescript
 * const gateway = new ScannerGateway({
 *   enableContinuousScanning: true,
 *   enableHapticFeedback: true,
 *   offlineCacheDuration: 60,
 *   batchScanLimit: 50
 * })
 * 
 * // Scan QR code
 * const result = await gateway.scanQRCode('QR_CODE_123456')
 * if (result.status === 'success') {
 *   console.log('Equipment:', result.equipmentData?.equipmentName)
 * }
 * 
 * // Perform check-out
 * await gateway.performCheckOut({
 *   equipmentId: 'equip-123',
 *   operatorUserId: 'user-456',
 *   digitalSignature: 'base64signature',
 *   location: { latitude: 40.7128, longitude: -74.0060 }
 * })
 * ```
 */
export class ScannerGateway {
  private config: ScannerGatewayConfig
  private scanHistory: Map<string, ScanResult[]> = new Map()
  private offlineCache: Map<string, EquipmentScanData> = new Map()
  private batchOperations: Map<string, BatchScanOperation> = new Map()
  private recentScans: Map<string, Date> = new Map() // For duplicate prevention
  private scanCallbacks: Array<(result: ScanResult) => void> = []
  private checkInOutCallbacks: Array<(data: CheckInOutScanData) => void> = []
  private cameraActive = false
  private rfidReaderActive = false
  private offlineMode = false

  // Statistics
  private stats = {
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    qrScans: 0,
    barcodeScans: 0,
    rfidScans: 0,
    offlineScans: 0,
    scanTimes: [] as number[],
  }

  constructor(config: Partial<ScannerGatewayConfig> = {}) {
    this.config = {
      enableContinuousScanning: config.enableContinuousScanning ?? false,
      enableHapticFeedback: config.enableHapticFeedback ?? true,
      enableAudioFeedback: config.enableAudioFeedback ?? true,
      offlineCacheDuration: config.offlineCacheDuration ?? 60,
      batchScanLimit: config.batchScanLimit ?? 50,
      enableRFIDScanning: config.enableRFIDScanning ?? false,
      rfidScanTimeout: config.rfidScanTimeout ?? 3000,
      supportedFormats: config.supportedFormats ?? ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13'],
      duplicateScanPreventionWindow: config.duplicateScanPreventionWindow ?? 5,
    }

    // Start offline cache cleanup
    this.startCacheCleanup()
  }

  /**
   * Register callback for scan events
   */
  public onScanComplete(callback: (result: ScanResult) => void): void {
    this.scanCallbacks.push(callback)
  }

  /**
   * Register callback for check-in/out events
   */
  public onCheckInOut(callback: (data: CheckInOutScanData) => void): void {
    this.checkInOutCallbacks.push(callback)
  }

  /**
   * Scan QR code
   */
  public async scanQRCode(code: string, scannedBy?: string): Promise<ScanResult> {
    return this.performScan(code, 'QR', scannedBy)
  }

  /**
   * Scan barcode
   */
  public async scanBarcode(code: string, scannedBy?: string): Promise<ScanResult> {
    return this.performScan(code, 'BARCODE', scannedBy)
  }

  /**
   * Scan RFID tag
   */
  public async scanRFID(tagId: string, scannedBy?: string): Promise<ScanResult> {
    if (!this.config.enableRFIDScanning) {
      throw new Error('RFID scanning is not enabled')
    }
    return this.performScan(tagId, 'RFID', scannedBy)
  }

  /**
   * Perform scan operation (internal)
   */
  private async performScan(
    code: string,
    scannerType: ScannerType,
    scannedBy?: string,
  ): Promise<ScanResult> {
    const startTime = Date.now()

    // Check for duplicate scan
    if (this.isDuplicateScan(code)) {
      const result: ScanResult = {
        scanId: this.generateScanId(),
        code,
        scannerType,
        timestamp: new Date(),
        status: 'duplicate',
        errorMessage: 'Duplicate scan detected within prevention window',
      }
      return result
    }

    // Update statistics
    this.stats.totalScans++
    if (scannerType === 'QR') this.stats.qrScans++
    else if (scannerType === 'BARCODE') this.stats.barcodeScans++
    else if (scannerType === 'RFID') this.stats.rfidScans++

    // Check offline cache first
    let equipmentData = this.offlineCache.get(code)
    let status: ScanStatus = 'success'

    if (!equipmentData && !this.offlineMode) {
      // In production, this would fetch from database/API
      // For now, simulate equipment lookup
      equipmentData = await this.lookupEquipment(code)
      
      if (equipmentData) {
        // Cache for offline use
        this.offlineCache.set(code, equipmentData)
      } else {
        status = 'not_found'
      }
    } else if (!equipmentData && this.offlineMode) {
      status = 'offline_cached'
      this.stats.offlineScans++
    }

    if (status === 'success') {
      this.stats.successfulScans++
    } else {
      this.stats.failedScans++
    }

    // Record scan time
    const scanTime = Date.now() - startTime
    this.stats.scanTimes.push(scanTime)
    if (this.stats.scanTimes.length > 100) {
      this.stats.scanTimes.shift()
    }

    // Mark as recent scan
    this.recentScans.set(code, new Date())

    // Provide feedback
    if (status === 'success' && this.config.enableHapticFeedback) {
      this.triggerHapticFeedback()
    }
    if (status === 'success' && this.config.enableAudioFeedback) {
      this.playAudioFeedback('success')
    }

    const result: ScanResult = {
      scanId: this.generateScanId(),
      code,
      scannerType,
      timestamp: new Date(),
      status,
      equipmentData,
      scannedBy,
      errorMessage: status === 'not_found' ? 'Equipment not found' : undefined,
    }

    // Add to history
    const userHistory = this.scanHistory.get(scannedBy ?? 'anonymous') ?? []
    userHistory.push(result)
    this.scanHistory.set(scannedBy ?? 'anonymous', userHistory)

    // Notify callbacks
    this.scanCallbacks.forEach((callback) => callback(result))

    return result
  }

  /**
   * Lookup equipment by code (to be integrated with equipment repository)
   */
  private async lookupEquipment(_code: string): Promise<EquipmentScanData | undefined> {
    // In production, this would query the equipment repository
    // For now, return undefined to simulate not found
    // Integration point: EquipmentRepository.findByQRCode() or findByRFID()
    return undefined
  }

  /**
   * Perform equipment check-out with scan
   */
  public async performCheckOut(data: Omit<CheckInOutScanData, 'scanId' | 'type'>): Promise<string> {
    const scanId = this.generateScanId()
    const checkOutData: CheckInOutScanData = {
      ...data,
      scanId,
      type: 'CHECK_OUT',
    }

    // Notify callbacks
    this.checkInOutCallbacks.forEach((callback) => callback(checkOutData))

    // In production, persist to CheckInOut repository
    // Integration point: CheckInOutRepository.save()

    return scanId
  }

  /**
   * Perform equipment check-in with scan
   */
  public async performCheckIn(data: Omit<CheckInOutScanData, 'scanId' | 'type'>): Promise<string> {
    const scanId = this.generateScanId()
    const checkInData: CheckInOutScanData = {
      ...data,
      scanId,
      type: 'CHECK_IN',
    }

    // Notify callbacks
    this.checkInOutCallbacks.forEach((callback) => callback(checkInData))

    // In production, persist to CheckInOut repository
    // Integration point: CheckInOutRepository.save()

    return scanId
  }

  /**
   * Start batch scan operation
   */
  public startBatchScan(): string {
    const operationId = this.generateOperationId()
    const operation: BatchScanOperation = {
      operationId,
      scans: [],
      startTime: new Date(),
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
      status: 'in_progress',
    }
    this.batchOperations.set(operationId, operation)
    return operationId
  }

  /**
   * Add scan to batch operation
   */
  public async addToBatch(operationId: string, code: string, scannerType: ScannerType): Promise<void> {
    const operation = this.batchOperations.get(operationId)
    if (!operation) {
      throw new Error(`Batch operation ${operationId} not found`)
    }

    if (operation.status !== 'in_progress') {
      throw new Error(`Batch operation ${operationId} is not in progress`)
    }

    const result = await this.performScan(code, scannerType)
    operation.scans.push(result)
    operation.totalScans++
    
    if (result.status === 'success') {
      operation.successfulScans++
    } else {
      operation.failedScans++
    }

    // Check if batch limit reached
    if (operation.totalScans >= this.config.batchScanLimit) {
      await this.completeBatchScan(operationId)
    }
  }

  /**
   * Complete batch scan operation
   */
  public async completeBatchScan(operationId: string): Promise<BatchScanOperation> {
    const operation = this.batchOperations.get(operationId)
    if (!operation) {
      throw new Error(`Batch operation ${operationId} not found`)
    }

    operation.endTime = new Date()
    operation.status = 'completed'

    // If offline, mark for sync
    if (this.offlineMode) {
      operation.status = 'syncing'
    }

    return operation
  }

  /**
   * Get batch operation status
   */
  public getBatchOperation(operationId: string): BatchScanOperation | undefined {
    return this.batchOperations.get(operationId)
  }

  /**
   * Sync offline scans
   */
  public async syncOfflineScans(): Promise<{ synced: number; failed: number }> {
    let synced = 0
    let failed = 0

    // Sync pending batch operations
    for (const [operationId, operation] of this.batchOperations.entries()) {
      if (operation.status === 'syncing') {
        try {
          // In production, sync to backend
          // Integration point: Backend API sync endpoint
          operation.status = 'synced'
          synced += operation.totalScans
        } catch (error) {
          failed += operation.totalScans
          console.error(`Failed to sync batch ${operationId}:`, error)
        }
      }
    }

    return { synced, failed }
  }

  /**
   * Get scan history for user
   */
  public getScanHistory(userId: string, limit?: number): ScanResult[] {
    const history = this.scanHistory.get(userId) ?? []
    return limit ? history.slice(-limit) : history
  }

  /**
   * Clear scan history
   */
  public clearScanHistory(userId?: string): void {
    if (userId) {
      this.scanHistory.delete(userId)
    } else {
      this.scanHistory.clear()
    }
  }

  /**
   * Enable/disable offline mode
   */
  public setOfflineMode(enabled: boolean): void {
    this.offlineMode = enabled
  }

  /**
   * Check if offline mode is active
   */
  public isOffline(): boolean {
    return this.offlineMode
  }

  /**
   * Get scanner statistics
   */
  public getStatistics(): ScannerStatistics {
    const avgScanTime =
      this.stats.scanTimes.length > 0
        ? this.stats.scanTimes.reduce((sum, time) => sum + time, 0) / this.stats.scanTimes.length
        : 0

    const lastScan = Array.from(this.scanHistory.values())
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

    return {
      totalScans: this.stats.totalScans,
      successfulScans: this.stats.successfulScans,
      failedScans: this.stats.failedScans,
      qrScans: this.stats.qrScans,
      barcodeScans: this.stats.barcodeScans,
      rfidScans: this.stats.rfidScans,
      offlineScans: this.stats.offlineScans,
      averageScanTime: Math.round(avgScanTime),
      lastScanTime: lastScan?.timestamp,
      activeScanners: (this.cameraActive ? 1 : 0) + (this.rfidReaderActive ? 1 : 0),
    }
  }

  /**
   * Get scanner health status
   */
  public async checkHealth(): Promise<ScannerHealth> {
    const pendingSync = Array.from(this.batchOperations.values()).filter(
      (op) => op.status === 'syncing',
    ).length

    const lastSyncedOp = Array.from(this.batchOperations.values())
      .filter((op) => op.status === 'synced')
      .sort((a, b) => (b.endTime?.getTime() ?? 0) - (a.endTime?.getTime() ?? 0))[0]

    return {
      cameraAvailable: await this.checkCameraAvailability(),
      rfidReaderAvailable: this.config.enableRFIDScanning && (await this.checkRFIDAvailability()),
      offlineModeActive: this.offlineMode,
      pendingSyncCount: pendingSync,
      lastSync: lastSyncedOp?.endTime,
      batteryLevel: await this.getBatteryLevel(),
      storageAvailable: await this.checkStorageAvailability(),
    }
  }

  /**
   * Start continuous scanning (camera stays active)
   */
  public async startContinuousScanning(callback: (result: ScanResult) => void): Promise<void> {
    if (!this.config.enableContinuousScanning) {
      throw new Error('Continuous scanning is not enabled')
    }

    this.cameraActive = true
    this.onScanComplete(callback)

    // In production, activate device camera
    // Integration point: Camera API (e.g., Capacitor Camera, React Native Camera)
  }

  /**
   * Stop continuous scanning
   */
  public stopContinuousScanning(): void {
    this.cameraActive = false
    // In production, deactivate device camera
  }

  /**
   * Check for duplicate scan
   */
  private isDuplicateScan(code: string): boolean {
    const lastScan = this.recentScans.get(code)
    if (!lastScan) return false

    const now = new Date()
    const diff = (now.getTime() - lastScan.getTime()) / 1000
    return diff < this.config.duplicateScanPreventionWindow
  }

  /**
   * Trigger haptic feedback (mobile devices)
   */
  private triggerHapticFeedback(): void {
    // In production, integrate with device haptic API
    // Integration point: Capacitor Haptics, React Native Haptics
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  /**
   * Play audio feedback
   */
  private playAudioFeedback(_type: 'success' | 'error'): void {
    // In production, play audio using Web Audio API or native sound
    // Integration point: Audio API
  }

  /**
   * Check camera availability
   */
  private async checkCameraAvailability(): Promise<boolean> {
    // In production, check device camera access
    // Integration point: Camera permissions API
    return typeof navigator !== 'undefined' && 'mediaDevices' in navigator
  }

  /**
   * Check RFID reader availability
   */
  private async checkRFIDAvailability(): Promise<boolean> {
    // In production, check RFID hardware connection
    // Integration point: RFID reader API
    return false
  }

  /**
   * Get battery level (mobile devices)
   */
  private async getBatteryLevel(): Promise<number | undefined> {
    // In production, get device battery level
    // Integration point: Battery Status API
    return undefined
  }

  /**
   * Check storage availability
   */
  private async checkStorageAvailability(): Promise<boolean> {
    // In production, check device storage
    // Integration point: Storage API
    return true
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(
      () => {
        const now = new Date()
        const cutoff = new Date(now.getTime() - this.config.offlineCacheDuration * 60 * 1000)

        // Clean up recent scans
        for (const [code, timestamp] of this.recentScans.entries()) {
          if (timestamp < cutoff) {
            this.recentScans.delete(code)
          }
        }
      },
      60 * 1000,
    ) // Run every minute
  }

  /**
   * Generate unique scan ID
   */
  private generateScanId(): string {
    return `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Shutdown gateway and cleanup resources
   */
  public async shutdown(): Promise<void> {
    this.stopContinuousScanning()
    this.scanCallbacks = []
    this.checkInOutCallbacks = []
    
    // Sync any pending operations
    if (this.offlineMode) {
      await this.syncOfflineScans()
    }
  }
}
