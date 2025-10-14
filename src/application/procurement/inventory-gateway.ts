export type InventoryAvailability = {
  itemId: string
  locationId: string
  locationName: string
  availableQuantity: number
  reservedQuantity: number
  incomingQuantity: number
  alternativeSites: Array<{
    locationId: string
    locationName: string
    availableQuantity: number
  }>
}

export interface InventoryGateway {
  getAvailability(params: {
    itemId: string
    locationId: string
  }): Promise<InventoryAvailability | null>
}
