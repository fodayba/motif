import {
  Email,
  Money,
  PhoneNumber,
  Result,
  UniqueEntityID,
} from '@domain/shared'
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderNumber,
  Vendor,
  VendorProfile,
  type PurchaseOrderRepository,
  type PurchaseOrderStatus,
  type VendorRepository,
  type VendorStatus,
} from '@domain/procurement'
import type { CurrencyCode } from '@domain/shared'
import {
  type InventoryGateway,
  type InventoryAvailability,
} from './inventory-gateway'
import type { RequisitionRepository } from './requisition-repository'
import {
  type PurchaseRequisitionRecord,
  type RequisitionItemInput,
  type RequisitionItemRecord,
  type RequisitionStatus,
  type SourcingSuggestion,
  type VendorMatch,
  type AvailabilitySnapshot,
} from './types'

export type VendorProfileInput = {
  legalName: string
  taxId?: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  website?: string
}

export type VendorCapabilityInput = {
  category: string
  certifications?: string[]
}

export type RegisterVendorInput = {
  profile: VendorProfileInput
  paymentTerms: string
  capabilities?: VendorCapabilityInput[]
}

export type UpdateVendorStatusInput = {
  vendorId: string
  status: VendorStatus
}

export type RecordVendorPerformanceInput = {
  vendorId: string
  onTimeDeliveryRate?: number
  qualityScore?: number
  disputeCount?: number
  rating?: number
}

export type PurchaseOrderItemInput = {
  referenceId: string
  description: string
  quantity: number
  unitOfMeasure: string
  unitCost: { amount: number; currency: CurrencyCode }
  expectedDate?: Date
}

export type CreatePurchaseOrderInput = {
  number: string
  vendorId: string
  projectId: string
  status?: PurchaseOrderStatus
  orderDate: Date
  expectedDate?: Date
  currency: CurrencyCode
  notes?: string
  items: PurchaseOrderItemInput[]
}

export type UpdatePurchaseOrderStatusInput = {
  purchaseOrderId: string
  status: PurchaseOrderStatus
}

export type SubmitRequisitionInput = {
  projectId: string
  requesterId: string
  deliveryLocationId: string
  deliveryLocationName: string
  requisitionNumber: string
  justification?: string
  currency: CurrencyCode
  items: RequisitionItemInput[]
}

export type ConvertRequisitionInput = {
  requisitionId: string
  vendorId: string
  purchaseOrder: Omit<CreatePurchaseOrderInput, 'vendorId' | 'projectId'> & {
    projectId?: string
  }
}

export class ProcurementService {
  private readonly vendorRepository: VendorRepository
  private readonly purchaseOrderRepository: PurchaseOrderRepository
  private readonly requisitionRepository: RequisitionRepository
  private readonly inventoryGateway?: InventoryGateway

  constructor(params: {
    vendorRepository: VendorRepository
    purchaseOrderRepository: PurchaseOrderRepository
    requisitionRepository: RequisitionRepository
    inventoryGateway?: InventoryGateway
  }) {
    this.vendorRepository = params.vendorRepository
    this.purchaseOrderRepository = params.purchaseOrderRepository
    this.requisitionRepository = params.requisitionRepository
    this.inventoryGateway = params.inventoryGateway
  }

  async registerVendor(input: RegisterVendorInput): Promise<Result<Vendor>> {
    const emailResult = Email.create(input.profile.contactEmail)
    if (!emailResult.isSuccess || !emailResult.value) {
      return Result.fail(emailResult.error ?? 'invalid contact email')
    }

    let phoneResult: Result<PhoneNumber> | undefined
    if (input.profile.contactPhone) {
      phoneResult = PhoneNumber.create(input.profile.contactPhone)
      if (!phoneResult.isSuccess || !phoneResult.value) {
        return Result.fail(phoneResult.error ?? 'invalid contact phone')
      }
    }

    const profileResult = VendorProfile.create({
      legalName: input.profile.legalName,
      taxId: input.profile.taxId,
      contactName: input.profile.contactName,
      contactEmail: emailResult.value,
      contactPhone: phoneResult?.value,
      website: input.profile.website,
    })

    if (!profileResult.isSuccess || !profileResult.value) {
      return Result.fail(profileResult.error ?? 'invalid vendor profile')
    }

    const capabilities = (input.capabilities ?? []).map((capability) => ({
      category: capability.category.trim(),
      certifications: capability.certifications?.map((cert) => cert.trim()),
    }))

    const now = new Date()

    const vendorResult = Vendor.create({
      profile: profileResult.value,
      status: 'onboarding',
      rating: 0,
      capabilities,
      paymentTerms: input.paymentTerms,
      performance: {
        onTimeDeliveryRate: 0,
        qualityScore: 0,
        disputeCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    })

    if (!vendorResult.isSuccess || !vendorResult.value) {
      return Result.fail(vendorResult.error ?? 'failed to create vendor')
    }

    const vendor = vendorResult.value
    await this.vendorRepository.save(vendor)

    return Result.ok(vendor)
  }

  async updateVendorStatus(
    input: UpdateVendorStatusInput,
  ): Promise<Result<Vendor>> {
    const idResult = this.parseUniqueId(input.vendorId, 'vendorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid vendorId')
    }

    const vendor = await this.vendorRepository.findById(idResult.value)
    if (!vendor) {
      return Result.fail('vendor not found')
    }

    vendor.updateStatus(input.status)
    await this.vendorRepository.save(vendor)

    return Result.ok(vendor)
  }

  async recordVendorPerformance(
    input: RecordVendorPerformanceInput,
  ): Promise<Result<Vendor>> {
    const idResult = this.parseUniqueId(input.vendorId, 'vendorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid vendorId')
    }

    const vendor = await this.vendorRepository.findById(idResult.value)
    if (!vendor) {
      return Result.fail('vendor not found')
    }

    if (input.rating !== undefined) {
      vendor.updateRating(input.rating)
    }

    vendor.updatePerformance({
      onTimeDeliveryRate: input.onTimeDeliveryRate,
      qualityScore: input.qualityScore,
      disputeCount: input.disputeCount,
    })

    await this.vendorRepository.save(vendor)

    return Result.ok(vendor)
  }

  async createPurchaseOrder(
    input: CreatePurchaseOrderInput,
  ): Promise<Result<PurchaseOrder>> {
    const vendorIdResult = this.parseUniqueId(input.vendorId, 'vendorId')
    if (!vendorIdResult.isSuccess || !vendorIdResult.value) {
      return Result.fail(vendorIdResult.error ?? 'invalid vendorId')
    }

    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const vendor = await this.vendorRepository.findById(vendorIdResult.value)
    if (!vendor) {
      return Result.fail('vendor not found')
    }

    if (input.items.length === 0) {
      return Result.fail('purchase order must contain at least one item')
    }

    const numberResult = PurchaseOrderNumber.create(input.number)
    if (!numberResult.isSuccess || !numberResult.value) {
      return Result.fail(numberResult.error ?? 'invalid purchase order number')
    }

    const itemResults: PurchaseOrderItem[] = []

    for (const item of input.items) {
      const referenceIdResult = this.parseUniqueId(item.referenceId, 'item.referenceId')
      if (!referenceIdResult.isSuccess || !referenceIdResult.value) {
        return Result.fail(referenceIdResult.error ?? 'invalid referenceId')
      }

      const unitCostResult = Money.create(
        item.unitCost.amount,
        item.unitCost.currency,
      )

      if (!unitCostResult.isSuccess || !unitCostResult.value) {
        return Result.fail(unitCostResult.error ?? 'invalid unit cost')
      }

      const poItemResult = PurchaseOrderItem.create({
        referenceId: referenceIdResult.value,
        description: item.description,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        unitCost: unitCostResult.value,
        expectedDate: item.expectedDate,
      })

      if (!poItemResult.isSuccess || !poItemResult.value) {
        return Result.fail(poItemResult.error ?? 'invalid purchase order item')
      }

      itemResults.push(poItemResult.value)
    }

    const now = new Date()

    const poResult = PurchaseOrder.create({
      number: numberResult.value,
      vendorId: vendor.id,
      projectId: projectIdResult.value,
      status: input.status ?? 'draft',
      orderDate: input.orderDate,
      expectedDate: input.expectedDate,
      currency: input.currency,
      items: itemResults,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    })

    if (!poResult.isSuccess || !poResult.value) {
      return Result.fail(poResult.error ?? 'failed to create purchase order')
    }

    const purchaseOrder = poResult.value
    await this.purchaseOrderRepository.save(purchaseOrder)

    return Result.ok(purchaseOrder)
  }

  async updatePurchaseOrderStatus(
    input: UpdatePurchaseOrderStatusInput,
  ): Promise<Result<PurchaseOrder>> {
    const idResult = this.parseUniqueId(input.purchaseOrderId, 'purchaseOrderId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid purchaseOrderId')
    }

    const purchaseOrder = await this.purchaseOrderRepository.findById(idResult.value)
    if (!purchaseOrder) {
      return Result.fail('purchase order not found')
    }

    purchaseOrder.updateStatus(input.status)
    await this.purchaseOrderRepository.save(purchaseOrder)

    return Result.ok(purchaseOrder)
  }

  async submitRequisition(
    input: SubmitRequisitionInput,
  ): Promise<Result<PurchaseRequisitionRecord>> {
    if (input.items.length === 0) {
      return Result.fail('requisition must include at least one item')
    }

    const requisitionId = await this.requisitionRepository.nextIdentity()
    const now = new Date()

    const evaluation = await this.evaluateItems(
      input.items,
      input.deliveryLocationId,
      input.deliveryLocationName,
    )

    const record: PurchaseRequisitionRecord = {
      id: requisitionId,
      requisitionNumber: input.requisitionNumber,
      projectId: input.projectId,
      requesterId: input.requesterId,
      deliveryLocationId: input.deliveryLocationId,
      deliveryLocationName: input.deliveryLocationName,
      justification: input.justification,
      status: 'submitted',
      currency: input.currency,
      items: evaluation.items,
      sourcingRecommendations: evaluation.recommendations,
      autoTransferRecommended: evaluation.autoTransferRecommended,
      interSiteReviewNotes: evaluation.interSiteReviewNotes,
      createdAt: now,
      updatedAt: now,
      availabilityVerifiedAt: evaluation.availabilityVerifiedAt,
    }

    await this.requisitionRepository.save(record)

    return Result.ok(record)
  }

  async getRequisitionById(
    requisitionId: string,
  ): Promise<Result<PurchaseRequisitionRecord>> {
    const record = await this.requisitionRepository.findById(requisitionId)
    if (!record) {
      return Result.fail('requisition not found')
    }

    return Result.ok(record)
  }

  async updateRequisitionStatus(
    requisitionId: string,
    status: RequisitionStatus,
  ): Promise<Result<PurchaseRequisitionRecord>> {
    const record = await this.requisitionRepository.findById(requisitionId)
    if (!record) {
      return Result.fail('requisition not found')
    }

    record.status = status
    record.updatedAt = new Date()
    await this.requisitionRepository.update(record)

    return Result.ok(record)
  }

  async recommendVendorsForRequisition(
    requisitionId: string,
  ): Promise<Result<VendorMatch[]>> {
    const record = await this.requisitionRepository.findById(requisitionId)
    if (!record) {
      return Result.fail('requisition not found')
    }

    const vendors = await this.vendorRepository.listActive()

    const scores = vendors.map((vendor) => {
      const capabilities = vendor.capabilities.map((capability) => capability.category)
      const matchedCategories = new Set<string>()

      for (const item of record.items) {
        if (!item.category) {
          continue
        }

        if (capabilities.includes(item.category)) {
          matchedCategories.add(item.category)
        }
      }

      const score = matchedCategories.size / Math.max(record.items.length, 1)

      return {
        vendorId: vendor.id.toString(),
        score,
        capabilities: Array.from(matchedCategories),
      }
    })

    const sorted = scores
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)

    return Result.ok(sorted)
  }

  async convertRequisitionToPurchaseOrder(
    input: ConvertRequisitionInput,
  ): Promise<Result<{ requisition: PurchaseRequisitionRecord; purchaseOrder: PurchaseOrder }>> {
    const requisitionResult = await this.requisitionRepository.findById(
      input.requisitionId,
    )

    if (!requisitionResult) {
      return Result.fail('requisition not found')
    }

    if (requisitionResult.status === 'converted') {
      return Result.fail('requisition already converted')
    }

    const vendorIdResult = this.parseUniqueId(input.vendorId, 'vendorId')
    if (!vendorIdResult.isSuccess || !vendorIdResult.value) {
      return Result.fail(vendorIdResult.error ?? 'invalid vendorId')
    }

    const vendor = await this.vendorRepository.findById(vendorIdResult.value)
    if (!vendor) {
      return Result.fail('vendor not found')
    }

    const projectId = input.purchaseOrder.projectId ?? requisitionResult.projectId
    const poInput: CreatePurchaseOrderInput = {
      ...input.purchaseOrder,
      vendorId: vendor.id.toString(),
      projectId,
      items: input.purchaseOrder.items,
    }

    const poResult = await this.createPurchaseOrder(poInput)
    if (!poResult.isSuccess || !poResult.value) {
      return Result.fail(poResult.error ?? 'failed to create purchase order')
    }

    requisitionResult.status = 'converted'
    requisitionResult.updatedAt = new Date()
    await this.requisitionRepository.update(requisitionResult)

    return Result.ok({ requisition: requisitionResult, purchaseOrder: poResult.value })
  }

  private async evaluateItems(
    items: RequisitionItemInput[],
    deliveryLocationId: string,
    deliveryLocationName: string,
  ): Promise<{
    items: RequisitionItemRecord[]
    recommendations: Array<SourcingSuggestion | null>
    autoTransferRecommended: boolean
    interSiteReviewNotes?: string
    availabilityVerifiedAt: Date
  }> {
    const availabilityVerifiedAt = new Date()

    if (!this.inventoryGateway) {
      const records = items.map((item) => this.buildItemRecord(item))
      return {
        items: records,
        recommendations: records.map((record) => record.suggestion ?? null),
        autoTransferRecommended: false,
        availabilityVerifiedAt,
        interSiteReviewNotes: undefined,
      }
    }

    const records: RequisitionItemRecord[] = []
    const recommendations: Array<SourcingSuggestion | null> = []
    const reviewNotes: string[] = []
    let autoTransferRecommended = false

    for (const item of items) {
      const record = this.buildItemRecord(item)

      if (item.itemId) {
        const availability = await this.inventoryGateway.getAvailability({
          itemId: item.itemId,
          locationId: deliveryLocationId,
        })

        if (availability) {
          const suggestion = this.buildSuggestion(item, availability)
          record.availability = this.mapAvailability(
            item,
            availability,
            deliveryLocationId,
            deliveryLocationName,
          )
          record.suggestion = suggestion
          if (suggestion?.recommendedTransferQuantity && suggestion.recommendedTransferQuantity > 0) {
            autoTransferRecommended = true
            reviewNotes.push(
              `${item.itemName}: recommend transfer of ${suggestion.recommendedTransferQuantity} units from alternative site`,
            )
          }
          recommendations.push(suggestion ?? null)
        } else {
          record.availability = {
            locationId: deliveryLocationId,
            locationName: deliveryLocationName,
            availableQuantity: 0,
            deficitQuantity: item.quantity,
            alternativeSites: [],
            notes: 'Inventory availability data unavailable.',
          }
          record.suggestion = null
          recommendations.push(null)
        }
      } else {
        record.availability = {
          locationId: deliveryLocationId,
          locationName: deliveryLocationName,
          availableQuantity: 0,
          deficitQuantity: item.quantity,
          alternativeSites: [],
          notes: 'Item not linked to inventory catalogue.',
        }
        record.suggestion = null
        recommendations.push(null)
      }

      records.push(record)
    }

    return {
      items: records,
      recommendations,
      autoTransferRecommended,
      availabilityVerifiedAt,
      interSiteReviewNotes: reviewNotes.length ? reviewNotes.join('\n') : undefined,
    }
  }

  private buildItemRecord(item: RequisitionItemInput): RequisitionItemRecord {
    return {
      id: crypto.randomUUID(),
      itemId: item.itemId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      description: item.description,
      quantity: item.quantity,
      unitOfMeasure: item.unitOfMeasure,
      requiredBy: item.requiredBy,
      category: item.category,
      unitCost: item.unitCost,
      availability: undefined,
      suggestion: null,
    }
  }

  private buildSuggestion(
    item: RequisitionItemInput,
    availability: InventoryAvailability,
  ): SourcingSuggestion | null {
    const deficit = Math.max(item.quantity - availability.availableQuantity, 0)
    if (deficit === 0) {
      return {
        vendorId: undefined,
        recommendedTransferQuantity: 0,
        notes: 'Sufficient inventory on hand at requested site.',
      }
    }

    const alternative = availability.alternativeSites.find(
      (site) => site.availableQuantity > 0,
    )

    if (alternative) {
      return {
        vendorId: undefined,
        recommendedTransferQuantity: Math.min(deficit, alternative.availableQuantity),
        notes: `Transfer from ${alternative.locationName}`,
      }
    }

    return {
      vendorId: undefined,
      recommendedTransferQuantity: 0,
      notes: 'No internal inventory available; proceed to external sourcing.',
    }
  }

  private mapAvailability(
    item: RequisitionItemInput,
    availability: InventoryAvailability,
    deliveryLocationId: string,
    deliveryLocationName: string,
  ): AvailabilitySnapshot {
    const deficit = Math.max(item.quantity - availability.availableQuantity, 0)

    return {
      locationId: deliveryLocationId,
      locationName: deliveryLocationName,
      availableQuantity: availability.availableQuantity,
      deficitQuantity: deficit,
      alternativeSites: availability.alternativeSites.map((site) => ({
        locationId: site.locationId,
        locationName: site.locationName,
        availableQuantity: site.availableQuantity,
      })),
      notes: deficit > 0 ? 'Insufficient stock at requesting location.' : 'Stock available at requesting location.',
    }
  }

  private parseUniqueId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }
}
