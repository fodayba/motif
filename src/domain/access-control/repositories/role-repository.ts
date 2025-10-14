import type { UniqueEntityID } from '../../shared'
import type { Role } from '../entities/role'

export interface RoleRepository {
  findById(id: UniqueEntityID): Promise<Role | null>
  findByName(name: string): Promise<Role | null>
  save(role: Role): Promise<void>
  delete(role: Role): Promise<void>
  list(): Promise<Role[]>
}
