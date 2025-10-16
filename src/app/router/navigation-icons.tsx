import {
  LayoutDashboard,
  Building2,
  Truck,
  Box,
  ShoppingCart,
  DollarSign,
  ShieldCheck,
  BarChart3,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export const NAVIGATION_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  projects: Building2,
  equipment: Truck,
  inventory: Box,
  procurement: ShoppingCart,
  finance: DollarSign,
  financials: DollarSign,
  quality: ShieldCheck,
  analytics: BarChart3,
  documents: FileText,
}
