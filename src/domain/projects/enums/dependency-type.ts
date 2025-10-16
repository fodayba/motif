export const DEPENDENCY_TYPES = [
  'finish-to-start', // Task B can't start until Task A finishes (most common)
  'start-to-start', // Task B can't start until Task A starts
  'finish-to-finish', // Task B can't finish until Task A finishes
  'start-to-finish', // Task B can't finish until Task A starts (rare)
] as const

export type DependencyType = typeof DEPENDENCY_TYPES[number]
