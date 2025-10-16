import type { Result, UniqueEntityID } from '../../shared'
import type { Shipment } from '../entities/shipment'

export interface ShipmentRepository {
  findById(id: UniqueEntityID): Promise<Result<Shipment | null>>
  findByShipmentNumber(shipmentNumber: string): Promise<Result<Shipment | null>>
  findByPackingSlipId(packingSlipId: UniqueEntityID): Promise<Result<Shipment | null>>
  findByTrackingNumber(trackingNumber: string): Promise<Result<Shipment | null>>
  findByOrderReference(orderReference: UniqueEntityID): Promise<Result<Shipment[]>>
  findByWarehouseId(warehouseId: UniqueEntityID): Promise<Result<Shipment[]>>
  findByStatus(status: string): Promise<Result<Shipment[]>>
  findInTransitShipments(): Promise<Result<Shipment[]>>
  findDelayedShipments(): Promise<Result<Shipment[]>>
  save(shipment: Shipment): Promise<Result<void>>
  delete(id: UniqueEntityID): Promise<Result<void>>
}
