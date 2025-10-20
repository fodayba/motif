import { Result, UniqueEntityID, Money, type CurrencyCode } from '@domain/shared'
import { RFQ, type RFQRepository, type RFQStatus } from '@domain/procurement'
import type { FirestoreClient, FirestoreDocument } from '../../firebase/types'

type RFQDocument = FirestoreDocument<{
  rfqNumber: string
  title: string
  description: string
  type: string
  projectId: string
  status: string
  items: {
    id: string
    description: string
    quantity: number
    unitOfMeasure: string
    specifications?: string
  }[]
  publishedAt?: string
  closeDate?: string
  bids: {
    vendorId: string
    vendorName: string
    submittedAt: string
    totalAmount: number
    totalCurrency: string
    deliveryDays: number
    items: {
      rfqItemId: string
      unitPrice: number
      unitPriceCurrency: string
      leadTimeDays: number
      notes?: string
    }[]
    notes?: string
    attachments?: string[]
  }[]
  selectedBidVendorId?: string
  awardedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}>

export class FirebaseRFQRepository implements RFQRepository {
  private readonly firestore: FirestoreClient
  private readonly collection = 'rfqs'

  constructor(firestore: FirestoreClient) {
    this.firestore = firestore
  }

  private toPersistence(rfq: RFQ): RFQDocument {
    return {
      rfqNumber: rfq.rfqNumber,
      title: rfq.title,
      description: rfq.description,
      type: rfq.type,
      projectId: rfq.projectId.toString(),
      status: rfq.status,
      items: rfq.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        specifications: item.specifications,
      })),
      publishedAt: rfq.publishedAt?.toISOString(),
      closeDate: rfq.closeDate?.toISOString(),
      bids: rfq.bids.map(bid => ({
        vendorId: bid.vendorId.toString(),
        vendorName: bid.vendorName,
        submittedAt: bid.submittedAt.toISOString(),
        totalAmount: bid.totalAmount.amount,
        totalCurrency: bid.totalAmount.currency,
        deliveryDays: bid.deliveryDays,
        items: bid.items.map(item => ({
          rfqItemId: item.rfqItemId,
          unitPrice: item.unitPrice.amount,
          unitPriceCurrency: item.unitPrice.currency,
          leadTimeDays: item.leadTimeDays,
          notes: item.notes,
        })),
        notes: bid.notes,
        attachments: bid.attachments,
      })),
      selectedBidVendorId: rfq.selectedBidVendorId?.toString(),
      awardedAt: rfq.awardedAt?.toISOString(),
      createdBy: rfq.createdBy.toString(),
      createdAt: rfq.createdAt.toISOString(),
      updatedAt: rfq.updatedAt.toISOString(),
    }
  }

  private fromPersistence(doc: RFQDocument & { id: string }): Result<RFQ> {
    try {
      const defaultMoneyResult = Money.create(0, 'USD')
      if (!defaultMoneyResult.isSuccess) {
        return Result.fail<RFQ>('Failed to create default Money value object')
      }
      const defaultMoney = defaultMoneyResult.value!

      const rfq = RFQ.create(
        {
          rfqNumber: doc.rfqNumber,
          title: doc.title,
          description: doc.description,
          type: doc.type as 'goods' | 'services' | 'construction',
          projectId: new UniqueEntityID(doc.projectId),
          status: doc.status as RFQStatus,
          items: doc.items,
          publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : undefined,
          closeDate: doc.closeDate ? new Date(doc.closeDate) : undefined,
          bids: doc.bids.map(bid => {
            const totalMoneyResult = Money.create(bid.totalAmount, bid.totalCurrency as CurrencyCode)
            const totalMoney = totalMoneyResult.isSuccess && totalMoneyResult.value ? totalMoneyResult.value : defaultMoney
            return {
              vendorId: new UniqueEntityID(bid.vendorId),
              vendorName: bid.vendorName,
              submittedAt: new Date(bid.submittedAt),
              totalAmount: totalMoney,
              deliveryDays: bid.deliveryDays,
              items: bid.items.map(item => {
                const unitPriceResult = Money.create(item.unitPrice, item.unitPriceCurrency as CurrencyCode)
                const unitPrice = unitPriceResult.isSuccess && unitPriceResult.value ? unitPriceResult.value : defaultMoney
                return {
                  rfqItemId: item.rfqItemId,
                  unitPrice,
                  leadTimeDays: item.leadTimeDays,
                  notes: item.notes,
                }
              }),
              notes: bid.notes,
              attachments: bid.attachments,
            }
          }),
          selectedBidVendorId: doc.selectedBidVendorId
            ? new UniqueEntityID(doc.selectedBidVendorId)
            : undefined,
          awardedAt: doc.awardedAt ? new Date(doc.awardedAt) : undefined,
          createdBy: new UniqueEntityID(doc.createdBy),
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        },
        new UniqueEntityID(doc.id)
      )

      if (!rfq.isSuccess) {
        return Result.fail<RFQ>(rfq.error || 'Failed to create RFQ')
      }

      return Result.ok(rfq.value!)
    } catch (error) {
      return Result.fail<RFQ>(`Failed to deserialize RFQ: ${error}`)
    }
  }

  async save(rfq: RFQ): Promise<void> {
    const doc = this.toPersistence(rfq)
    await this.firestore.setDocument(this.collection, rfq.id.toString(), doc)
  }

  async findById(id: UniqueEntityID): Promise<RFQ | null> {
    const doc = await this.firestore.getDocument<RFQDocument>(
      this.collection,
      id.toString()
    )

    if (!doc) {
      return null
    }

    const result = this.fromPersistence({ ...doc, id: id.toString() })
    return result.isSuccess && result.value ? result.value : null
  }

  async findByRFQNumber(rfqNumber: string): Promise<RFQ | null> {
    const docs = await this.firestore.queryCollection<RFQDocument>(
      this.collection,
      [{ field: 'rfqNumber', op: '==', value: rfqNumber }]
    )

    if (docs.length === 0) {
      return null
    }

    const result = this.fromPersistence(docs[0])
    return result.isSuccess && result.value ? result.value : null
  }

  async findByProject(projectId: UniqueEntityID): Promise<RFQ[]> {
    const docs = await this.firestore.queryCollection<RFQDocument>(
      this.collection,
      [
        { field: 'projectId', op: '==', value: projectId.toString() },
        { field: 'createdAt', op: 'orderBy', direction: 'desc' },
      ]
    )

    const rfqs: RFQ[] = []
    for (const doc of docs) {
      const result = this.fromPersistence(doc)
      if (result.isSuccess && result.value) {
        rfqs.push(result.value)
      }
    }

    return rfqs
  }

  async findByStatus(status: RFQStatus): Promise<RFQ[]> {
    const docs = await this.firestore.queryCollection<RFQDocument>(
      this.collection,
      [
        { field: 'status', op: '==', value: status },
        { field: 'createdAt', op: 'orderBy', direction: 'desc' },
      ]
    )

    const rfqs: RFQ[] = []
    for (const doc of docs) {
      const result = this.fromPersistence(doc)
      if (result.isSuccess && result.value) {
        rfqs.push(result.value)
      }
    }

    return rfqs
  }

  async listAll(): Promise<RFQ[]> {
    const docs = await this.firestore.queryCollection<RFQDocument>(
      this.collection,
      [{ field: 'createdAt', op: 'orderBy', direction: 'desc' }]
    )

    const rfqs: RFQ[] = []
    for (const doc of docs) {
      const result = this.fromPersistence(doc)
      if (result.isSuccess && result.value) {
        rfqs.push(result.value)
      }
    }

    return rfqs
  }

  async listPublished(): Promise<RFQ[]> {
    return this.findByStatus('published')
  }

  async listOpen(): Promise<RFQ[]> {
    const now = new Date().toISOString()
    const docs = await this.firestore.queryCollection<RFQDocument>(
      this.collection,
      [
        { field: 'status', op: '==', value: 'published' },
        { field: 'closeDate', op: '>', value: now },
        { field: 'closeDate', op: 'orderBy', direction: 'asc' },
      ]
    )

    const rfqs: RFQ[] = []
    for (const doc of docs) {
      const result = this.fromPersistence(doc)
      if (result.isSuccess && result.value) {
        rfqs.push(result.value)
      }
    }

    return rfqs
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await this.firestore.deleteDocument(this.collection, id.toString())
  }

  async nextIdentity(): Promise<string> {
    const docs = await this.firestore.queryCollection<RFQDocument>(
      this.collection,
      [
        { field: 'rfqNumber', op: 'orderBy', direction: 'desc' },
        { field: 'rfqNumber', op: 'limit', value: 1 },
      ]
    )

    if (docs.length === 0) {
      return 'RFQ-000001'
    }

    const lastNumber = parseInt(docs[0].rfqNumber.split('-')[1] || '0')
    return `RFQ-${String(lastNumber + 1).padStart(6, '0')}`
  }
}
