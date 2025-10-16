import { Result, UniqueEntityID } from '../../domain/shared'
import { MaterialRequisition } from '../../domain/inventory/entities/material-requisition'
import type { RequisitionItemProps } from '../../domain/inventory/entities/material-requisition'
import type { MaterialRequisitionRepository } from '../../domain/inventory/repositories/material-requisition-repository'
import type { StockMovementRepository } from '../../domain/inventory/repositories/stock-movement-repository'
import { StockMovement } from '../../domain/inventory/entities/stock-movement'

export type CreateRequisitionInput = {
  projectId?: string
  locationId: string
  requestedById: string
  requiredByDate: Date
  items: {
    itemId: string
    itemName: string
    sku: string
    requestedQuantity: number
    unit: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    notes?: string
  }[]
  purpose?: string
  costCenter?: string
  notes?: string
}

export type RequisitionFulfillmentStatus = {
  requisitionId: string
  requisitionNumber: string
  status: string
  fulfillmentPercentage: number
  totalItems: number
  fulfilledItems: number
  unfulfilledItems: {
    itemId: string
    itemName: string
    sku: string
    requestedQuantity: number
    fulfilledQuantity: number
    remainingQuantity: number
  }[]
}

/**
 * RequisitionService
 * 
 * Application service for managing material requisitions.
 * Handles workflows for creating, submitting, approving, and fulfilling
 * material requests across projects and locations.
 * 
 * Features:
 * - Requisition creation and submission
 * - Approval/rejection workflows
 * - Item-level fulfillment tracking
 * - Overdue requisition monitoring
 * - Project and location filtering
 * 
 * Business Rules:
 * - Requisitions start in 'draft' status
 * - Only submitted requisitions can be approved/rejected
 * - Only approved requisitions can be fulfilled
 * - Fulfillment tracked at item level with quantities
 * - Overdue when required date passes without full fulfillment
 */
export class RequisitionService {
  private requisitionRepository: MaterialRequisitionRepository
  private stockMovementRepository: StockMovementRepository

  constructor(
    requisitionRepository: MaterialRequisitionRepository,
    stockMovementRepository: StockMovementRepository,
  ) {
    this.requisitionRepository = requisitionRepository
    this.stockMovementRepository = stockMovementRepository
  }

  /**
   * Create a new material requisition
   * 
   * Creates a requisition in 'draft' status. Requisition must be submitted
   * before it can be approved or fulfilled.
   * 
   * @param input - Requisition details including items, location, and required date
   * @returns Result with created MaterialRequisition or error
   */
  async createRequisition(input: CreateRequisitionInput): Promise<Result<MaterialRequisition>> {
    const requisitionNumber = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    const items: RequisitionItemProps[] = input.items.map(item => ({
      itemId: new UniqueEntityID(item.itemId),
      itemName: item.itemName,
      sku: item.sku,
      requestedQuantity: item.requestedQuantity,
      fulfilledQuantity: 0,
      unit: item.unit,
      priority: item.priority,
      notes: item.notes,
    }))

    const requisitionResult = MaterialRequisition.create({
      requisitionNumber,
      status: 'draft',
      projectId: input.projectId ? new UniqueEntityID(input.projectId) : undefined,
      locationId: new UniqueEntityID(input.locationId),
      requestedById: new UniqueEntityID(input.requestedById),
      requiredByDate: input.requiredByDate,
      items,
      purpose: input.purpose,
      costCenter: input.costCenter,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!requisitionResult.isSuccess || !requisitionResult.value) {
      return Result.fail(requisitionResult.error || 'Failed to create requisition')
    }

    const saveResult = await this.requisitionRepository.save(requisitionResult.value)
    if (!saveResult.isSuccess) {
      return Result.fail(saveResult.error || 'Failed to save requisition')
    }

    return Result.ok(requisitionResult.value)
  }

  /**
   * Submit a requisition for approval
   * 
   * Transitions requisition from 'draft' to 'submitted' status.
   * After submission, requisition enters approval workflow.
   * 
   * @param requisitionId - ID of requisition to submit
   * @returns Result with void or error
   */
  async submitRequisition(requisitionId: UniqueEntityID): Promise<Result<void>> {
    const requisitionResult = await this.requisitionRepository.findById(requisitionId)
    if (!requisitionResult.isSuccess || !requisitionResult.value) {
      return Result.fail('Requisition not found')
    }

    const requisition = requisitionResult.value
    const submitResult = requisition.submit()
    if (!submitResult.isSuccess) {
      return Result.fail(submitResult.error || 'Failed to submit requisition')
    }

    const saveResult = await this.requisitionRepository.save(requisition)
    if (!saveResult.isSuccess) {
      return Result.fail(saveResult.error || 'Failed to save requisition')
    }

    return Result.ok(undefined as void)
  }

  /**
   * Approve a submitted requisition
   * 
   * Approves a requisition, allowing it to be fulfilled.
   * Only submitted requisitions can be approved.
   * 
   * @param requisitionId - ID of requisition to approve
   * @param approvedById - ID of user approving the requisition
   * @returns Result with void or error
   */
  async approveRequisition(
    requisitionId: UniqueEntityID,
    approvedById: UniqueEntityID,
  ): Promise<Result<void>> {
    const requisitionResult = await this.requisitionRepository.findById(requisitionId)
    if (!requisitionResult.isSuccess || !requisitionResult.value) {
      return Result.fail('Requisition not found')
    }

    const requisition = requisitionResult.value
    const approveResult = requisition.approve(approvedById)
    if (!approveResult.isSuccess) {
      return Result.fail(approveResult.error || 'Failed to approve requisition')
    }

    const saveResult = await this.requisitionRepository.save(requisition)
    if (!saveResult.isSuccess) {
      return Result.fail(saveResult.error || 'Failed to save requisition')
    }

    return Result.ok(undefined as void)
  }

  /**
   * Reject a submitted requisition
   * 
   * Rejects a requisition with a reason.
   * Only submitted requisitions can be rejected.
   * 
   * @param requisitionId - ID of requisition to reject
   * @param rejectedById - ID of user rejecting the requisition
   * @param reason - Reason for rejection
   * @returns Result with void or error
   */
  async rejectRequisition(
    requisitionId: UniqueEntityID,
    rejectedById: UniqueEntityID,
    reason: string,
  ): Promise<Result<void>> {
    const requisitionResult = await this.requisitionRepository.findById(requisitionId)
    if (!requisitionResult.isSuccess || !requisitionResult.value) {
      return Result.fail('Requisition not found')
    }

    const requisition = requisitionResult.value
    const rejectResult = requisition.reject(rejectedById, reason)
    if (!rejectResult.isSuccess) {
      return Result.fail(rejectResult.error || 'Failed to reject requisition')
    }

    const saveResult = await this.requisitionRepository.save(requisition)
    if (!saveResult.isSuccess) {
      return Result.fail(saveResult.error || 'Failed to save requisition')
    }

    return Result.ok(undefined as void)
  }

  /**
   * Fulfill a requisition item
   * 
   * Records fulfillment of a specific item in a requisition.
   * Creates a stock movement record for tracking.
   * Updates requisition status to 'partially-fulfilled' or 'fulfilled'.
   * 
   * @param requisitionId - ID of requisition
   * @param itemId - ID of item to fulfill
   * @param quantity - Quantity fulfilled
   * @param fulfilledById - ID of user fulfilling the item
   * @param fromLocationId - Source location for fulfillment
   * @param batchNumber - Optional batch number for tracking
   * @param notes - Optional notes about fulfillment
   * @returns Result with void or error
   */
  async fulfillRequisitionItem(
    requisitionId: UniqueEntityID,
    itemId: UniqueEntityID,
    quantity: number,
    fulfilledById: UniqueEntityID,
    fromLocationId: UniqueEntityID,
    batchNumber?: string,
    notes?: string,
  ): Promise<Result<void>> {
    const requisitionResult = await this.requisitionRepository.findById(requisitionId)
    if (!requisitionResult.isSuccess || !requisitionResult.value) {
      return Result.fail('Requisition not found')
    }

    const requisition = requisitionResult.value
    const fulfillResult = requisition.fulfillItem(itemId, quantity)
    if (!fulfillResult.isSuccess) {
      return Result.fail(fulfillResult.error || 'Failed to fulfill item')
    }

    // Find the item to get unit information
    const item = requisition.items.find(i => i.itemId.equals(itemId))
    if (!item) {
      return Result.fail('Item not found in requisition')
    }

    // Create stock movement record
    const movementResult = StockMovement.create({
      itemId,
      type: 'issue',
      quantity,
      unit: item.unit,
      fromLocationId,
      toLocationId: requisition.locationId,
      batchNumber,
      referenceType: 'requisition',
      referenceId: requisitionId,
      userId: fulfilledById,
      notes,
      timestamp: new Date(),
      createdAt: new Date(),
    })

    if (!movementResult.isSuccess || !movementResult.value) {
      return Result.fail(movementResult.error || 'Failed to create stock movement')
    }

    const saveMovementResult = await this.stockMovementRepository.save(movementResult.value)
    if (!saveMovementResult.isSuccess) {
      return Result.fail(saveMovementResult.error || 'Failed to save stock movement')
    }

    const saveResult = await this.requisitionRepository.save(requisition)
    if (!saveResult.isSuccess) {
      return Result.fail(saveResult.error || 'Failed to save requisition')
    }

    return Result.ok(undefined as void)
  }

  /**
   * Get requisitions by project
   * 
   * Retrieves all requisitions associated with a specific project.
   * 
   * @param projectId - ID of project
   * @returns Result with array of MaterialRequisition or error
   */
  async getRequisitionsByProject(projectId: UniqueEntityID): Promise<Result<MaterialRequisition[]>> {
    return await this.requisitionRepository.findByProject(projectId)
  }

  /**
   * Get pending approval requisitions
   * 
   * Retrieves all requisitions in 'submitted' status waiting for approval.
   * 
   * @returns Result with array of MaterialRequisition or error
   */
  async getPendingApprovals(): Promise<Result<MaterialRequisition[]>> {
    return await this.requisitionRepository.findPendingApproval()
  }

  /**
   * Get overdue requisitions
   * 
   * Retrieves all requisitions that have passed their required date
   * without being fulfilled or cancelled.
   * 
   * @returns Result with array of MaterialRequisition or error
   */
  async getOverdueRequisitions(): Promise<Result<MaterialRequisition[]>> {
    return await this.requisitionRepository.findOverdue()
  }

  /**
   * Get requisition fulfillment status
   * 
   * Provides detailed fulfillment information for a requisition including:
   * - Overall fulfillment percentage
   * - Item-level fulfillment details
   * - Remaining quantities
   * 
   * @param requisitionId - ID of requisition
   * @returns Result with RequisitionFulfillmentStatus or error
   */
  async getRequisitionFulfillmentStatus(
    requisitionId: UniqueEntityID,
  ): Promise<Result<RequisitionFulfillmentStatus>> {
    const requisitionResult = await this.requisitionRepository.findById(requisitionId)
    if (!requisitionResult.isSuccess || !requisitionResult.value) {
      return Result.fail('Requisition not found')
    }

    const requisition = requisitionResult.value
    const fulfillmentPercentage = requisition.getFulfillmentPercentage()
    const unfulfilledItems = requisition.getUnfulfilledItems()

    const status: RequisitionFulfillmentStatus = {
      requisitionId: requisitionId.toString(),
      requisitionNumber: requisition.requisitionNumber,
      status: requisition.status,
      fulfillmentPercentage,
      totalItems: requisition.items.length,
      fulfilledItems: requisition.items.filter(i => i.fulfilledQuantity >= i.requestedQuantity).length,
      unfulfilledItems: unfulfilledItems.map(item => ({
        itemId: item.itemId.toString(),
        itemName: item.itemName,
        sku: item.sku,
        requestedQuantity: item.requestedQuantity,
        fulfilledQuantity: item.fulfilledQuantity,
        remainingQuantity: item.requestedQuantity - item.fulfilledQuantity,
      })),
    }

    return Result.ok(status)
  }
}
