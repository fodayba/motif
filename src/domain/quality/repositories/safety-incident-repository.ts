import type { UniqueEntityID } from '../../shared'
import type { SafetyIncident } from '../entities/safety-incident'

export interface SafetyIncidentRepository {
  findById(id: UniqueEntityID): Promise<SafetyIncident | null>
  listByProject(projectId: UniqueEntityID): Promise<SafetyIncident[]>
  save(incident: SafetyIncident): Promise<void>
  delete(incident: SafetyIncident): Promise<void>
}
