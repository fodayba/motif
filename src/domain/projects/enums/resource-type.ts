export const RESOURCE_TYPES = ['labor', 'equipment', 'material', 'subcontractor'] as const

export type ResourceType = typeof RESOURCE_TYPES[number]
