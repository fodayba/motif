import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'
import type { AuthService } from './auth/auth-service'
import type { AccessControlService } from './access-control/access-control-service'
import type { RoleService } from './access-control/role-service'
import type { AuditService } from './audit/audit-service'
import type { FinanceService } from './finance/finance-service'
import type { ProcurementService } from './procurement/procurement-service'
import type { SchedulingService } from './projects/scheduling-service'
import type { QualityService } from './quality/quality-service'
import type { AnalyticsService } from './analytics/analytics-service'

export type ApplicationServices = {
  authService: AuthService
  accessControlService: AccessControlService
  roleService: RoleService
  auditService: AuditService
  financeService: FinanceService
  procurementService: ProcurementService
  schedulingService: SchedulingService
  qualityService: QualityService
  analyticsService: AnalyticsService
}

const ApplicationServicesContext = createContext<ApplicationServices | null>(null)

export const ApplicationServicesProvider = ({
  services,
  children,
}: PropsWithChildren<{ services: ApplicationServices }>) => {
  return (
    <ApplicationServicesContext.Provider value={services}>
      {children}
    </ApplicationServicesContext.Provider>
  )
}

export const useApplicationServices = () => {
  const context = useContext(ApplicationServicesContext)

  if (!context) {
    throw new Error('Application services have not been provided')
  }

  return context
}

export const useAuthService = () => useApplicationServices().authService
export const useAccessControlService = () =>
  useApplicationServices().accessControlService
export const useRoleService = () => useApplicationServices().roleService
export const useAuditService = () => useApplicationServices().auditService
export const useFinanceService = () => useApplicationServices().financeService
export const useProcurementService = () =>
  useApplicationServices().procurementService
export const useSchedulingService = () =>
  useApplicationServices().schedulingService
export const useQualityService = () => useApplicationServices().qualityService
export const useAnalyticsService = () =>
  useApplicationServices().analyticsService
