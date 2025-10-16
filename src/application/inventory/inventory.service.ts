import { Result } from '@domain/shared'
import type {
  InventoryItem,
  InventoryItemRepository,
  StockBatchRepository,
  StockMovementRepository,
  ABCCategory,
} from '@domain/inventory'

export type StockLevelAnalysis = {
  itemId: string
  sku: string
  name: string
  quantityOnHand: number
  quantityAllocated: number
  quantityAvailable: number
  reorderPoint: number
  safetyStock: number
  economicOrderQuantity: number
  stockStatus: 'adequate' | 'low' | 'critical' | 'excess'
  daysOfCoverage: number
  abcCategory?: ABCCategory
}

export type EOQCalculationParams = {
  annualDemand: number
  orderingCost: number
  holdingCostPerUnit: number
}

export type EOQResult = {
  economicOrderQuantity: number
  totalAnnualCost: number
  orderFrequency: number
  optimalOrderInterval: number
}

export type ReorderPointParams = {
  averageDailyDemand: number
  leadTimeDays: number
  safetyStock: number
}

export type SafetyStockParams = {
  averageDailyDemand: number
  maxDailyDemand: number
  averageLeadTime: number
  maxLeadTime: number
  serviceLevel: number // 0-1, e.g., 0.95 for 95%
}

export type ABCAnalysisResult = {
  itemId: string
  sku: string
  name: string
  annualUsageValue: number
  percentageOfTotalValue: number
  cumulativePercentage: number
  category: ABCCategory
  recommendation: string
}

export class InventoryService {
  private readonly inventoryItemRepository: InventoryItemRepository
  private readonly stockBatchRepository: StockBatchRepository
  private readonly stockMovementRepository: StockMovementRepository

  constructor(deps: {
    inventoryItemRepository: InventoryItemRepository
    stockBatchRepository: StockBatchRepository
    stockMovementRepository: StockMovementRepository
  }) {
    this.inventoryItemRepository = deps.inventoryItemRepository
    this.stockBatchRepository = deps.stockBatchRepository
    this.stockMovementRepository = deps.stockMovementRepository
  }

  /**
   * Calculate Economic Order Quantity (EOQ)
   * EOQ = √((2 × Annual Demand × Ordering Cost) / Holding Cost per Unit)
   */
  public calculateEOQ(params: EOQCalculationParams): EOQResult {
    const { annualDemand, orderingCost, holdingCostPerUnit } = params

    // Calculate EOQ
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit)

    // Calculate number of orders per year
    const orderFrequency = annualDemand / eoq

    // Calculate optimal order interval in days
    const optimalOrderInterval = 365 / orderFrequency

    // Calculate total annual cost
    const orderingCostTotal = orderFrequency * orderingCost
    const holdingCostTotal = (eoq / 2) * holdingCostPerUnit
    const totalAnnualCost = orderingCostTotal + holdingCostTotal

    return {
      economicOrderQuantity: Math.ceil(eoq),
      totalAnnualCost,
      orderFrequency: Math.round(orderFrequency),
      optimalOrderInterval: Math.round(optimalOrderInterval),
    }
  }

  /**
   * Calculate Reorder Point (ROP)
   * ROP = (Average Daily Demand × Lead Time) + Safety Stock
   */
  public calculateReorderPoint(params: ReorderPointParams): number {
    const { averageDailyDemand, leadTimeDays, safetyStock } = params
    return Math.ceil(averageDailyDemand * leadTimeDays + safetyStock)
  }

  /**
   * Calculate Safety Stock
   * Safety Stock = (Max Daily Demand × Max Lead Time) - (Average Daily Demand × Average Lead Time)
   */
  public calculateSafetyStock(params: SafetyStockParams): number {
    const { maxDailyDemand, maxLeadTime, averageDailyDemand, averageLeadTime, serviceLevel } = params

    // Simple method
    const simpleSafetyStock = (maxDailyDemand * maxLeadTime) - (averageDailyDemand * averageLeadTime)

    // Adjust for service level (z-score approximation)
    // 95% service level ≈ 1.65, 99% ≈ 2.33
    const zScore = this.getZScore(serviceLevel)
    const adjustedSafetyStock = simpleSafetyStock * zScore

    return Math.ceil(adjustedSafetyStock)
  }

  /**
   * Perform ABC Analysis on inventory items
   * A items: ~20% of items, ~80% of value
   * B items: ~30% of items, ~15% of value
   * C items: ~50% of items, ~5% of value
   */
  public async performABCAnalysis(
    startDate: Date,
    endDate: Date,
  ): Promise<Result<ABCAnalysisResult[]>> {
    try {
      // Get all inventory items
      const items = await this.inventoryItemRepository.findAll()
      if (!items || items.length === 0) {
        return Result.ok([])
      }

      // Calculate annual usage value for each item
      const itemAnalysis: Array<{
        item: InventoryItem
        annualUsageValue: number
      }> = []

      for (const item of items) {
        // Get movements for this item in the date range
        const movementsResult = await this.stockMovementRepository.findByItemId(
          item.id,
          startDate,
          endDate,
        )

        if (!movementsResult.isSuccess) {
          continue
        }

        const movements = movementsResult.value || []
        
        // Calculate usage (outbound movements)
        const totalUsage = movements
          .filter(m => m.isOutbound())
          .reduce((sum, m) => sum + m.quantity, 0)

        const annualUsageValue = totalUsage * item.unitCost.amount

        itemAnalysis.push({
          item,
          annualUsageValue,
        })
      }

      // Sort by annual usage value (descending)
      itemAnalysis.sort((a, b) => b.annualUsageValue - a.annualUsageValue)

      // Calculate total value
      const totalValue = itemAnalysis.reduce((sum, item) => sum + item.annualUsageValue, 0)

      // Assign ABC categories
      const results: ABCAnalysisResult[] = []
      let cumulativeValue = 0
      let cumulativePercentage = 0

      for (const { item, annualUsageValue } of itemAnalysis) {
        cumulativeValue += annualUsageValue
        const percentageOfTotal = totalValue > 0 ? (annualUsageValue / totalValue) * 100 : 0
        cumulativePercentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0

        // Determine category
        let category: ABCCategory
        let recommendation: string

        if (cumulativePercentage <= 80) {
          category = 'A'
          recommendation = 'High value - tight inventory control, frequent reviews, accurate records'
        } else if (cumulativePercentage <= 95) {
          category = 'B'
          recommendation = 'Moderate value - normal inventory control, periodic reviews'
        } else {
          category = 'C'
          recommendation = 'Low value - simple inventory control, bulk ordering, minimal reviews'
        }

        results.push({
          itemId: item.id.toString(),
          sku: item.sku.value,
          name: item.name,
          annualUsageValue,
          percentageOfTotalValue: percentageOfTotal,
          cumulativePercentage,
          category,
          recommendation,
        })
      }

      return Result.ok(results)
    } catch (error) {
      return Result.fail(`Failed to perform ABC analysis: ${error}`)
    }
  }

  /**
   * Analyze stock levels across all items
   */
  public async analyzeStockLevels(): Promise<Result<StockLevelAnalysis[]>> {
    try {
      const items = await this.inventoryItemRepository.findAll()
      if (!items || items.length === 0) {
        return Result.ok([])
      }

      const analysis: StockLevelAnalysis[] = []

      for (const item of items) {
        // Get batches for this item
        const batchesResult = await this.stockBatchRepository.findByItemId(item.id)
        const batches = batchesResult.isSuccess ? batchesResult.value || [] : []

        const quantityOnHand = batches.reduce((sum, b) => sum + b.quantityAvailable, 0)
        const quantityAllocated = batches.reduce((sum, b) => sum + b.quantityAllocated, 0)
        const quantityAvailable = quantityOnHand - quantityAllocated

        // Estimate daily usage from recent movements (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const movementsResult = await this.stockMovementRepository.findByItemId(
          item.id,
          thirtyDaysAgo,
          new Date(),
        )

        const movements = movementsResult.isSuccess ? movementsResult.value || [] : []
        const totalUsage = movements
          .filter(m => m.isOutbound())
          .reduce((sum, m) => sum + m.quantity, 0)

        const averageDailyUsage = totalUsage / 30
        const daysOfCoverage = averageDailyUsage > 0 ? quantityAvailable / averageDailyUsage : 999

        // Simple EOQ calculation (assuming some defaults)
        const eoqResult = this.calculateEOQ({
          annualDemand: averageDailyUsage * 365,
          orderingCost: 50, // Default ordering cost
          holdingCostPerUnit: item.unitCost.amount * 0.25, // 25% holding cost
        })

        // Simple safety stock (1 week of average usage)
        const safetyStock = Math.ceil(averageDailyUsage * 7)

        // Determine stock status
        let stockStatus: 'adequate' | 'low' | 'critical' | 'excess'
        if (quantityAvailable <= safetyStock) {
          stockStatus = 'critical'
        } else if (quantityAvailable <= item.reorderPoint) {
          stockStatus = 'low'
        } else if (quantityAvailable > eoqResult.economicOrderQuantity * 2) {
          stockStatus = 'excess'
        } else {
          stockStatus = 'adequate'
        }

        analysis.push({
          itemId: item.id.toString(),
          sku: item.sku.value,
          name: item.name,
          quantityOnHand,
          quantityAllocated,
          quantityAvailable,
          reorderPoint: item.reorderPoint,
          safetyStock,
          economicOrderQuantity: eoqResult.economicOrderQuantity,
          stockStatus,
          daysOfCoverage: Math.round(daysOfCoverage),
        })
      }

      return Result.ok(analysis)
    } catch (error) {
      return Result.fail(`Failed to analyze stock levels: ${error}`)
    }
  }

  /**
   * Get items that need reordering
   */
  public async getItemsRequiringReorder(): Promise<Result<InventoryItem[]>> {
    try {
      const items = await this.inventoryItemRepository.findAll()
      if (!items || items.length === 0) {
        return Result.ok([])
      }

      const itemsToReorder: InventoryItem[] = []

      for (const item of items) {
        const batchesResult = await this.stockBatchRepository.findByItemId(item.id)
        const batches = batchesResult.isSuccess ? batchesResult.value || [] : []

        const quantityAvailable = batches.reduce(
          (sum, b) => sum + (b.quantityAvailable - b.quantityAllocated),
          0,
        )

        if (quantityAvailable <= item.reorderPoint) {
          itemsToReorder.push(item)
        }
      }

      return Result.ok(itemsToReorder)
    } catch (error) {
      return Result.fail(`Failed to get items requiring reorder: ${error}`)
    }
  }

  /**
   * Get z-score for service level
   */
  private getZScore(serviceLevel: number): number {
    // Simplified z-score mapping
    if (serviceLevel >= 0.99) return 2.33
    if (serviceLevel >= 0.98) return 2.05
    if (serviceLevel >= 0.95) return 1.65
    if (serviceLevel >= 0.90) return 1.28
    if (serviceLevel >= 0.85) return 1.04
    return 0.84 // 80% service level
  }
}
