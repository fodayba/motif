import { useState } from 'react'
import { ChangeOrderManagement } from '@presentation/components/projects/change-order-management'
import { ChangeManagementService } from '@application/projects/change-management-service'

export const ChangeOrderManagementPage = () => {
  const [changeManagementService] = useState(() => new ChangeManagementService(
    {} as any, // changeOrderRepository
    {} as any  // projectRepository
  ))

  // Using the first mock project ID
  const projectId = 'proj-001'

  return (
    <div style={{ padding: '2rem' }}>
      <ChangeOrderManagement
        projectId={projectId}
        changeManagementService={changeManagementService}
      />
    </div>
  )
}
