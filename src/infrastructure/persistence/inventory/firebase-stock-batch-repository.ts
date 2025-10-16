import { Result, UniqueEntityID } from '@domain/shared'
import {
  StockBatch,
  type StockBatchRepository,
  BatchNumber,
  LotNumber,
} from '@domain/inventory'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type StockBatchDocument = FirestoreDocument<{
  itemId: string
  batchNumber: string
  lotNumber?: string
  quantityAvailable: number
  quantityAllocated: number
  unit: string
  manufacturingDate?: string
  expirationDate?: string
  receivedDate: string
  supplierId?: string
  certificateNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}>

/**
 * FirebaseStockBatchRepository
 * 
 * Firebase implementation of StockBatchRepository for persisting batch/lot tracking data.
 * Handles conversion between StockBatch domain entities and Firestore documents.
 * 
 * Features:
 * - Query by item, batch number, expiration
 * - Find expiring/expired batches for alerts
 * - Support batch number and lot number value objects
 * - Efficient indexing for expiration queries
 */
export class FirebaseStockBatchRepository implements StockBatchRepository {
  private readonly firestore: FirestoreClient
  private readonly collection = 'stock-batches'

  constructor(firestore: FirestoreClient) {
    this.firestore = firestore
  }

  async save(batch: StockBatch): Promise<Result<void>> {
    try {
      const doc = this.toPersistence(batch)
      await this.firestore.setDocument(this.collection, batch.id.toString(), doc)
      return Result.ok(undefined as void)
    } catch (error) {
      return Result.fail(`Failed to save stock batch: ${error}`)
    }
  }

  async findById(id: UniqueEntityID): Promise<Result<StockBatch | null>> {
    try {
      const document = await this.firestore.getDocument<StockBatchDocument>(
        this.collection,
        id.toString(),
      )
      if (!document) {
        return Result.ok(null)
      }
      const batch = this.toDomain({ ...document, id: id.toString() })
      return Result.ok(batch)
    } catch (error) {
      return Result.fail(`Failed to find stock batch: ${error}`)
    }
  }

  async findByItemId(itemId: UniqueEntityID): Promise<Result<StockBatch[]>> {
    try {
      const constraints: FirestoreQueryConstraint[] = [
        { field: 'itemId', op: '==', value: itemId.toString() },
      ]
      const documents = await this.firestore.queryCollection<StockBatchDocument>(
        this.collection,
        constraints,
      )
      const batches = documents
        .map((doc) => this.toDomain(doc as StockBatchDocument & { id: string }))
        .filter((batch): batch is StockBatch => batch !== null)
      return Result.ok(batches)
    } catch (error) {
      return Result.fail(`Failed to find batches by item: ${error}`)
    }
  }

  async findByBatchNumber(batchNumber: string): Promise<Result<StockBatch | null>> {
    try {
      const constraints: FirestoreQueryConstraint[] = [
        { field: 'batchNumber', op: '==', value: batchNumber },
        { field: 'batchNumber', op: 'limit', value: 1 },
      ]
      const documents = await this.firestore.queryCollection<StockBatchDocument>(
        this.collection,
        constraints,
      )
      if (documents.length === 0) {
        return Result.ok(null)
      }
      const batch = this.toDomain(documents[0] as StockBatchDocument & { id: string })
      return Result.ok(batch)
    } catch (error) {
      return Result.fail(`Failed to find batch by batch number: ${error}`)
    }
  }

  async findExpiring(daysThreshold: number): Promise<Result<StockBatch[]>> {
    try {
      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

      const constraints: FirestoreQueryConstraint[] = [
        { field: 'expirationDate', op: '<=', value: thresholdDate.toISOString() },
        { field: 'expirationDate', op: '>', value: new Date().toISOString() },
      ]
      const documents = await this.firestore.queryCollection<StockBatchDocument>(
        this.collection,
        constraints,
      )
      const batches = documents
        .map((doc) => this.toDomain(doc as StockBatchDocument & { id: string }))
        .filter((batch): batch is StockBatch => batch !== null)
      return Result.ok(batches)
    } catch (error) {
      return Result.fail(`Failed to find expiring batches: ${error}`)
    }
  }

  async findExpired(): Promise<Result<StockBatch[]>> {
    try {
      const now = new Date()
      const constraints: FirestoreQueryConstraint[] = [
        { field: 'expirationDate', op: '<', value: now.toISOString() },
      ]
      const documents = await this.firestore.queryCollection<StockBatchDocument>(
        this.collection,
        constraints,
      )
      const batches = documents
        .map((doc) => this.toDomain(doc as StockBatchDocument & { id: string }))
        .filter((batch): batch is StockBatch => batch !== null)
      return Result.ok(batches)
    } catch (error) {
      return Result.fail(`Failed to find expired batches: ${error}`)
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    try {
      await this.firestore.deleteDocument(this.collection, id.toString())
      return Result.ok(undefined as void)
    } catch (error) {
      return Result.fail(`Failed to delete stock batch: ${error}`)
    }
  }

  private toPersistence(batch: StockBatch): StockBatchDocument {
    return {
      itemId: batch.itemId.toString(),
      batchNumber: batch.batchNumber.value,
      lotNumber: batch.lotNumber?.value,
      quantityAvailable: batch.quantityAvailable,
      quantityAllocated: batch.quantityAllocated,
      unit: batch.unit,
      manufacturingDate: batch.manufacturingDate?.toISOString(),
      expirationDate: batch.expirationDate?.toISOString(),
      receivedDate: batch.receivedDate.toISOString(),
      supplierId: batch.supplierId?.toString(),
      certificateNumber: batch.certificateNumber,
      notes: batch.notes,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    }
  }

  private toDomain(document: StockBatchDocument & { id: string }): StockBatch | null {
    const batchNumberResult = BatchNumber.create(document.batchNumber)
    if (!batchNumberResult.isSuccess) {
      console.error('Failed to create BatchNumber:', batchNumberResult.error)
      return null
    }

    let lotNumber: LotNumber | undefined
    if (document.lotNumber) {
      const lotNumberResult = LotNumber.create(document.lotNumber)
      if (lotNumberResult.isSuccess && lotNumberResult.value) {
        lotNumber = lotNumberResult.value
      }
    }

    const batchResult = StockBatch.create(
      {
        itemId: new UniqueEntityID(document.itemId),
        batchNumber: batchNumberResult.value!,
        lotNumber,
        quantityAvailable: document.quantityAvailable,
        quantityAllocated: document.quantityAllocated,
        unit: document.unit,
        manufacturingDate: document.manufacturingDate
          ? new Date(document.manufacturingDate)
          : undefined,
        expirationDate: document.expirationDate ? new Date(document.expirationDate) : undefined,
        receivedDate: new Date(document.receivedDate),
        supplierId: document.supplierId ? new UniqueEntityID(document.supplierId) : undefined,
        certificateNumber: document.certificateNumber,
        notes: document.notes,
        createdAt: new Date(document.createdAt),
        updatedAt: new Date(document.updatedAt),
      },
      new UniqueEntityID(document.id),
    )

    if (!batchResult.isSuccess) {
      console.error('Failed to create StockBatch:', batchResult.error)
      return null
    }

    return batchResult.value ?? null
  }
}
