import { Result, UniqueEntityID } from '../../domain/shared'
import type { StockBatch } from '../../domain/inventory/entities/stock-batch'
import type { StockBatchRepository } from '../../domain/inventory/repositories/stock-batch-repository'
import type { StockMovementRepository } from '../../domain/inventory/repositories/stock-movement-repository'
import { StockMovement } from '../../domain/inventory/entities/stock-movement'

export type BatchUsageInput = {
  batchId: string
  quantityUsed: number
  usedById: string
  usageType: 'production' | 'consumption' | 'quality-test' | 'other'
  locationId: string
  notes?: string
}

export type BatchHistoryRecord = {
  timestamp: Date
  type: string
  quantity: number
  userId: string
  fromLocation?: string
  toLocation?: string
  batchNumber?: string
  notes?: string
}

export type RecallReport = {
  batchNumbers: string[]
  affectedItems: {
    itemId: string
    batchNumber: string
    lotNumber?: string
    quantityAvailable: number
    quantityAllocated: number
    locations: string[]
  }[]
  usageHistory: BatchHistoryRecord[]
  generatedAt: Date
}

export type BatchAllocation = {
  batchId: string
  batchNumber: string
  lotNumber?: string
  quantityToAllocate: number
  expirationDate?: Date
  manufacturingDate?: Date
}

/**
 * BatchTrackingService
 * 
 * Application service for managing batch and lot tracking operations.
 * Handles expiration monitoring, FIFO/FEFO allocation strategies,
 * usage tracking, and recall management.
 * 
 * Features:
 * - Expiration date monitoring and alerts
 * - FIFO (First-In-First-Out) allocation
 * - FEFO (First-Expired-First-Out) allocation
 * - Batch usage tracking with stock movements
 * - Historical batch activity reporting
 * - Recall report generation
 * - Certificate retrieval for compliance
 * 
 * Business Rules:
 * - FIFO: Allocate oldest batches first (by received date)
 * - FEFO: Allocate batches expiring soonest first
 * - Expired batches cannot be allocated
 * - Usage creates stock movement records
 * - Recall reports track all affected locations
 */
export class BatchTrackingService {
  private batchRepository: StockBatchRepository
  private movementRepository: StockMovementRepository

  constructor(
    batchRepository: StockBatchRepository,
    movementRepository: StockMovementRepository,
  ) {
    this.batchRepository = batchRepository
    this.movementRepository = movementRepository
  }

  /**
   * Get expiring batches
   * 
   * Retrieves all batches expiring within the specified threshold.
   * Used for proactive inventory management and waste reduction.
   * 
   * @param daysUntilExpiry - Days threshold for expiration (default: 30)
   * @param warehouseId - Optional filter by warehouse/location
   * @returns Result with array of StockBatch or error
   */
  async getExpiringBatches(
    daysUntilExpiry: number = 30,
    warehouseId?: UniqueEntityID,
  ): Promise<Result<StockBatch[]>> {
    const batchesResult = await this.batchRepository.findExpiring(daysUntilExpiry)
    
    if (!batchesResult.isSuccess || !batchesResult.value) {
      return Result.fail(batchesResult.error || 'Failed to retrieve expiring batches')
    }

    // Filter by warehouse if specified
    // Note: In production, this filtering should be done at repository level for efficiency
    let batches = batchesResult.value

    if (warehouseId) {
      // This would require location tracking on batches or a join query
      // For now, return all batches (to be enhanced with location data)
      batches = batchesResult.value
    }

    // Filter out already expired batches
    batches = batches.filter(batch => !batch.isExpired())

    return Result.ok(batches)
  }

  /**
   * Get expired batches
   * 
   * Retrieves all batches that have already expired.
   * Used for disposal, write-off, and compliance reporting.
   * 
   * @param warehouseId - Optional filter by warehouse/location
   * @returns Result with array of StockBatch or error
   */
  async getExpiredBatches(warehouseId?: UniqueEntityID): Promise<Result<StockBatch[]>> {
    const batchesResult = await this.batchRepository.findExpired()
    
    if (!batchesResult.isSuccess || !batchesResult.value) {
      return Result.fail(batchesResult.error || 'Failed to retrieve expired batches')
    }

    let batches = batchesResult.value

    if (warehouseId) {
      // This would require location tracking on batches or a join query
      // For now, return all batches (to be enhanced with location data)
      batches = batchesResult.value
    }

    return Result.ok(batches)
  }

  /**
   * Track batch usage
   * 
   * Records usage of a batch and creates stock movement record.
   * Updates batch quantity and creates audit trail.
   * 
   * @param input - Batch usage details including quantity, user, and usage type
   * @returns Result with void or error
   */
  async trackBatchUsage(input: BatchUsageInput): Promise<Result<void>> {
    const batchResult = await this.batchRepository.findById(new UniqueEntityID(input.batchId))
    
    if (!batchResult.isSuccess || !batchResult.value) {
      return Result.fail('Batch not found')
    }

    const batch = batchResult.value

    // Check if batch is expired
    if (batch.isExpired()) {
      return Result.fail('Cannot use expired batch')
    }

    // Consume the quantity from batch
    const consumeResult = batch.consume(input.quantityUsed)
    if (!consumeResult.isSuccess) {
      return Result.fail(consumeResult.error || 'Failed to consume batch quantity')
    }

    // Create stock movement record
    const movementType = input.usageType === 'production' ? 'production' : 'consumption'
    const movementResult = StockMovement.create({
      itemId: batch.itemId,
      type: movementType,
      quantity: input.quantityUsed,
      unit: batch.unit,
      fromLocationId: new UniqueEntityID(input.locationId),
      batchNumber: batch.batchNumber.value,
      lotNumber: batch.lotNumber?.value,
      userId: new UniqueEntityID(input.usedById),
      notes: input.notes,
      timestamp: new Date(),
      createdAt: new Date(),
    })

    if (!movementResult.isSuccess || !movementResult.value) {
      return Result.fail(movementResult.error || 'Failed to create stock movement')
    }

    // Save movement and batch
    const saveMovementResult = await this.movementRepository.save(movementResult.value)
    if (!saveMovementResult.isSuccess) {
      return Result.fail(saveMovementResult.error || 'Failed to save stock movement')
    }

    const saveBatchResult = await this.batchRepository.save(batch)
    if (!saveBatchResult.isSuccess) {
      return Result.fail(saveBatchResult.error || 'Failed to save batch')
    }

    return Result.ok(undefined as void)
  }

  /**
   * Get batch history
   * 
   * Retrieves complete history of all movements for a batch.
   * Provides traceability for audits and compliance.
   * 
   * @param batchId - ID of batch
   * @returns Result with array of BatchHistoryRecord or error
   */
  async getBatchHistory(batchId: UniqueEntityID): Promise<Result<BatchHistoryRecord[]>> {
    const batchResult = await this.batchRepository.findById(batchId)
    
    if (!batchResult.isSuccess || !batchResult.value) {
      return Result.fail('Batch not found')
    }

    const batch = batchResult.value
    const batchNumber = batch.batchNumber.value

    // Find all movements with this batch number
    const movementsResult = await this.movementRepository.findByItemId(batch.itemId)
    
    if (!movementsResult.isSuccess || !movementsResult.value) {
      return Result.fail(movementsResult.error || 'Failed to retrieve batch movements')
    }

    const movements = movementsResult.value
      .filter(m => m.batchNumber === batchNumber)
      .map(m => ({
        timestamp: m.timestamp,
        type: m.type,
        quantity: m.quantity,
        userId: m.userId.toString(),
        fromLocation: m.fromLocationId?.toString(),
        toLocation: m.toLocationId?.toString(),
        batchNumber: m.batchNumber,
        notes: m.notes,
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return Result.ok(movements)
  }

  /**
   * Generate recall report
   * 
   * Creates comprehensive report for batch recall scenarios.
   * Includes all affected items, locations, and usage history.
   * 
   * @param batchNumbers - Array of batch numbers to recall
   * @returns Result with RecallReport or error
   */
  async generateRecallReport(batchNumbers: string[]): Promise<Result<RecallReport>> {
    const affectedItems: RecallReport['affectedItems'] = []
    const allMovements: BatchHistoryRecord[] = []

    for (const batchNumber of batchNumbers) {
      const batchResult = await this.batchRepository.findByBatchNumber(batchNumber)
      
      if (!batchResult.isSuccess || !batchResult.value) {
        continue // Skip if batch not found
      }

      const batch = batchResult.value

      affectedItems.push({
        itemId: batch.itemId.toString(),
        batchNumber: batch.batchNumber.value,
        lotNumber: batch.lotNumber?.value,
        quantityAvailable: batch.quantityAvailable,
        quantityAllocated: batch.quantityAllocated,
        locations: [], // Would be populated from location tracking
      })

      // Get movement history for this batch
      const movementsResult = await this.movementRepository.findByItemId(batch.itemId)
      
      if (movementsResult.isSuccess && movementsResult.value) {
        const batchMovements = movementsResult.value
          .filter(m => m.batchNumber === batchNumber)
          .map(m => ({
            timestamp: m.timestamp,
            type: m.type,
            quantity: m.quantity,
            userId: m.userId.toString(),
            fromLocation: m.fromLocationId?.toString(),
            toLocation: m.toLocationId?.toString(),
            batchNumber: m.batchNumber,
            notes: m.notes,
          }))
        
        allMovements.push(...batchMovements)
      }
    }

    const report: RecallReport = {
      batchNumbers,
      affectedItems,
      usageHistory: allMovements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      generatedAt: new Date(),
    }

    return Result.ok(report)
  }

  /**
   * FIFO Allocation (First-In-First-Out)
   * 
   * Allocates batches based on received date - oldest first.
   * Standard inventory allocation strategy.
   * 
   * @param itemId - ID of item to allocate
   * @param quantityNeeded - Total quantity to allocate
   * @returns Result with array of BatchAllocation or error
   */
  async fifoAllocation(
    itemId: UniqueEntityID,
    quantityNeeded: number,
  ): Promise<Result<BatchAllocation[]>> {
    const batchesResult = await this.batchRepository.findByItemId(itemId)
    
    if (!batchesResult.isSuccess || !batchesResult.value) {
      return Result.fail(batchesResult.error || 'Failed to retrieve batches')
    }

    // Filter available batches (not expired, have quantity)
    const availableBatches = batchesResult.value
      .filter(batch => 
        !batch.isExpired() && 
        (batch.quantityAvailable - batch.quantityAllocated) > 0
      )
      .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime()) // Oldest first

    return this.allocateBatches(availableBatches, quantityNeeded)
  }

  /**
   * FEFO Allocation (First-Expired-First-Out)
   * 
   * Allocates batches expiring soonest first.
   * Recommended for perishable items and pharmaceuticals.
   * 
   * @param itemId - ID of item to allocate
   * @param quantityNeeded - Total quantity to allocate
   * @returns Result with array of BatchAllocation or error
   */
  async fefoAllocation(
    itemId: UniqueEntityID,
    quantityNeeded: number,
  ): Promise<Result<BatchAllocation[]>> {
    const batchesResult = await this.batchRepository.findByItemId(itemId)
    
    if (!batchesResult.isSuccess || !batchesResult.value) {
      return Result.fail(batchesResult.error || 'Failed to retrieve batches')
    }

    // Filter available batches with expiration dates
    const availableBatches = batchesResult.value
      .filter(batch => 
        !batch.isExpired() && 
        batch.expirationDate &&
        (batch.quantityAvailable - batch.quantityAllocated) > 0
      )
      .sort((a, b) => {
        // Sort by expiration date (earliest first)
        const dateA = a.expirationDate?.getTime() || Infinity
        const dateB = b.expirationDate?.getTime() || Infinity
        return dateA - dateB
      })

    return this.allocateBatches(availableBatches, quantityNeeded)
  }

  /**
   * Get batch certificate
   * 
   * Retrieves certificate/documentation for a batch.
   * Used for compliance, quality assurance, and customer requirements.
   * 
   * @param batchId - ID of batch
   * @returns Result with certificate details or error
   */
  async getBatchCertificate(batchId: UniqueEntityID): Promise<Result<{
    batchId: string
    batchNumber: string
    lotNumber?: string
    certificateNumber?: string
    manufacturingDate?: Date
    expirationDate?: Date
    supplierId?: string
    itemId: string
  }>> {
    const batchResult = await this.batchRepository.findById(batchId)
    
    if (!batchResult.isSuccess || !batchResult.value) {
      return Result.fail('Batch not found')
    }

    const batch = batchResult.value

    const certificate = {
      batchId: batchId.toString(),
      batchNumber: batch.batchNumber.value,
      lotNumber: batch.lotNumber?.value,
      certificateNumber: batch.certificateNumber,
      manufacturingDate: batch.manufacturingDate,
      expirationDate: batch.expirationDate,
      supplierId: batch.supplierId?.toString(),
      itemId: batch.itemId.toString(),
    }

    return Result.ok(certificate)
  }

  /**
   * Helper method to allocate batches to meet quantity needed
   */
  private allocateBatches(
    batches: StockBatch[],
    quantityNeeded: number,
  ): Result<BatchAllocation[]> {
    const allocations: BatchAllocation[] = []
    let remainingQuantity = quantityNeeded

    for (const batch of batches) {
      if (remainingQuantity <= 0) break

      const availableInBatch = batch.quantityAvailable - batch.quantityAllocated
      const quantityToAllocate = Math.min(availableInBatch, remainingQuantity)

      if (quantityToAllocate > 0) {
        allocations.push({
          batchId: batch.id.toString(),
          batchNumber: batch.batchNumber.value,
          lotNumber: batch.lotNumber?.value,
          quantityToAllocate,
          expirationDate: batch.expirationDate,
          manufacturingDate: batch.manufacturingDate,
        })

        remainingQuantity -= quantityToAllocate
      }
    }

    if (remainingQuantity > 0) {
      return Result.fail(`Insufficient quantity available. Short by ${remainingQuantity} units`)
    }

    return Result.ok(allocations)
  }
}
