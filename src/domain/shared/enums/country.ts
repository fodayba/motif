export const COUNTRIES = [
  'US',
  'CA',
  'GB',
  'DE',
  'FR',
  'AE',
  'AU',
  'NZ',
  'CN',
  'JP',
] as const

export type CountryCode = (typeof COUNTRIES)[number]
