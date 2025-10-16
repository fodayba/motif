import type { Result, UniqueEntityID } from '../../shared'
import type { MaterialRequisition } from '../entities/material-requisition'
import type { RequisitionStatus } from '../enums/requisition-status'

export interface MaterialRequisitionRepository {
  save(requisition: MaterialRequisition): Promise<Result<void>>
  findById(id: UniqueEntityID): Promise<Result<MaterialRequisition | null>>
  findByRequisitionNumber(requisitionNumber: string): Promise<Result<MaterialRequisition | null>>
  findByStatus(status: RequisitionStatus): Promise<Result<MaterialRequisition[]>>
  findByProject(projectId: UniqueEntityID): Promise<Result<MaterialRequisition[]>>
  findByLocation(locationId: UniqueEntityID): Promise<Result<MaterialRequisition[]>>
  findOverdue(): Promise<Result<MaterialRequisition[]>>
  findPendingApproval(): Promise<Result<MaterialRequisition[]>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
