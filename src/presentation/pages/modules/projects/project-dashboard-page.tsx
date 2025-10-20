import { ProjectDashboard } from '@presentation/components/projects/project-dashboard'
import { UniqueEntityID, Money } from '@domain/shared'

// Mock project and tasks for demo
const mockProject = {
  id: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
  name: { value: 'Downtown Office Complex' },
  code: 'DOC-2024',
  description: 'Modern office building with retail space',
  status: 'active',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-12-30'),
  budget: Money.create(12400000, 'USD').value!,
  actualCost: 8900000,
  client: 'Metro Development Corp',
  projectManager: 'Sarah Chen',
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date(),
} as any

const mockTasks = [
  {
    id: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440101'),
    projectId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
    name: 'Foundation pour',
    wbsCode: 'TSK-001',
    description: 'Phase 2 structural foundation',
    status: 'in-progress',
    plannedStartDate: new Date('2024-02-01'),
    plannedEndDate: new Date('2024-02-15'),
    actualStartDate: new Date('2024-02-01'),
    plannedDuration: 14,
    progress: 65,
    isCritical: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440102'),
    projectId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
    name: 'Steel erection',
    wbsCode: 'TSK-002',
    description: 'Structural steel framework',
    status: 'not-started',
    plannedStartDate: new Date('2024-02-16'),
    plannedEndDate: new Date('2024-03-15'),
    plannedDuration: 28,
    progress: 0,
    isCritical: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440103'),
    projectId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
    name: 'MEP rough-in',
    wbsCode: 'TSK-003',
    description: 'Mechanical, electrical, plumbing installation',
    status: 'not-started',
    plannedStartDate: new Date('2024-03-16'),
    plannedEndDate: new Date('2024-04-30'),
    plannedDuration: 45,
    progress: 0,
    isCritical: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as any[]

// Mock scheduling service that returns demo EVM metrics
const mockSchedulingService = {
  calculateEarnedValue: async () => ({
    isSuccess: true,
    value: {
      plannedValue: 8200000,      // PV = 66% of budget (planned progress)
      earnedValue: 8432000,        // EV = 68% of budget (actual progress)  
      actualCost: 8900000,         // AC = actual spend
      scheduleVariance: 232000,    // SV = EV - PV (positive = ahead)
      costVariance: -468000,       // CV = EV - AC (negative = over budget)
      spi: 1.03,                   // SPI = EV / PV (>1 = ahead of schedule)
      cpi: 0.95,                   // CPI = EV / AC (<1 = over budget)
      estimateAtCompletion: 13100000, // EAC = BAC / CPI
      varianceAtCompletion: -700000,  // VAC = BAC - EAC
      estimateToComplete: 4200000,    // ETC = EAC - AC
      toCompletePerformanceIndex: 1.08, // TCPI = (BAC - EV) / (BAC - AC)
    },
  }),
} as any

export const ProjectDashboardPage = () => {

  return (
    <ProjectDashboard
      project={mockProject}
      tasks={mockTasks}
      schedulingService={mockSchedulingService}
    />
  )
}
