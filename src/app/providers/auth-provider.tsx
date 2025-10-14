import type { PropsWithChildren } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'

type AuthUser = {
  id: string
  email: string
  displayName: string
  roles: string[]
  mfaVerified: boolean
  onboardingComplete: boolean
}

type SignInCredentials = {
  email: string
  password: string
}

type RegistrationInput = {
  email: string
  password: string
  displayName: string
}

type OnboardingInput = {
  organizationName: string
  role: string
  acceptTerms: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  signInWithEmail: (credentials: SignInCredentials) => Promise<{ nextRoute: string }>
  registerAccount: (input: RegistrationInput) => Promise<{ nextRoute: string }>
  verifyMfa: (code: string) => Promise<{ nextRoute: string }>
  completeOnboarding: (input: OnboardingInput) => Promise<{ nextRoute: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.mfaVerified),
      // These placeholders will integrate with Firebase auth once adapters arrive.
      signInWithEmail: async (credentials) => {
        const trimmedEmail = credentials.email.trim()
        if (!trimmedEmail || !credentials.password.trim()) {
          throw new Error('Email and password are required')
        }

        const requiresMfa = trimmedEmail.includes('+mfa')
        const requiresOnboarding = trimmedEmail.includes('+onboarding')

        const baseUser: AuthUser = {
          id: `user-${Math.random().toString(36).slice(2, 8)}`,
          email: trimmedEmail,
          displayName: trimmedEmail.split('@')[0] ?? 'User',
          roles: ['project-manager'],
          mfaVerified: !requiresMfa,
          onboardingComplete: !requiresOnboarding,
        }

        setUser(baseUser)

        if (requiresMfa) {
          return { nextRoute: '/auth/mfa' }
        }

        if (!baseUser.onboardingComplete) {
          return { nextRoute: '/auth/onboarding' }
        }

        return { nextRoute: '/' }
      },
      registerAccount: async (input) => {
        if (!input.email.trim() || !input.password.trim() || !input.displayName.trim()) {
          throw new Error('All fields are required')
        }

        setUser({
          id: `user-${Math.random().toString(36).slice(2, 8)}`,
          email: input.email.trim(),
          displayName: input.displayName.trim(),
          roles: ['project-manager'],
          mfaVerified: true,
          onboardingComplete: false,
        })

        return { nextRoute: '/auth/onboarding' }
      },
      verifyMfa: async (code) => {
        if (!code.trim()) {
          throw new Error('Verification code is required')
        }

        if (!user) {
          throw new Error('No pending MFA session')
        }

        const updatedUser: AuthUser = {
          ...user,
          mfaVerified: true,
        }

        setUser(updatedUser)

        if (!updatedUser.onboardingComplete) {
          return { nextRoute: '/auth/onboarding' }
        }

        return { nextRoute: '/' }
      },
      completeOnboarding: async (input) => {
        if (!input.organizationName.trim() || !input.role.trim()) {
          throw new Error('Organization and role are required')
        }

        if (!input.acceptTerms) {
          throw new Error('You must accept the terms to continue')
        }

        if (!user) {
          throw new Error('No active session')
        }

        const updatedUser: AuthUser = {
          ...user,
          onboardingComplete: true,
        }

        setUser(updatedUser)

        return { nextRoute: '/' }
      },
      signOut: async () => {
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
