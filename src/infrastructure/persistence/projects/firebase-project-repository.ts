import { UniqueEntityID, Money, GeoCoordinate, type CurrencyCode, type ProjectStatus } from '@domain/shared'
import {
  Project,
  type ProjectRepository,
  ProjectCode,
  ProjectName,
  ProjectLocation,
} from '@domain/projects'
import { FirestoreRepository } from '../../firebase/firestore/firestore-repository'
import type { FirestoreClient, FirestoreDocument, FirestoreQueryConstraint } from '../../firebase/types'

type ProjectDocument = FirestoreDocument<{
  code: string
  name: string
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  clientName: string
  budget: {
    amount: number
    currency: string
  }
  status: ProjectStatus
  startDate: string
  endDate?: string
  projectManagerId?: string
  createdAt: string
  updatedAt: string
}>

export class FirebaseProjectRepository
  extends FirestoreRepository<Project>
  implements ProjectRepository
{
  constructor(firestore: FirestoreClient) {
    super(firestore, 'projects')
  }

  async findByCode(code: ProjectCode): Promise<Project | null> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'code', op: '==', value: code.value },
      { field: 'code', op: 'limit', value: 1 },
    ]

    const results = await this.list(constraints)
    return results[0] ?? null
  }

  async listByManager(managerId: UniqueEntityID): Promise<Project[]> {
    const constraints: FirestoreQueryConstraint[] = [
      { field: 'projectManagerId', op: '==', value: managerId.toString() },
      { field: 'startDate', op: 'orderBy', direction: 'desc' },
    ]

    return this.list(constraints)
  }

  async delete(project: Project): Promise<void>
  async delete(id: UniqueEntityID): Promise<void>
  async delete(input: Project | UniqueEntityID): Promise<void> {
    const projectId = input instanceof UniqueEntityID ? input : input.id
    await this.firestore.deleteDocument(this.collection, projectId.toString())
  }

  protected obtainId(entity: Project): UniqueEntityID | null {
    return entity.id
  }

  protected toPersistence(project: Project): ProjectDocument {
    const doc: ProjectDocument = {
      code: project.code.value,
      name: project.name.value,
      location: {
        address: project.location.addressLine1 + (project.location.addressLine2 ? `, ${project.location.addressLine2}` : ''),
        city: project.location.city,
        state: project.location.stateProvince ?? '',
        zipCode: project.location.postalCode ?? '',
        country: project.location.country,
        coordinates: project.location.coordinate
          ? {
              latitude: project.location.coordinate.latitude,
              longitude: project.location.coordinate.longitude,
            }
          : undefined,
      },
      clientName: project.clientName,
      budget: {
        amount: project.budget.amount,
        currency: project.budget.currency,
      },
      status: project.status,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate?.toISOString(),
      projectManagerId: project.projectManagerId?.toString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }

    return doc
  }

  protected toDomain(doc: ProjectDocument & { id: string }): Project | null {
    try {
      // Reconstruct value objects
      const codeResult = ProjectCode.create(doc.code)
      if (!codeResult.isSuccess) {
        console.error(`Invalid project code: ${codeResult.error}`)
        return null
      }

      const nameResult = ProjectName.create(doc.name)
      if (!nameResult.isSuccess) {
        console.error(`Invalid project name: ${nameResult.error}`)
        return null
      }

      const locationResult = ProjectLocation.create({
        addressLine1: doc.location.address,
        city: doc.location.city,
        stateProvince: doc.location.state || undefined,
        postalCode: doc.location.zipCode || undefined,
        country: doc.location.country,
        coordinate: doc.location.coordinates
          ? GeoCoordinate.create(
              doc.location.coordinates.latitude,
              doc.location.coordinates.longitude
            ).value!
          : undefined,
      })
      if (!locationResult.isSuccess) {
        console.error(`Invalid project location: ${locationResult.error}`)
        return null
      }

      const budgetResult = Money.create(
        doc.budget.amount,
        doc.budget.currency as CurrencyCode
      )
      if (!budgetResult.isSuccess) {
        console.error(`Invalid project budget: ${budgetResult.error}`)
        return null
      }

      const result = Project.create(
        {
          code: codeResult.value!,
          name: nameResult.value!,
          location: locationResult.value!,
          clientName: doc.clientName,
          budget: budgetResult.value!,
          status: doc.status,
          startDate: new Date(doc.startDate),
          endDate: doc.endDate ? new Date(doc.endDate) : undefined,
          projectManagerId: doc.projectManagerId
            ? new UniqueEntityID(doc.projectManagerId)
            : undefined,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        },
        new UniqueEntityID(doc.id)
      )

      if (!result.isSuccess) {
        console.error(`Failed to reconstitute Project: ${result.error}`)
        return null
      }

      return result.value!
    } catch (error) {
      console.error('Error reconstituting Project:', error)
      return null
    }
  }
}
