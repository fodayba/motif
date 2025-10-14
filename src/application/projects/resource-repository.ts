import type { ResourceCapacity } from './types'

export interface ResourceRepository {
  getCapacity(resourceId: string): Promise<ResourceCapacity | null>
}
