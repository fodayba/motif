import type { UniqueEntityID } from '../../shared'
import type { Invoice, InvoiceStatus } from '../entities/invoice'

export interface InvoiceRepository {
  save(invoice: Invoice): Promise<void>
  findById(id: UniqueEntityID): Promise<Invoice | null>
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>
  findByPurchaseOrder(purchaseOrderId: UniqueEntityID): Promise<Invoice[]>
  findByProject(projectId: UniqueEntityID): Promise<Invoice[]>
  findByStatus(status: InvoiceStatus): Promise<Invoice[]>
  findByVendor(vendorId: UniqueEntityID): Promise<Invoice[]>
  listAll(): Promise<Invoice[]>
  listPendingApproval(): Promise<Invoice[]>
  listOverdue(): Promise<Invoice[]>
  delete(id: UniqueEntityID): Promise<void>
  nextIdentity(): Promise<string>
}
