import type { UniqueEntityID } from '../../shared'
import type { Vendor } from '../entities/vendor'

export interface VendorRepository {
  findById(id: UniqueEntityID): Promise<Vendor | null>
  findByLegalName(name: string): Promise<Vendor | null>
  save(vendor: Vendor): Promise<void>
  delete(vendor: Vendor): Promise<void>
  listActive(): Promise<Vendor[]>
}
