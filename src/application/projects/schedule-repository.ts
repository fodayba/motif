import type { ProjectTaskRecord } from './types'

export interface ScheduleRepository {
  listTasks(projectId: string): Promise<ProjectTaskRecord[]>
}
