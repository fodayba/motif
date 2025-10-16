import type { UniqueEntityID } from '../../shared'
import type { ResourceAllocation } from '../entities/resource-allocation'
import type { ResourceType } from '../enums/resource-type'

export interface ResourceAllocationRepository {
  // Basic CRUD operations
  findById(allocationId: UniqueEntityID): Promise<ResourceAllocation | null>
  save(allocation: ResourceAllocation): Promise<void>
  update(allocation: ResourceAllocation): Promise<void>
  delete(allocationId: UniqueEntityID): Promise<void>

  // Query methods
  findByProject(projectId: UniqueEntityID): Promise<ResourceAllocation[]>
  findByTask(taskId: UniqueEntityID): Promise<ResourceAllocation[]>
  findByResource(resourceId: UniqueEntityID): Promise<ResourceAllocation[]>
  findByResourceType(projectId: UniqueEntityID, resourceType: ResourceType): Promise<ResourceAllocation[]>
  findActiveAllocations(resourceId: UniqueEntityID): Promise<ResourceAllocation[]>
  findOverallocated(projectId?: UniqueEntityID): Promise<ResourceAllocation[]>
  findConflicts(resourceId: UniqueEntityID, startDate: Date, endDate: Date): Promise<ResourceAllocation[]>
}
