import { createContext, useContext } from 'react'

type FirebaseEnvironment = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
}

export type Environment = {
  mode: ImportMetaEnv['MODE']
  isDev: boolean
  isProd: boolean
  isTest: boolean
  firebase: FirebaseEnvironment
}

const DEV_FALLBACKS: Partial<Record<keyof ImportMetaEnv, string>> = {
  VITE_FIREBASE_API_KEY: 'AIzaSyBUnfZtp31PbaEDTzdqjqxUnvKQuDQpqNs',
  VITE_FIREBASE_AUTH_DOMAIN: 'motif-erp.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'motif-erp',
  VITE_FIREBASE_STORAGE_BUCKET: 'motif-erp.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '193638600908',
  VITE_FIREBASE_APP_ID: '1:193638600908:web:c5eb6457971fcf606db269',
  VITE_FIREBASE_MEASUREMENT_ID: 'G-ND9F7TQBT2',
}

const missingWarnings = new Set<string>()

const readEnvVar = (key: keyof ImportMetaEnv): string => {
  const rawValue = import.meta.env[key]

  if (rawValue !== undefined && rawValue !== '') {
    return rawValue
  }

  if (import.meta.env.MODE === 'test') {
    return ''
  }

  const fallbackValue = import.meta.env.DEV ? DEV_FALLBACKS[key] : undefined
  const keyName = String(key)

  if (fallbackValue !== undefined) {
    if (!missingWarnings.has(keyName)) {
      missingWarnings.add(keyName)
      console.warn(
        `Missing environment variable ${keyName}; using development fallback from Angular environment file.`,
      )
    }

    return fallbackValue
  }

  throw new Error(`Missing required environment variable: ${keyName}`)
}

export const createEnvironment = (): Environment => {
  return {
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    isTest: import.meta.env.MODE === 'test',
    firebase: {
      apiKey: readEnvVar('VITE_FIREBASE_API_KEY'),
      authDomain: readEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: readEnvVar('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: readEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: readEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: readEnvVar('VITE_FIREBASE_APP_ID'),
      measurementId: readEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
    },
  }
}

const environment = createEnvironment()

export const EnvironmentContext = createContext<Environment>(environment)

export const useEnvironment = () => useContext(EnvironmentContext)

export { environment }
