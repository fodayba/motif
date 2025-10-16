import type { Result, UniqueEntityID } from '../../domain/shared'
import type { KanbanSignal } from '../../domain/inventory/entities/kanban-signal'
import type { PullSignal } from '../../domain/inventory/entities/pull-signal'
import type { KanbanSignalRepository } from '../../domain/inventory/repositories/kanban-signal-repository'
import type { PullSignalRepository } from '../../domain/inventory/repositories/pull-signal-repository'
import type { InventoryItemRepository } from '../../domain/inventory/repositories/inventory-item-repository'
import type { StockMovementRepository } from '../../domain/inventory/repositories/stock-movement-repository'

export type DemandPattern = {
  averageDailyDemand: number
  variability: number // Standard deviation
  leadTime: number // in days
  serviceLevel: number // e.g., 0.95 for 95%
}

export type KanbanConfiguration = {
  itemId: UniqueEntityID
  locationId: UniqueEntityID
  demandPattern: DemandPattern
  containerSize?: number
  numberOfContainers?: number
}

export type JITMetrics = {
  inventoryTurnoverRate: number
  averageInventoryLevel: number
  stockoutRate: number
  pullSignalFulfillmentRate: number
  leadTimePerformance: number
  wasteReduction: number
}

/**
 * JIT (Just-in-Time) Service
 * Implements pull-based inventory management with kanban signals and demand-driven replenishment
 */
export class JITService {
  private kanbanSignalRepository: KanbanSignalRepository
  private pullSignalRepository: PullSignalRepository
  private inventoryItemRepository: InventoryItemRepository
  private stockMovementRepository: StockMovementRepository

  constructor(
    kanbanSignalRepository: KanbanSignalRepository,
    pullSignalRepository: PullSignalRepository,
    inventoryItemRepository: InventoryItemRepository,
    stockMovementRepository: StockMovementRepository,
  ) {
    this.kanbanSignalRepository = kanbanSignalRepository
    this.pullSignalRepository = pullSignalRepository
    this.inventoryItemRepository = inventoryItemRepository
    this.stockMovementRepository = stockMovementRepository
  }

  /**
   * Create a kanban signal for an inventory item
   */
  async createKanbanSignal(
    itemId: UniqueEntityID,
    itemSku: string,
    itemName: string,
    locationId: UniqueEntityID,
    locationName: string,
    triggerQuantity: number,
    orderQuantity: number,
    createdBy: UniqueEntityID,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      supplierId?: UniqueEntityID
      supplierName?: string
      notes?: string
    },
  ): Promise<Result<KanbanSignal>> {
    const { KanbanSignal } = await import('../../domain/inventory/entities/kanban-signal')
    
    // Get current quantity from inventory
    const itemResult = await this.inventoryItemRepository.findById(itemId)
    if (!itemResult) {
      return { isSuccess: false, error: 'Inventory item not found' } as Result<KanbanSignal>
    }

    const currentQuantity = itemResult.quantityOnHand.value

    const signalResult = KanbanSignal.create({
      itemId,
      itemSku,
      itemName,
      triggerQuantity,
      orderQuantity,
      currentQuantity,
      status: 'active',
      priority: options?.priority ?? 'normal',
      locationId,
      locationName,
      supplierId: options?.supplierId,
      supplierName: options?.supplierName,
      notes: options?.notes,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!signalResult.isSuccess) {
      return signalResult
    }

    const signal = signalResult.value!
    await this.kanbanSignalRepository.save(signal)

    return signalResult
  }

  /**
   * Calculate optimal kanban configuration based on demand patterns
   */
  async calculateKanbanConfiguration(
    config: KanbanConfiguration,
  ): Promise<Result<{ triggerQuantity: number; orderQuantity: number; numberOfKanbans: number }>> {
    const { averageDailyDemand, variability, leadTime, serviceLevel } = config.demandPattern

    // Calculate safety stock using service level
    const zScore = this.getZScore(serviceLevel)
    const leadTimeDemand = averageDailyDemand * leadTime
    const safetyStock = Math.ceil(zScore * variability * Math.sqrt(leadTime))

    // Calculate order quantity (consider container size if provided)
    const baseOrderQuantity = Math.ceil(leadTimeDemand + safetyStock)
    const orderQuantity = config.containerSize
      ? Math.ceil(baseOrderQuantity / config.containerSize) * config.containerSize
      : baseOrderQuantity

    // Calculate trigger point (when to signal for replenishment)
    const triggerQuantity = Math.ceil(leadTimeDemand + safetyStock * 0.5)

    // Calculate number of kanban cards needed
    const numberOfKanbans = config.numberOfContainers ?? 
      Math.ceil((leadTimeDemand + safetyStock) / (config.containerSize ?? orderQuantity)) + 1

    return {
      isSuccess: true,
      value: {
        triggerQuantity,
        orderQuantity,
        numberOfKanbans,
      },
    } as Result<{ triggerQuantity: number; orderQuantity: number; numberOfKanbans: number }>
  }

  /**
   * Check all kanban signals and trigger any that have reached trigger point
   */
  async checkAndTriggerKanbanSignals(): Promise<Result<KanbanSignal[]>> {
    const activeSignalsResult = await this.kanbanSignalRepository.findActiveSignals()
    if (!activeSignalsResult.isSuccess) {
      return activeSignalsResult
    }

    const activeSignals = activeSignalsResult.value ?? []
    const triggeredSignals: KanbanSignal[] = []

    for (const signal of activeSignals) {
      // Update current quantity from inventory
      const itemResult = await this.inventoryItemRepository.findById(signal.itemId)
      if (!itemResult) {
        continue
      }

      const currentQuantity = itemResult.quantityOnHand.value
      const updateResult = signal.updateCurrentQuantity(currentQuantity)
      
      if (!updateResult.isSuccess) {
        continue
      }

      // Check if should trigger
      if (signal.shouldTrigger()) {
        const triggerResult = signal.trigger()
        if (triggerResult.isSuccess) {
          await this.kanbanSignalRepository.save(signal)
          triggeredSignals.push(signal)
        }
      } else {
        // Save updated quantity
        await this.kanbanSignalRepository.save(signal)
      }
    }

    return {
      isSuccess: true,
      value: triggeredSignals,
    } as Result<KanbanSignal[]>
  }

  /**
   * Create a pull signal to move inventory between locations
   */
  async createPullSignal(
    signalType: 'kanban' | 'demand' | 'manual',
    itemId: UniqueEntityID,
    itemSku: string,
    itemName: string,
    fromLocationId: UniqueEntityID,
    fromLocationName: string,
    toLocationId: UniqueEntityID,
    toLocationName: string,
    requestedQuantity: number,
    requestedBy: UniqueEntityID,
    requestedByName: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      demandSource?: string
      requiredBy?: Date
      notes?: string
    },
  ): Promise<Result<PullSignal>> {
    const { PullSignal } = await import('../../domain/inventory/entities/pull-signal')

    const signalResult = PullSignal.create({
      signalType,
      itemId,
      itemSku,
      itemName,
      fromLocationId,
      fromLocationName,
      toLocationId,
      toLocationName,
      requestedQuantity,
      priority: options?.priority ?? 'normal',
      status: 'pending',
      demandSource: options?.demandSource,
      requiredBy: options?.requiredBy,
      requestedBy,
      requestedByName,
      notes: options?.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!signalResult.isSuccess) {
      return signalResult
    }

    const signal = signalResult.value!
    await this.pullSignalRepository.save(signal)

    return signalResult
  }

  /**
   * Approve a pull signal
   */
  async approvePullSignal(
    signalId: UniqueEntityID,
    approvedBy: UniqueEntityID,
    approvedByName: string,
    approvedQuantity?: number,
  ): Promise<Result<void>> {
    const signalResult = await this.pullSignalRepository.findById(signalId)
    if (!signalResult.isSuccess || !signalResult.value) {
      return { isSuccess: false, error: 'Pull signal not found' } as Result<void>
    }

    const signal = signalResult.value
    const approveResult = signal.approve(approvedBy, approvedByName, approvedQuantity)
    
    if (!approveResult.isSuccess) {
      return approveResult
    }

    await this.pullSignalRepository.save(signal)

    return { isSuccess: true, value: undefined as void } as Result<void>
  }

  /**
   * Process a pull signal through its lifecycle
   */
  async processPullSignal(signalId: UniqueEntityID): Promise<Result<void>> {
    const signalResult = await this.pullSignalRepository.findById(signalId)
    if (!signalResult.isSuccess || !signalResult.value) {
      return { isSuccess: false, error: 'Pull signal not found' } as Result<void>
    }

    const signal = signalResult.value

    // Move through workflow: approved -> in-transit -> received
    if (signal.status === 'approved') {
      const transitResult = signal.markInTransit()
      if (!transitResult.isSuccess) {
        return transitResult
      }
    } else if (signal.status === 'in-transit') {
      const receiveResult = signal.receive()
      if (!receiveResult.isSuccess) {
        return receiveResult
      }
    } else {
      return { isSuccess: false, error: `Cannot process signal with status: ${signal.status}` } as Result<void>
    }

    await this.pullSignalRepository.save(signal)

    return { isSuccess: true, value: undefined as void } as Result<void>
  }

  /**
   * Calculate JIT performance metrics
   */
  async calculateJITMetrics(
    locationId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
  ): Promise<Result<JITMetrics>> {
    // Get all movements for the period
    const movementsResult = await this.stockMovementRepository.findByItemId(
      locationId, // This is simplified; would need proper location filtering
      startDate,
      endDate,
    )

    if (!movementsResult.isSuccess) {
      return { isSuccess: false, error: 'Failed to fetch stock movements' } as Result<JITMetrics>
    }

    const movements = movementsResult.value ?? []
    
    // Calculate metrics (simplified calculations)
    const totalIssued = movements
      .filter(m => m.type === 'issue' || m.type === 'transfer-out')
      .reduce((sum, m) => sum + m.quantity, 0)

    const totalReceived = movements
      .filter(m => m.type === 'receipt' || m.type === 'transfer-in')
      .reduce((sum, m) => sum + m.quantity, 0)

    const avgInventory = (totalReceived + totalIssued) / 2
    const inventoryTurnoverRate = avgInventory > 0 ? totalIssued / avgInventory : 0

    // Get pull signal metrics
    const pullSignalsResult = await this.pullSignalRepository.findByToLocation(locationId)
    const pullSignals = pullSignalsResult.value ?? []

    const totalPullSignals = pullSignals.length
    const fulfilledSignals = pullSignals.filter(s => s.status === 'received').length
    const pullSignalFulfillmentRate = totalPullSignals > 0
      ? fulfilledSignals / totalPullSignals
      : 1

    // Calculate lead time performance
    const completedSignals = pullSignals.filter(s => s.status === 'received' && s.receivedAt && s.approvedAt)
    const totalLeadTime = completedSignals.reduce((sum, s) => {
      const leadTime = s.receivedAt!.getTime() - s.approvedAt!.getTime()
      return sum + leadTime / (1000 * 60 * 60 * 24) // Convert to days
    }, 0)

    const leadTimePerformance = completedSignals.length > 0
      ? totalLeadTime / completedSignals.length
      : 0

    const metrics: JITMetrics = {
      inventoryTurnoverRate,
      averageInventoryLevel: avgInventory,
      stockoutRate: 0, // Would need stockout tracking
      pullSignalFulfillmentRate,
      leadTimePerformance,
      wasteReduction: 0, // Would need waste tracking
    }

    return {
      isSuccess: true,
      value: metrics,
    } as Result<JITMetrics>
  }

  /**
   * Get overdue pull signals
   */
  async getOverduePullSignals(): Promise<Result<PullSignal[]>> {
    return this.pullSignalRepository.findOverdueSignals()
  }

  /**
   * Get triggered kanban signals that need action
   */
  async getTriggeredKanbanSignals(): Promise<Result<KanbanSignal[]>> {
    return this.kanbanSignalRepository.findTriggeredSignals()
  }

  /**
   * Fulfill a kanban signal (mark as received)
   */
  async fulfillKanbanSignal(signalId: UniqueEntityID): Promise<Result<void>> {
    const signalResult = await this.kanbanSignalRepository.findById(signalId)
    if (!signalResult.isSuccess || !signalResult.value) {
      return { isSuccess: false, error: 'Kanban signal not found' } as Result<void>
    }

    const signal = signalResult.value
    const fulfillResult = signal.fulfill()

    if (!fulfillResult.isSuccess) {
      return fulfillResult
    }

    await this.kanbanSignalRepository.save(signal)

    return { isSuccess: true, value: undefined as void } as Result<void>
  }

  /**
   * Reset a fulfilled kanban signal to active
   */
  async resetKanbanSignal(signalId: UniqueEntityID): Promise<Result<void>> {
    const signalResult = await this.kanbanSignalRepository.findById(signalId)
    if (!signalResult.isSuccess || !signalResult.value) {
      return { isSuccess: false, error: 'Kanban signal not found' } as Result<void>
    }

    const signal = signalResult.value
    const resetResult = signal.reset()

    if (!resetResult.isSuccess) {
      return resetResult
    }

    await this.kanbanSignalRepository.save(signal)

    return { isSuccess: true, value: undefined as void } as Result<void>
  }

  /**
   * Get service level Z-score for safety stock calculations
   */
  private getZScore(serviceLevel: number): number {
    const zScores: Record<number, number> = {
      0.5: 0.0,
      0.8: 0.84,
      0.85: 1.04,
      0.9: 1.28,
      0.95: 1.65,
      0.975: 1.96,
      0.99: 2.33,
      0.995: 2.58,
    }

    return zScores[serviceLevel] ?? 1.65 // Default to 95%
  }
}
