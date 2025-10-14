import { UniqueEntityID } from '@domain/shared'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../types'

type FirestoreEntity<TDomain> = {
  id: UniqueEntityID
  data: TDomain
}

export abstract class FirestoreRepository<TEntity> {
  protected readonly firestore: FirestoreClient
  protected readonly collection: string

  protected constructor(firestore: FirestoreClient, collection: string) {
    this.firestore = firestore
    this.collection = collection
  }

  protected abstract toPersistence(entity: TEntity): FirestoreDocument
  protected abstract toDomain(document: FirestoreDocument & { id: string }): TEntity | null

  async findById(id: UniqueEntityID): Promise<TEntity | null> {
    const document = await this.firestore.getDocument(this.collection, id.toString())

    if (!document) {
      return null
    }

    return this.toDomain({ ...document, id: document.id ?? id.toString() })
  }

  async save(entity: FirestoreEntity<TEntity>): Promise<void>
  async save(entity: TEntity): Promise<void>
  async save(entity: TEntity | FirestoreEntity<TEntity>): Promise<void> {
    const { id, data } = this.resolveEntity(entity)
    const persistence = this.toPersistence(data)

    await this.firestore.setDocument(this.collection, id.toString(), persistence)
  }

  async update(entity: FirestoreEntity<Partial<TEntity>>): Promise<void> {
    const persistence = this.toPersistencePartial(entity.data)
    await this.firestore.updateDocument(
      this.collection,
      entity.id.toString(),
      persistence,
    )
  }

  async delete(id: UniqueEntityID): Promise<void>
  async delete(entity: TEntity): Promise<void>
  async delete(input: UniqueEntityID | TEntity): Promise<void> {
    const id = input instanceof UniqueEntityID ? input : this.extractId(input)
    await this.firestore.deleteDocument(this.collection, id.toString())
  }

  async list(constraints?: FirestoreQueryConstraint[]): Promise<TEntity[]> {
    const documents = await this.firestore.queryCollection(this.collection, constraints)

    return documents
      .map((document) => this.toDomain(document))
      .filter((value): value is TEntity => value !== null)
  }

  protected toPersistencePartial(entity: Partial<TEntity>): Partial<FirestoreDocument> {
    const persistence = this.toPersistence(entity as TEntity)
    return Object.fromEntries(
      Object.entries(persistence).filter(([, value]) => value !== undefined),
    )
  }

  protected resolveEntity(entity: FirestoreEntity<TEntity> | TEntity): {
    id: UniqueEntityID
    data: TEntity
  } {
    if (this.isEntityWithId(entity)) {
      return { id: entity.id, data: entity.data }
    }

    const id = this.extractId(entity)
    return { id, data: entity }
  }

  protected isEntityWithId(value: unknown): value is FirestoreEntity<TEntity> {
    return Boolean(
      value &&
        typeof value === 'object' &&
        'id' in value &&
        value.id instanceof UniqueEntityID &&
        'data' in value,
    )
  }

  protected extractId(entity: TEntity): UniqueEntityID {
    const candidate = this.obtainId(entity)
    if (!candidate) {
      throw new Error('Entity does not provide an identity accessor')
    }

    return candidate
  }

  protected abstract obtainId(entity: TEntity): UniqueEntityID | null
}
