import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from '../layouts/app-layout'
import { AuthLayout } from '../layouts/auth-layout'
import { useAuth } from '../providers/auth-provider'
import { ModuleGuard } from './module-guard'
import { APP_NAVIGATION } from './navigation'
import type { AppNavItem } from './navigation'

const DashboardLanding = lazy(() =>
  import('@presentation/pages/dashboard/dashboard-landing').then((module) => ({
    default: module.DashboardLanding,
  })),
)

const ProjectsLanding = lazy(() =>
  import('@presentation/pages/modules/projects/projects-landing').then((module) => ({
    default: module.ProjectsLanding,
  })),
)

const EquipmentLanding = lazy(() =>
  import('@presentation/pages/modules/equipment/equipment-landing').then((module) => ({
    default: module.EquipmentLanding,
  })),
)

const EquipmentDashboard = lazy(() =>
  import('@presentation/pages/equipment/equipment-dashboard').then((module) => ({
    default: module.EquipmentDashboard,
  })),
)

const GPSTrackingMap = lazy(() =>
  import('@presentation/pages/equipment/gps-tracking-map').then((module) => ({
    default: module.GPSTrackingMap,
  })),
)

const MaintenanceCalendar = lazy(() =>
  import('@presentation/pages/equipment/maintenance-calendar').then((module) => ({
    default: module.MaintenanceCalendar,
  })),
)

const CheckInOutForm = lazy(() =>
  import('@presentation/pages/equipment/check-in-out-form').then((module) => ({
    default: module.CheckInOutForm,
  })),
)

const IoTSensorDashboard = lazy(() =>
  import('@presentation/pages/equipment/iot-sensor-dashboard').then((module) => ({
    default: module.IoTSensorDashboard,
  })),
)

const UtilizationReports = lazy(() =>
  import('@presentation/pages/equipment/utilization-reports').then((module) => ({
    default: module.UtilizationReports,
  })),
)

const ROIDepreciationReports = lazy(() =>
  import('@presentation/pages/equipment/roi-depreciation-reports').then((module) => ({
    default: module.ROIDepreciationReports,
  })),
)

const InventoryLanding = lazy(() =>
  import('@presentation/pages/modules/inventory/inventory-landing').then((module) => ({
    default: module.InventoryLanding,
  })),
)

const ProcurementLanding = lazy(() =>
  import('@presentation/pages/modules/procurement/procurement-landing').then((module) => ({
    default: module.ProcurementLanding,
  })),
)

const FinanceLanding = lazy(() =>
  import('@presentation/pages/modules/finance/finance-landing').then((module) => ({
    default: module.FinanceLanding,
  })),
)

const QualityLanding = lazy(() =>
  import('@presentation/pages/modules/quality/quality-landing').then((module) => ({
    default: module.QualityLanding,
  })),
)

const AnalyticsLanding = lazy(() =>
  import('@presentation/pages/modules/analytics/analytics-landing').then((module) => ({
    default: module.AnalyticsLanding,
  })),
)

const DocumentsLanding = lazy(() =>
  import('@presentation/pages/modules/documents/documents-landing').then((module) => ({
    default: module.DocumentsLanding,
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

  const navItems: AppNavItem[] = APP_NAVIGATION.flatMap((group) => group.items)

  const getNavMeta = (id: string): AppNavItem | undefined =>
    navItems.find((item) => item.id === id)

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
            handle: {
              navId: 'dashboard',
              label: getNavMeta('dashboard')?.label ?? 'Dashboard',
              description: getNavMeta('dashboard')?.description ?? '',
            },
          },
          {
            path: 'projects',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('projects')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'projects',
              label: getNavMeta('projects')?.label ?? 'Projects',
              description: getNavMeta('projects')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <ProjectsLanding />,
              },
            ],
          },
          {
            path: 'equipment',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('equipment')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'equipment',
              label: getNavMeta('equipment')?.label ?? 'Equipment',
              description: getNavMeta('equipment')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <EquipmentLanding />,
              },
              {
                path: 'dashboard',
                element: <EquipmentDashboard />,
                handle: {
                  navId: 'equipment-dashboard',
                  label: 'Equipment Dashboard',
                  description: 'Overview of equipment status, utilization, and maintenance.',
                },
              },
              {
                path: 'gps',
                element: <GPSTrackingMap />,
                handle: {
                  navId: 'equipment-gps',
                  label: 'GPS Tracking',
                  description: 'Real-time GPS tracking and geofencing for equipment.',
                },
              },
              {
                path: 'maintenance',
                element: <MaintenanceCalendar />,
                handle: {
                  navId: 'equipment-maintenance',
                  label: 'Maintenance Schedule',
                  description: 'Calendar view of scheduled and overdue maintenance.',
                },
              },
              {
                path: 'check-in-out',
                element: <CheckInOutForm />,
                handle: {
                  navId: 'equipment-checkin',
                  label: 'Check In/Out',
                  description: 'Equipment check-in and check-out with digital signatures.',
                },
              },
              {
                path: 'sensors',
                element: <IoTSensorDashboard />,
                handle: {
                  navId: 'equipment-sensors',
                  label: 'IoT Sensors',
                  description: 'Real-time IoT sensor monitoring and alerts.',
                },
              },
              {
                path: 'utilization',
                element: <UtilizationReports />,
                handle: {
                  navId: 'equipment-utilization',
                  label: 'Utilization Reports',
                  description: 'Equipment utilization analysis and cost tracking.',
                },
              },
              {
                path: 'roi',
                element: <ROIDepreciationReports />,
                handle: {
                  navId: 'equipment-roi',
                  label: 'ROI & Depreciation',
                  description: 'ROI analysis, depreciation tracking, and disposal recommendations.',
                },
              },
            ],
          },
          {
            path: 'inventory',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('inventory')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'inventory',
              label: getNavMeta('inventory')?.label ?? 'Inventory',
              description: getNavMeta('inventory')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <InventoryLanding />,
              },
            ],
          },
          {
            path: 'procurement',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('procurement')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'procurement',
              label: getNavMeta('procurement')?.label ?? 'Procurement',
              description: getNavMeta('procurement')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <ProcurementLanding />,
              },
            ],
          },
          {
            path: 'finance',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('finance')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'finance',
              label: getNavMeta('finance')?.label ?? 'Financials',
              description: getNavMeta('finance')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <FinanceLanding />,
              },
            ],
          },
          {
            path: 'quality',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('quality')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'quality',
              label: getNavMeta('quality')?.label ?? 'Quality & Safety',
              description: getNavMeta('quality')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <QualityLanding />,
              },
            ],
          },
          {
            path: 'analytics',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('analytics')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'analytics',
              label: getNavMeta('analytics')?.label ?? 'Analytics',
              description: getNavMeta('analytics')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <AnalyticsLanding />,
              },
            ],
          },
          {
            path: 'documents',
            element: (
              <ModuleGuard
                requiredPermissions={getNavMeta('documents')?.requiredPermissions ?? []}
              />
            ),
            handle: {
              navId: 'documents',
              label: getNavMeta('documents')?.label ?? 'Documents',
              description: getNavMeta('documents')?.description ?? '',
            },
            children: [
              {
                index: true,
                element: <DocumentsLanding />,
              },
            ],
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
