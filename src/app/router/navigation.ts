import type { Permission } from '@domain/access-control'

export type AppNavItem = {
  id: string
  label: string
  to: string
  description: string
  requiredPermissions?: Permission[]
}

export type AppNavGroup = {
  id: string
  label: string
  items: AppNavItem[]
}

export const APP_NAVIGATION: AppNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        to: '/',
        description: 'Executive summary across portfolios, schedules, and risk.',
        requiredPermissions: ['projects.read'],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        id: 'projects',
        label: 'Projects',
        to: '/projects',
        description: 'Programme orchestration, EVM tracking, and delivery health.',
        requiredPermissions: ['projects.read'],
      },
      {
        id: 'equipment',
        label: 'Equipment',
        to: '/equipment',
        description: 'Fleet utilization, maintenance windows, and telemetry insights.',
        requiredPermissions: ['equipment.read'],
      },
      {
        id: 'inventory',
        label: 'Inventory',
        to: '/inventory',
        description: 'Material positions, transfers, and stock optimization.',
        requiredPermissions: ['inventory.read'],
      },
      {
        id: 'procurement',
        label: 'Procurement',
        to: '/procurement',
        description: 'Vendors, requisitions, purchase orders, and fulfilment.',
        requiredPermissions: ['procurement.read'],
      },
    ],
  },
  {
    id: 'financial',
    label: 'Financial',
    items: [
      {
        id: 'finance',
        label: 'Financials',
        to: '/finance',
        description: 'Job costing, budgets, billing cycles, and retention.',
        requiredPermissions: ['finance.read'],
      },
    ],
  },
  {
    id: 'quality',
    label: 'Quality & Safety',
    items: [
      {
        id: 'quality',
        label: 'Quality & Safety',
        to: '/quality',
        description: 'Compliance workflows, inspections, and corrective actions.',
        requiredPermissions: ['quality.read', 'safety.read'],
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        to: '/analytics',
        description: 'Dashboards, KPIs, forecasting models, and alerts.',
        requiredPermissions: ['analytics.read'],
      },
    ],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    items: [
      {
        id: 'documents',
        label: 'Documents',
        to: '/documents',
        description: 'Document control, markups, and collaborative reviews.',
        requiredPermissions: ['documents.read'],
      },
    ],
  },
]
