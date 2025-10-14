import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from '../layouts/app-layout'
import { AuthLayout } from '../layouts/auth-layout'
import { useAuth } from '../providers/auth-provider'

const DashboardLanding = lazy(() =>
  import('@presentation/pages/dashboard/dashboard-landing').then((module) => ({
    default: module.DashboardLanding,
  })),
)

const NotFoundPage = lazy(() =>
  import('@presentation/pages/not-found/not-found-page').then((module) => ({
    default: module.NotFoundPage,
  })),
)

const LoginPage = lazy(() =>
  import('@presentation/pages/auth/login-page').then((module) => ({
    default: module.LoginPage,
  })),
)

const RegisterPage = lazy(() =>
  import('@presentation/pages/auth/register-page').then((module) => ({
    default: module.RegisterPage,
  })),
)

const MfaPage = lazy(() =>
  import('@presentation/pages/auth/mfa-page').then((module) => ({
    default: module.MfaPage,
  })),
)

const OnboardingPage = lazy(() =>
  import('@presentation/pages/auth/onboarding-page').then((module) => ({
    default: module.OnboardingPage,
  })),
)

const ProtectedRoute = () => {
  const { user, isAuthenticated } = useAuth()

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!user.mfaVerified) {
    return <Navigate to="/auth/mfa" replace />
  }

  if (!user.onboardingComplete) {
    return <Navigate to="/auth/onboarding" replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}

export const routes: RouteObject[] = [
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'mfa',
        element: <MfaPage />,
      },
      {
        path: 'onboarding',
        element: <OnboardingPage />,
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardLanding />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
