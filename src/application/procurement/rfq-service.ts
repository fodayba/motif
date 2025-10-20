import { Money, Result, UniqueEntityID } from '@domain/shared'
import {
  RFQ,
  type RFQRepository,
  type RFQStatus,
  type RFQType,
  type VendorBid,
  type BidItem,
} from '@domain/procurement'
import type { CurrencyCode } from '@domain/shared'

export type RFQItemInput = {
  description: string
  quantity: number
  unitOfMeasure: string
  specifications?: string
}

export type CreateRFQInput = {
  rfqNumber: string
  title: string
  description: string
  type: RFQType
  projectId: string
  items: RFQItemInput[]
  createdBy: string
}

export type PublishRFQInput = {
  rfqId: string
  closeDate: Date
  vendorIds?: string[]
}

export type SubmitBidInput = {
  rfqId: string
  vendorId: string
  vendorName: string
  totalAmount: number
  currency: CurrencyCode
  deliveryDays: number
  items: {
    rfqItemId: string
    unitPrice: number
    leadTimeDays: number
    notes?: string
  }[]
  notes?: string
  attachments?: string[]
}

export type AwardBidInput = {
  rfqId: string
  vendorId: string
}

export type BidComparison = {
  rfqId: string
  rfqNumber: string
  rfqTitle: string
  bids: Array<{
    vendorId: string
    vendorName: string
    totalAmount: Money
    deliveryDays: number
    submittedAt: Date
    itemCount: number
    notes?: string
  }>
  lowestBid?: {
    vendorId: string
    vendorName: string
    amount: Money
  }
  fastestDelivery?: {
    vendorId: string
    vendorName: string
    days: number
  }
}

export class RFQService {
  private readonly rfqRepository: RFQRepository

  constructor(params: { rfqRepository: RFQRepository }) {
    this.rfqRepository = params.rfqRepository
  }

  async createRFQ(input: CreateRFQInput): Promise<Result<RFQ>> {
    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const createdByResult = this.parseUniqueId(input.createdBy, 'createdBy')
    if (!createdByResult.isSuccess || !createdByResult.value) {
      return Result.fail(createdByResult.error ?? 'invalid createdBy')
    }

    if (input.items.length === 0) {
      return Result.fail('RFQ must contain at least one item')
    }

    const items = input.items.map((item, index) => ({
      id: `item-${index + 1}`,
      description: item.description,
      quantity: item.quantity,
      unitOfMeasure: item.unitOfMeasure,
      specifications: item.specifications,
    }))

    const now = new Date()

    const rfqResult = RFQ.create({
      rfqNumber: input.rfqNumber,
      title: input.title,
      description: input.description,
      type: input.type,
      projectId: projectIdResult.value,
      status: 'draft',
      items,
      bids: [],
      createdBy: createdByResult.value,
      createdAt: now,
      updatedAt: now,
    })

    if (!rfqResult.isSuccess || !rfqResult.value) {
      return Result.fail(rfqResult.error ?? 'failed to create RFQ')
    }

    const rfq = rfqResult.value
    await this.rfqRepository.save(rfq)

    return Result.ok(rfq)
  }

  async publishRFQ(input: PublishRFQInput): Promise<Result<RFQ>> {
    const idResult = this.parseUniqueId(input.rfqId, 'rfqId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid rfqId')
    }

    const rfq = await this.rfqRepository.findById(idResult.value)
    if (!rfq) {
      return Result.fail('RFQ not found')
    }

    try {
      rfq.publish(input.closeDate)
      await this.rfqRepository.save(rfq)

      // TODO: Send notifications to vendors if vendorIds provided

      return Result.ok(rfq)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to publish RFQ')
    }
  }

  async submitBid(input: SubmitBidInput): Promise<Result<RFQ>> {
    const rfqIdResult = this.parseUniqueId(input.rfqId, 'rfqId')
    if (!rfqIdResult.isSuccess || !rfqIdResult.value) {
      return Result.fail(rfqIdResult.error ?? 'invalid rfqId')
    }

    const vendorIdResult = this.parseUniqueId(input.vendorId, 'vendorId')
    if (!vendorIdResult.isSuccess || !vendorIdResult.value) {
      return Result.fail(vendorIdResult.error ?? 'invalid vendorId')
    }

    const rfq = await this.rfqRepository.findById(rfqIdResult.value)
    if (!rfq) {
      return Result.fail('RFQ not found')
    }

    const totalAmountResult = Money.create(input.totalAmount, input.currency)
    if (!totalAmountResult.isSuccess || !totalAmountResult.value) {
      return Result.fail(totalAmountResult.error ?? 'invalid total amount')
    }

    const bidItems: BidItem[] = []
    for (const item of input.items) {
      const unitPriceResult = Money.create(item.unitPrice, input.currency)
      if (!unitPriceResult.isSuccess || !unitPriceResult.value) {
        return Result.fail(unitPriceResult.error ?? 'invalid unit price')
      }

      bidItems.push({
        rfqItemId: item.rfqItemId,
        unitPrice: unitPriceResult.value,
        leadTimeDays: item.leadTimeDays,
        notes: item.notes,
      })
    }

    const bid: VendorBid = {
      vendorId: vendorIdResult.value,
      vendorName: input.vendorName,
      submittedAt: new Date(),
      totalAmount: totalAmountResult.value,
      deliveryDays: input.deliveryDays,
      items: bidItems,
      notes: input.notes,
      attachments: input.attachments,
    }

    try {
      rfq.addBid(bid)
      await this.rfqRepository.save(rfq)

      return Result.ok(rfq)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to submit bid')
    }
  }

  async closeRFQ(rfqId: string): Promise<Result<RFQ>> {
    const idResult = this.parseUniqueId(rfqId, 'rfqId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid rfqId')
    }

    const rfq = await this.rfqRepository.findById(idResult.value)
    if (!rfq) {
      return Result.fail('RFQ not found')
    }

    try {
      rfq.close()
      await this.rfqRepository.save(rfq)

      return Result.ok(rfq)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to close RFQ')
    }
  }

  async awardBid(input: AwardBidInput): Promise<Result<RFQ>> {
    const rfqIdResult = this.parseUniqueId(input.rfqId, 'rfqId')
    if (!rfqIdResult.isSuccess || !rfqIdResult.value) {
      return Result.fail(rfqIdResult.error ?? 'invalid rfqId')
    }

    const vendorIdResult = this.parseUniqueId(input.vendorId, 'vendorId')
    if (!vendorIdResult.isSuccess || !vendorIdResult.value) {
      return Result.fail(vendorIdResult.error ?? 'invalid vendorId')
    }

    const rfq = await this.rfqRepository.findById(rfqIdResult.value)
    if (!rfq) {
      return Result.fail('RFQ not found')
    }

    try {
      rfq.awardBid(vendorIdResult.value)
      await this.rfqRepository.save(rfq)

      return Result.ok(rfq)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to award bid')
    }
  }

  async cancelRFQ(rfqId: string): Promise<Result<RFQ>> {
    const idResult = this.parseUniqueId(rfqId, 'rfqId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid rfqId')
    }

    const rfq = await this.rfqRepository.findById(idResult.value)
    if (!rfq) {
      return Result.fail('RFQ not found')
    }

    try {
      rfq.cancel()
      await this.rfqRepository.save(rfq)

      return Result.ok(rfq)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to cancel RFQ')
    }
  }

  async getRFQById(rfqId: string): Promise<Result<RFQ>> {
    const idResult = this.parseUniqueId(rfqId, 'rfqId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid rfqId')
    }

    const rfq = await this.rfqRepository.findById(idResult.value)
    if (!rfq) {
      return Result.fail('RFQ not found')
    }

    return Result.ok(rfq)
  }

  async listRFQsByProject(projectId: string): Promise<Result<RFQ[]>> {
    const idResult = this.parseUniqueId(projectId, 'projectId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid projectId')
    }

    const rfqs = await this.rfqRepository.findByProject(idResult.value)
    return Result.ok(rfqs)
  }

  async listRFQsByStatus(status: RFQStatus): Promise<Result<RFQ[]>> {
    const rfqs = await this.rfqRepository.findByStatus(status)
    return Result.ok(rfqs)
  }

  async listOpenRFQs(): Promise<Result<RFQ[]>> {
    const rfqs = await this.rfqRepository.listOpen()
    return Result.ok(rfqs)
  }

  async compareBids(rfqId: string): Promise<Result<BidComparison>> {
    const idResult = this.parseUniqueId(rfqId, 'rfqId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid rfqId')
    }

    const rfq = await this.rfqRepository.findById(idResult.value)
    if (!rfq) {
      return Result.fail('RFQ not found')
    }

    if (rfq.bids.length === 0) {
      return Result.fail('no bids to compare')
    }

    const bids = rfq.bids.map((bid) => ({
      vendorId: bid.vendorId.toString(),
      vendorName: bid.vendorName,
      totalAmount: bid.totalAmount,
      deliveryDays: bid.deliveryDays,
      submittedAt: bid.submittedAt,
      itemCount: bid.items.length,
      notes: bid.notes,
    }))

    const lowestBid = bids.reduce((lowest, current) => {
      return current.totalAmount.amount < lowest.totalAmount.amount ? current : lowest
    })

    const fastestDelivery = bids.reduce((fastest, current) => {
      return current.deliveryDays < fastest.deliveryDays ? current : fastest
    })

    const comparison: BidComparison = {
      rfqId: rfq.id.toString(),
      rfqNumber: rfq.rfqNumber,
      rfqTitle: rfq.title,
      bids,
      lowestBid: {
        vendorId: lowestBid.vendorId,
        vendorName: lowestBid.vendorName,
        amount: lowestBid.totalAmount,
      },
      fastestDelivery: {
        vendorId: fastestDelivery.vendorId,
        vendorName: fastestDelivery.vendorName,
        days: fastestDelivery.deliveryDays,
      },
    }

    return Result.ok(comparison)
  }

  private parseUniqueId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }
}
