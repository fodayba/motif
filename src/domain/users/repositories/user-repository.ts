import type { UniqueEntityID } from '../../shared'
import type { User } from '../entities/user'

export interface UserRepository {
  findById(id: UniqueEntityID): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
  delete(user: User): Promise<void>
}
