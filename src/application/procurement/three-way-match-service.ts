import { Money, Result, UniqueEntityID, type CurrencyCode } from '@domain/shared'
import {
  ThreeWayMatch,
  type GoodsReceipt,
  type GoodsReceiptRepository,
  type Invoice,
  type InvoiceRepository,
  type PurchaseOrder,
  type PurchaseOrderRepository,
  type ThreeWayMatchRepository,
  type ThreeWayMatchStatus,
  type LineItemMatch,
  type DiscrepancyType,
} from '@domain/procurement'

export type PerformThreeWayMatchInput = {
  purchaseOrderId: string
  goodsReceiptId: string
  invoiceId: string
  tolerancePercentage?: number
}

export type ReviewMatchInput = {
  matchId: string
  reviewedBy: string
  reviewedByName: string
  notes?: string
}

export type ApproveMatchInput = {
  matchId: string
  approvedBy: string
  approvedByName: string
}

export type RejectMatchInput = {
  matchId: string
  reason: string
}

export type MatchStatistics = {
  totalMatches: number
  matchedCount: number
  discrepancyCount: number
  approvedCount: number
  rejectedCount: number
  averageVariancePercentage: number
  matchRate: number
}

export class ThreeWayMatchService {
  private readonly purchaseOrderRepository: PurchaseOrderRepository
  private readonly goodsReceiptRepository: GoodsReceiptRepository
  private readonly invoiceRepository: InvoiceRepository
  private readonly matchRepository: ThreeWayMatchRepository

  constructor(params: {
    purchaseOrderRepository: PurchaseOrderRepository
    goodsReceiptRepository: GoodsReceiptRepository
    invoiceRepository: InvoiceRepository
    matchRepository: ThreeWayMatchRepository
  }) {
    this.purchaseOrderRepository = params.purchaseOrderRepository
    this.goodsReceiptRepository = params.goodsReceiptRepository
    this.invoiceRepository = params.invoiceRepository
    this.matchRepository = params.matchRepository
  }

  async performThreeWayMatch(
    input: PerformThreeWayMatchInput,
  ): Promise<Result<ThreeWayMatch>> {
    // Parse IDs
    const poIdResult = this.parseUniqueId(input.purchaseOrderId, 'purchaseOrderId')
    if (!poIdResult.isSuccess || !poIdResult.value) {
      return Result.fail(poIdResult.error ?? 'invalid purchaseOrderId')
    }

    const grIdResult = this.parseUniqueId(input.goodsReceiptId, 'goodsReceiptId')
    if (!grIdResult.isSuccess || !grIdResult.value) {
      return Result.fail(grIdResult.error ?? 'invalid goodsReceiptId')
    }

    const invoiceIdResult = this.parseUniqueId(input.invoiceId, 'invoiceId')
    if (!invoiceIdResult.isSuccess || !invoiceIdResult.value) {
      return Result.fail(invoiceIdResult.error ?? 'invalid invoiceId')
    }

    // Fetch documents
    const purchaseOrder = await this.purchaseOrderRepository.findById(poIdResult.value)
    if (!purchaseOrder) {
      return Result.fail('purchase order not found')
    }

    const goodsReceipt = await this.goodsReceiptRepository.findById(grIdResult.value)
    if (!goodsReceipt) {
      return Result.fail('goods receipt not found')
    }

    const invoice = await this.invoiceRepository.findById(invoiceIdResult.value)
    if (!invoice) {
      return Result.fail('invoice not found')
    }

    // Verify they're all for the same PO
    if (!goodsReceipt.purchaseOrderId.equals(purchaseOrder.id)) {
      return Result.fail('goods receipt does not match purchase order')
    }

    if (!invoice.purchaseOrderId.equals(purchaseOrder.id)) {
      return Result.fail('invoice does not match purchase order')
    }

    // Check if match already exists
    const existingMatch = await this.matchRepository.findByPurchaseOrder(purchaseOrder.id)
    if (existingMatch) {
      return Result.fail('three-way match already exists for this purchase order')
    }

    // Perform matching logic
    const matchResult = this.matchDocuments(
      purchaseOrder,
      goodsReceipt,
      invoice,
      input.tolerancePercentage ?? 5,
    )

    if (!matchResult.isSuccess || !matchResult.value) {
      return Result.fail(matchResult.error ?? 'failed to perform match')
    }

    const match = matchResult.value

    try {
      match.performMatch()
      await this.matchRepository.save(match)

      return Result.ok(match)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to save three-way match',
      )
    }
  }

  async reviewMatch(input: ReviewMatchInput): Promise<Result<ThreeWayMatch>> {
    const matchIdResult = this.parseUniqueId(input.matchId, 'matchId')
    if (!matchIdResult.isSuccess || !matchIdResult.value) {
      return Result.fail(matchIdResult.error ?? 'invalid matchId')
    }

    const reviewedByResult = this.parseUniqueId(input.reviewedBy, 'reviewedBy')
    if (!reviewedByResult.isSuccess || !reviewedByResult.value) {
      return Result.fail(reviewedByResult.error ?? 'invalid reviewedBy')
    }

    const match = await this.matchRepository.findById(matchIdResult.value)
    if (!match) {
      return Result.fail('three-way match not found')
    }

    try {
      match.review(reviewedByResult.value, input.reviewedByName, input.notes)
      await this.matchRepository.save(match)

      return Result.ok(match)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to review match')
    }
  }

  async approveMatch(input: ApproveMatchInput): Promise<Result<ThreeWayMatch>> {
    const matchIdResult = this.parseUniqueId(input.matchId, 'matchId')
    if (!matchIdResult.isSuccess || !matchIdResult.value) {
      return Result.fail(matchIdResult.error ?? 'invalid matchId')
    }

    const approvedByResult = this.parseUniqueId(input.approvedBy, 'approvedBy')
    if (!approvedByResult.isSuccess || !approvedByResult.value) {
      return Result.fail(approvedByResult.error ?? 'invalid approvedBy')
    }

    const match = await this.matchRepository.findById(matchIdResult.value)
    if (!match) {
      return Result.fail('three-way match not found')
    }

    try {
      match.approve(approvedByResult.value, input.approvedByName)
      await this.matchRepository.save(match)

      // Update invoice status to approved
      const invoice = await this.invoiceRepository.findById(match.invoiceId)
      if (invoice && invoice.status === 'submitted') {
        invoice.approve(approvedByResult.value, input.approvedByName)
        await this.invoiceRepository.save(invoice)
      }

      return Result.ok(match)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to approve match')
    }
  }

  async rejectMatch(input: RejectMatchInput): Promise<Result<ThreeWayMatch>> {
    const matchIdResult = this.parseUniqueId(input.matchId, 'matchId')
    if (!matchIdResult.isSuccess || !matchIdResult.value) {
      return Result.fail(matchIdResult.error ?? 'invalid matchId')
    }

    const match = await this.matchRepository.findById(matchIdResult.value)
    if (!match) {
      return Result.fail('three-way match not found')
    }

    try {
      match.reject(input.reason)
      await this.matchRepository.save(match)

      // Update invoice status to rejected
      const invoice = await this.invoiceRepository.findById(match.invoiceId)
      if (invoice && invoice.status === 'submitted') {
        invoice.reject(input.reason)
        await this.invoiceRepository.save(invoice)
      }

      return Result.ok(match)
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'failed to reject match')
    }
  }

  async getMatchById(matchId: string): Promise<Result<ThreeWayMatch>> {
    const idResult = this.parseUniqueId(matchId, 'matchId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid matchId')
    }

    const match = await this.matchRepository.findById(idResult.value)
    if (!match) {
      return Result.fail('three-way match not found')
    }

    return Result.ok(match)
  }

  async listMatchesByProject(projectId: string): Promise<Result<ThreeWayMatch[]>> {
    const idResult = this.parseUniqueId(projectId, 'projectId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid projectId')
    }

    const matches = await this.matchRepository.findByProject(idResult.value)
    return Result.ok(matches)
  }

  async listMatchesByStatus(status: ThreeWayMatchStatus): Promise<Result<ThreeWayMatch[]>> {
    const matches = await this.matchRepository.findByStatus(status)
    return Result.ok(matches)
  }

  async listPendingMatches(): Promise<Result<ThreeWayMatch[]>> {
    const matches = await this.matchRepository.listPending()
    return Result.ok(matches)
  }

  async listMatchesWithDiscrepancies(): Promise<Result<ThreeWayMatch[]>> {
    const matches = await this.matchRepository.listWithDiscrepancies()
    return Result.ok(matches)
  }

  async getMatchStatistics(): Promise<Result<MatchStatistics>> {
    const allMatches = await this.matchRepository.listAll()

    const totalMatches = allMatches.length
    const matchedCount = allMatches.filter((m) => m.status === 'matched').length
    const discrepancyCount = allMatches.filter((m) => m.status === 'discrepancy').length
    const approvedCount = allMatches.filter((m) => m.status === 'approved').length
    const rejectedCount = allMatches.filter((m) => m.status === 'rejected').length

    const totalVariance = allMatches.reduce((sum, match) => {
      const variance = Math.abs(match.totalVariance.amount)
      const total = match.poTotal.amount
      return sum + (total > 0 ? (variance / total) * 100 : 0)
    }, 0)

    const averageVariancePercentage = totalMatches > 0 ? totalVariance / totalMatches : 0
    const matchRate =
      totalMatches > 0 ? ((matchedCount + approvedCount) / totalMatches) * 100 : 0

    const statistics: MatchStatistics = {
      totalMatches,
      matchedCount,
      discrepancyCount,
      approvedCount,
      rejectedCount,
      averageVariancePercentage,
      matchRate,
    }

    return Result.ok(statistics)
  }

  private matchDocuments(
    purchaseOrder: PurchaseOrder,
    goodsReceipt: GoodsReceipt,
    invoice: Invoice,
    tolerancePercentage: number,
  ): Result<ThreeWayMatch> {
    const lineItems: LineItemMatch[] = []
    const currency = purchaseOrder.currency as CurrencyCode
    let poTotal = Money.create(0, currency)
    let invoiceTotal = Money.create(0, invoice.total.currency)

    if (!poTotal.isSuccess || !poTotal.value) {
      return Result.fail('failed to create PO total')
    }

    if (!invoiceTotal.isSuccess || !invoiceTotal.value) {
      return Result.fail('failed to create invoice total')
    }

    // Match line items
    for (const poItem of purchaseOrder.items) {
      const grItem = goodsReceipt.items.find((item) =>
        item.purchaseOrderLineId.equals(poItem.lineId),
      )
      const invoiceItem = invoice.items.find((item) =>
        item.purchaseOrderLineId.equals(poItem.lineId),
      )

      const discrepancies: DiscrepancyType[] = []
      let matched = true

      const poQuantity = poItem.quantity
      const grQuantity = grItem?.acceptedQuantity ?? 0
      const invoiceQuantity = invoiceItem?.quantity ?? 0

      const poUnitPrice = poItem.unitCost
      const invoiceUnitPrice = invoiceItem?.unitPrice ?? poUnitPrice

      const poLineTotalAmount = poItem.lineTotal
      const invoiceLineTotalAmount = invoiceItem?.lineTotal.amount ?? 0

      const poLineTotalResult = Money.create(poLineTotalAmount, poUnitPrice.currency)
      const invoiceLineTotalResult = Money.create(invoiceLineTotalAmount, poUnitPrice.currency)

      if (!poLineTotalResult.isSuccess || !poLineTotalResult.value) {
        return Result.fail('failed to create PO line total')
      }

      if (!invoiceLineTotalResult.isSuccess || !invoiceLineTotalResult.value) {
        return Result.fail('failed to create invoice line total')
      }

      const poLineTotal = poLineTotalResult.value
      const invoiceLineTotal = invoiceLineTotalResult.value

      // Check quantity discrepancies
      const quantityVariance = Math.abs(invoiceQuantity - grQuantity)
      if (quantityVariance > 0) {
        discrepancies.push('quantity')
        matched = false
      }

      // Check price discrepancies
      const priceVarianceAmount = Math.abs(invoiceUnitPrice.amount - poUnitPrice.amount)
      const priceVariancePct = (priceVarianceAmount / poUnitPrice.amount) * 100

      if (priceVariancePct > tolerancePercentage) {
        discrepancies.push('price')
        matched = false
      }

      // Check total discrepancies
      const totalVarianceAmount = Math.abs(invoiceLineTotal.amount - poLineTotal.amount)
      const totalVariancePct = poLineTotal.amount > 0 ? (totalVarianceAmount / poLineTotal.amount) * 100 : 0

      if (totalVariancePct > tolerancePercentage) {
        discrepancies.push('total')
        matched = false
      }

      const priceVarianceResult = Money.create(priceVarianceAmount, poUnitPrice.currency)
      const totalVarianceResult = Money.create(totalVarianceAmount, poLineTotal.currency)

      if (!priceVarianceResult.isSuccess || !priceVarianceResult.value) {
        return Result.fail('failed to create price variance')
      }

      if (!totalVarianceResult.isSuccess || !totalVarianceResult.value) {
        return Result.fail('failed to create total variance')
      }

      const priceVariance = priceVarianceResult.value
      const totalVariance = totalVarianceResult.value

      lineItems.push({
        purchaseOrderLineId: poItem.lineId,
        itemDescription: poItem.description,
        poQuantity,
        grQuantity,
        invoiceQuantity,
        poUnitPrice,
        invoiceUnitPrice,
        poLineTotal,
        invoiceLineTotal,
        quantityVariance,
        priceVariance,
        totalVariance,
        discrepancies,
        matched,
      })

      const newPoTotalResult = Money.create(
        poTotal.value!.amount + poLineTotal.amount,
        poTotal.value!.currency,
      )
      const newInvoiceTotalResult = Money.create(
        invoiceTotal.value!.amount + invoiceLineTotal.amount,
        invoiceTotal.value!.currency,
      )

      if (!newPoTotalResult.isSuccess || !newPoTotalResult.value) {
        return Result.fail('failed to update PO total')
      }

      if (!newInvoiceTotalResult.isSuccess || !newInvoiceTotalResult.value) {
        return Result.fail('failed to update invoice total')
      }

      poTotal = newPoTotalResult
      invoiceTotal = newInvoiceTotalResult
    }

    const totalVarianceResult = Money.create(
      Math.abs(invoiceTotal.value!.amount - poTotal.value!.amount),
      poTotal.value!.currency,
    )

    if (!totalVarianceResult.isSuccess || !totalVarianceResult.value) {
      return Result.fail('failed to create total variance')
    }

    const totalVariance = totalVarianceResult.value

    const variancePct =
      poTotal.value!.amount > 0
        ? (totalVariance.amount / poTotal.value!.amount) * 100
        : 0

    const withinTolerance = variancePct <= tolerancePercentage
    const hasDiscrepancies = lineItems.some((item) => !item.matched)

    const matchNumber = `3WM-${Date.now()}`
    const now = new Date()

    const matchResult = ThreeWayMatch.create({
      matchNumber,
      purchaseOrderId: purchaseOrder.id,
      purchaseOrderNumber: purchaseOrder.number.value,
      goodsReceiptId: goodsReceipt.id,
      goodsReceiptNumber: goodsReceipt.receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      vendorId: purchaseOrder.vendorId,
      vendorName: invoice.vendorName,
      projectId: purchaseOrder.projectId,
      status: 'pending',
      lineItems,
      poTotal: poTotal.value!,
      grTotal: Money.create(0, poTotal.value!.currency).value!, // TODO: Calculate from GR
      invoiceTotal: invoiceTotal.value!,
      totalVariance,
      tolerancePercentage,
      withinTolerance,
      hasDiscrepancies,
      createdAt: now,
      updatedAt: now,
    })

    return matchResult
  }

  private parseUniqueId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }
}
