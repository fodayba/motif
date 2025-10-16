import type { ResourceCapacity, ResourceRecord } from './types'

export interface ResourceRepository {
  getCapacity(resourceId: string): Promise<ResourceCapacity | null>
  listResources(projectId: string): Promise<ResourceRecord[]>
}
