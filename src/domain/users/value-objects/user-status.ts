export const USER_STATUSES = ['invited', 'active', 'suspended', 'disabled'] as const

export type UserStatus = (typeof USER_STATUSES)[number]
