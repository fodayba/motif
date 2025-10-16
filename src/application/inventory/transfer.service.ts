import type {
  InventoryTransferRepository,
  TransferStatus,
} from '@domain/inventory'
import { InventoryTransfer } from '@domain/inventory'
import { Result, UniqueEntityID } from '@domain/shared'
import type { Money } from '@domain/shared'

export type CreateTransferInput = {
  fromLocationId: string
  toLocationId: string
  items: Array<{
    itemId: string
    itemName: string
    sku: string
    quantity: number
    unit: string
    unitCost: Money
  }>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  requestedById: string
  estimatedArrival?: Date
  notes?: string
}

export type TransferRouteOptimizationResult = {
  recommendedRoute: Array<{
    locationId: string
    locationName: string
    sequence: number
    estimatedDistance: number
    estimatedTime: number
  }>
  totalDistance: number
  totalTime: number
  estimatedCost: number
}

export class TransferService {
  private readonly transferRepository: InventoryTransferRepository

  constructor(deps: { transferRepository: InventoryTransferRepository }) {
    this.transferRepository = deps.transferRepository
  }

  async createTransfer(input: CreateTransferInput): Promise<Result<InventoryTransfer>> {
    try {
      const transferNumber = this.generateTransferNumber()

      const transferProps = {
        transferNumber,
        status: 'draft' as TransferStatus,
        fromLocationId: new UniqueEntityID(input.fromLocationId),
        toLocationId: new UniqueEntityID(input.toLocationId),
        items: input.items.map(item => ({
          itemId: new UniqueEntityID(item.itemId),
          itemName: item.itemName,
          sku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
        })),
        routeStops: [],
        requestedById: new UniqueEntityID(input.requestedById),
        estimatedArrival: input.estimatedArrival,
        priority: input.priority,
        notes: input.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const transferResult = InventoryTransfer.create(transferProps)
      if (!transferResult.isSuccess || !transferResult.value) {
        return Result.fail(transferResult.error ?? 'Failed to create transfer')
      }

      const saveResult = await this.transferRepository.save(transferResult.value)
      if (!saveResult.isSuccess) {
        return Result.fail(saveResult.error ?? 'Failed to save transfer')
      }

      return Result.ok(transferResult.value)
    } catch (error) {
      return Result.fail(`Failed to create transfer: ${error}`)
    }
  }

  async approveTransfer(transferId: string, approvedById: string): Promise<Result<void>> {
    try {
      const transferResult = await this.transferRepository.findById(new UniqueEntityID(transferId))
      if (!transferResult.isSuccess || !transferResult.value) {
        return Result.fail('Transfer not found')
      }

      const transfer = transferResult.value
      const approveResult = transfer.approve(new UniqueEntityID(approvedById))
      if (!approveResult.isSuccess) {
        return Result.fail(approveResult.error ?? 'Failed to approve transfer')
      }

      return await this.transferRepository.save(transfer)
    } catch (error) {
      return Result.fail(`Failed to approve transfer: ${error}`)
    }
  }

  async shipTransfer(
    transferId: string,
    shippedById: string,
    carrier?: string,
    trackingNumber?: string,
  ): Promise<Result<void>> {
    try {
      const transferResult = await this.transferRepository.findById(new UniqueEntityID(transferId))
      if (!transferResult.isSuccess || !transferResult.value) {
        return Result.fail('Transfer not found')
      }

      const transfer = transferResult.value
      const shipResult = transfer.ship(new UniqueEntityID(shippedById), carrier, trackingNumber)
      if (!shipResult.isSuccess) {
        return Result.fail(shipResult.error ?? 'Failed to ship transfer')
      }

      return await this.transferRepository.save(transfer)
    } catch (error) {
      return Result.fail(`Failed to ship transfer: ${error}`)
    }
  }

  async receiveTransfer(transferId: string, receivedById: string): Promise<Result<void>> {
    try {
      const transferResult = await this.transferRepository.findById(new UniqueEntityID(transferId))
      if (!transferResult.isSuccess || !transferResult.value) {
        return Result.fail('Transfer not found')
      }

      const transfer = transferResult.value
      const receiveResult = transfer.receive(new UniqueEntityID(receivedById))
      if (!receiveResult.isSuccess) {
        return Result.fail(receiveResult.error ?? 'Failed to receive transfer')
      }

      return await this.transferRepository.save(transfer)
    } catch (error) {
      return Result.fail(`Failed to receive transfer: ${error}`)
    }
  }

  async getOverdueTransfers(): Promise<Result<InventoryTransfer[]>> {
    return await this.transferRepository.findOverdue()
  }

  async getTransfersByStatus(status: TransferStatus): Promise<Result<InventoryTransfer[]>> {
    return await this.transferRepository.findByStatus(status)
  }

  /**
   * Optimize transfer route using simple distance/time calculations
   * In production, this would integrate with mapping services
   */
  async optimizeTransferRoute(
    fromLocationId: string,
    toLocationId: string,
    intermediateStops: string[],
  ): Promise<Result<TransferRouteOptimizationResult>> {
    try {
      // This is a simplified implementation
      // In production, integrate with Google Maps Distance Matrix API or similar
      
      const route = [
        {
          locationId: fromLocationId,
          locationName: 'Origin',
          sequence: 0,
          estimatedDistance: 0,
          estimatedTime: 0,
        },
        ...intermediateStops.map((stopId, index) => ({
          locationId: stopId,
          locationName: `Stop ${index + 1}`,
          sequence: index + 1,
          estimatedDistance: 50, // Mock: 50 km per leg
          estimatedTime: 60, // Mock: 60 minutes per leg
        })),
        {
          locationId: toLocationId,
          locationName: 'Destination',
          sequence: intermediateStops.length + 1,
          estimatedDistance: 50,
          estimatedTime: 60,
        },
      ]

      const totalDistance = route.reduce((sum, stop) => sum + stop.estimatedDistance, 0)
      const totalTime = route.reduce((sum, stop) => sum + stop.estimatedTime, 0)
      const estimatedCost = totalDistance * 2.5 // $2.50 per km

      return Result.ok({
        recommendedRoute: route,
        totalDistance,
        totalTime,
        estimatedCost,
      })
    } catch (error) {
      return Result.fail(`Failed to optimize route: ${error}`)
    }
  }

  private generateTransferNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `TR-${timestamp}-${random}`
  }
}
