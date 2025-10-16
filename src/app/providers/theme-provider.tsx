import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark'
export type Density = 'comfortable' | 'compact'

type ThemeContextValue = {
  theme: Theme
  setTheme: (nextTheme: Theme) => void
  toggleTheme: () => void
  density: Density
  setDensity: (nextDensity: Density) => void
  toggleDensity: () => void
}

const THEME_STORAGE_KEY = 'motif.theme'
const DENSITY_STORAGE_KEY = 'motif.density'

const prefersDarkScheme = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const isTheme = (value: string): value is Theme => value === 'light' || value === 'dark'

const isDensity = (value: string): value is Density =>
  value === 'comfortable' || value === 'compact'

const readStoredSetting = <T extends string>(
  key: string,
  guard: (value: string) => value is T,
): T | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(key)
    if (stored && guard(stored)) {
      return stored
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`Failed to read stored setting "${key}"`, error)
    }
  }

  return null
}

const writeStoredSetting = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`Failed to persist setting "${key}"`, error)
    }
  }
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = readStoredSetting(THEME_STORAGE_KEY, isTheme)
    if (stored) {
      return stored
    }

    return prefersDarkScheme() ? 'dark' : 'light'
  })

  const [density, setDensityState] = useState<Density>(() => {
    const stored = readStoredSetting(DENSITY_STORAGE_KEY, isDensity)
    return stored ?? 'comfortable'
  })

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    root.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    root.dataset.density = density
  }, [density])

  useEffect(() => {
    writeStoredSetting(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    writeStoredSetting(DENSITY_STORAGE_KEY, density)
  }, [density])

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const setDensity = useCallback((nextDensity: Density) => {
    setDensityState(nextDensity)
  }, [])

  const toggleDensity = useCallback(() => {
    setDensityState((current) => (current === 'comfortable' ? 'compact' : 'comfortable'))
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      density,
      setDensity,
      toggleDensity,
    }),
    [theme, setTheme, toggleTheme, density, setDensity, toggleDensity],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
