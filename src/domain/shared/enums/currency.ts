export const CURRENCIES = [
  'USD',
  'CAD',
  'EUR',
  'GBP',
  'AUD',
  'JPY',
  'CHF',
  'AED',
  'CNY',
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]
