import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from '../layouts/app-layout'
import { AuthLayout } from '../layouts/auth-layout'
import { ErrorBoundary } from '../components/error-boundary'
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
  import('@presentation/pages/modules/projects/project-landing').then((module) => ({
    default: module.ProjectLanding,
  })),
)

const ProjectDashboard = lazy(() =>
  import('@presentation/pages/modules/projects').then((module) => ({
    default: module.ProjectDashboardPage,
  })),
)

const GanttChart = lazy(() =>
  import('@presentation/pages/modules/projects').then((module) => ({
    default: module.GanttChartPage,
  })),
)

const ChangeOrderManagement = lazy(() =>
  import('@presentation/pages/modules/projects').then((module) => ({
    default: module.ChangeOrderManagementPage,
  })),
)

const EquipmentLanding = lazy(() =>
  import('@presentation/pages/modules/equipment/equipment-landing').then((module) => ({
    default: module.EquipmentLanding,
  })),
)

const EquipmentDashboard = lazy(() =>
  import('@presentation/pages/modules/equipment/equipment-dashboard').then((module) => ({
    default: module.EquipmentDashboard,
  })),
)

const GPSTrackingMap = lazy(() =>
  import('@presentation/pages/modules/equipment/gps-tracking-map').then((module) => ({
    default: module.GPSTrackingMap,
  })),
)

const MaintenanceCalendar = lazy(() =>
  import('@presentation/pages/modules/equipment/maintenance-calendar').then((module) => ({
    default: module.MaintenanceCalendar,
  })),
)

const CheckInOutForm = lazy(() =>
  import('@presentation/pages/modules/equipment/check-in-out-form').then((module) => ({
    default: module.CheckInOutForm,
  })),
)

const IoTSensorDashboard = lazy(() =>
  import('@presentation/pages/modules/equipment/iot-sensor-dashboard').then((module) => ({
    default: module.IoTSensorDashboard,
  })),
)

const UtilizationReports = lazy(() =>
  import('@presentation/pages/modules/equipment/utilization-reports').then((module) => ({
    default: module.UtilizationReports,
  })),
)

const ROIDepreciationReports = lazy(() =>
  import('@presentation/pages/modules/equipment/roi-depreciation-reports').then((module) => ({
    default: module.ROIDepreciationReports,
  })),
)

const InventoryLanding = lazy(() =>
  import('@presentation/pages/modules/inventory/inventory-landing').then((module) => ({
    default: module.InventoryLanding,
  })),
)

const InventoryDashboard = lazy(() =>
  import('@presentation/pages/modules/inventory/inventory-dashboard').then((module) => ({
    default: module.default,
  })),
)

const BatchTracking = lazy(() =>
  import('@presentation/pages/modules/inventory/batch-tracking').then((module) => ({
    default: module.default,
  })),
)

const TransferManagement = lazy(() =>
  import('@presentation/pages/modules/inventory/transfer-management').then((module) => ({
    default: module.default,
  })),
)

const CycleCount = lazy(() =>
  import('@presentation/pages/modules/inventory/cycle-count').then((module) => ({
    default: module.default,
  })),
)

const RequisitionManagement = lazy(() =>
  import('@presentation/pages/modules/inventory/requisition-management').then((module) => ({
    default: module.default,
  })),
)

const WarehouseOperations = lazy(() =>
  import('@presentation/pages/modules/inventory/warehouse-operations').then((module) => ({
    default: module.default,
  })),
)

const ProcurementLanding = lazy(() =>
  import('@presentation/pages/modules/procurement/procurement-landing').then((module) => ({
    default: module.ProcurementLanding,
  })),
)

const ProcurementDashboard = lazy(() =>
  import('@presentation/pages/modules/procurement/procurement-dashboard').then((module) => ({
    default: module.default,
  })),
)

const VendorManagement = lazy(() =>
  import('@presentation/pages/modules/procurement').then((module) => ({
    default: module.VendorManagement,
  })),
)

const RFQManagement = lazy(() =>
  import('@presentation/pages/modules/procurement').then((module) => ({
    default: module.RFQManagement,
  })),
)

const ThreeWayMatchReview = lazy(() =>
  import('@presentation/pages/modules/procurement').then((module) => ({
    default: module.ThreeWayMatchReview,
  })),
)

const PurchaseOrderManagement = lazy(() =>
  import('@presentation/pages/modules/procurement').then((module) => ({
    default: module.PurchaseOrderManagement,
  })),
)

const SupplierPortal = lazy(() =>
  import('@presentation/pages/modules/procurement').then((module) => ({
    default: module.SupplierPortal,
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
    errorElement: <ErrorBoundary />,
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
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <ErrorBoundary />,
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
              {
                path: 'dashboard',
                element: <ProjectDashboard />,
                handle: {
                  navId: 'project-dashboard',
                  label: 'Project Dashboard',
                  description: 'EVM metrics with SPI, CPI, variance analysis, and forecasts.',
                },
              },
              {
                path: 'gantt',
                element: <GanttChart />,
                handle: {
                  navId: 'project-gantt',
                  label: 'Gantt Chart',
                  description: 'Interactive timeline with dependencies and critical path.',
                },
              },
              {
                path: 'change-orders',
                element: <ChangeOrderManagement />,
                handle: {
                  navId: 'project-changes',
                  label: 'Change Orders',
                  description: 'Track change requests with cost and schedule impact analysis.',
                },
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
              {
                path: 'dashboard',
                element: <InventoryDashboard />,
                handle: {
                  navId: 'inventory-dashboard',
                  label: 'Inventory Dashboard',
                  description: 'Overview of stock levels, valuations, and reorder alerts.',
                },
              },
              {
                path: 'batches',
                element: <BatchTracking />,
                handle: {
                  navId: 'inventory-batches',
                  label: 'Batch Tracking',
                  description: 'Batch expiration, FIFO/FEFO compliance, and certificate management.',
                },
              },
              {
                path: 'transfers',
                element: <TransferManagement />,
                handle: {
                  navId: 'inventory-transfers',
                  label: 'Transfer Management',
                  description: 'Inter-site transfers with approval workflows and route optimization.',
                },
              },
              {
                path: 'cycle-counts',
                element: <CycleCount />,
                handle: {
                  navId: 'inventory-cycle-counts',
                  label: 'Cycle Counts',
                  description: 'Mobile count entry with variance analysis and accuracy metrics.',
                },
              },
              {
                path: 'requisitions',
                element: <RequisitionManagement />,
                handle: {
                  navId: 'inventory-requisitions',
                  label: 'Requisitions',
                  description: 'Material requisition approval and fulfillment tracking.',
                },
              },
              {
                path: 'warehouse',
                element: <WarehouseOperations />,
                handle: {
                  navId: 'inventory-warehouse',
                  label: 'Warehouse Operations',
                  description: 'Pick, pack, ship operations with bin locations and performance metrics.',
                },
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
                element: <Navigate to="dashboard" replace />,
              },
              {
                path: 'dashboard',
                element: <ProcurementDashboard />,
                handle: {
                  navId: 'procurement-dashboard',
                  label: 'Dashboard',
                  description: 'Procurement overview with KPIs and recent activity.',
                },
              },
              {
                path: 'vendors',
                element: <VendorManagement />,
                handle: {
                  navId: 'procurement-vendors',
                  label: 'Vendor Management',
                  description: 'Manage subcontractors, verify compliance, and track performance.',
                },
              },
              {
                path: 'rfq',
                element: <RFQManagement />,
                handle: {
                  navId: 'procurement-rfq',
                  label: 'RFQ Management',
                  description: 'Create RFQs, collect bids, and award contracts.',
                },
              },
              {
                path: 'purchase-orders',
                element: <PurchaseOrderManagement />,
                handle: {
                  navId: 'procurement-purchase-orders',
                  label: 'Purchase Orders',
                  description: 'Create, track, and manage purchase orders from creation to receipt.',
                },
              },
              {
                path: 'supplier-portal',
                element: <SupplierPortal />,
                handle: {
                  navId: 'procurement-supplier-portal',
                  label: 'Supplier Portal',
                  description: 'Vendor self-service portal for order management and collaboration.',
                },
              },
              {
                path: 'three-way-match',
                element: <ThreeWayMatchReview />,
                handle: {
                  navId: 'procurement-three-way-match',
                  label: 'Three-Way Match',
                  description: 'Review and approve purchase order, goods receipt, and invoice matches.',
                },
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
    errorElement: <ErrorBoundary />,
  },
]
