import { GanttChart } from '@presentation/components/projects/gantt-chart'
import { Task } from '@domain/projects/entities/task'
import { TaskDependency } from '@domain/projects/entities/task-dependency'

// Mock tasks for Gantt chart demo
const mockTasks: Task[] = [
  {
    id: { toString: () => 'task-001' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    name: 'Foundation pour',
    description: 'Phase 2 structural foundation',
    status: 'in-progress' as any,
    plannedStartDate: new Date('2024-10-01'),
    plannedEndDate: new Date('2024-10-15'),
    actualStartDate: new Date('2024-10-01'),
    plannedDuration: 14,
    progress: 65,
    isCritical: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: { toString: () => 'task-002' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    name: 'Steel erection',
    description: 'Structural steel framework',
    status: 'not-started' as any,
    plannedStartDate: new Date('2024-10-16'),
    plannedEndDate: new Date('2024-11-15'),
    plannedDuration: 30,
    progress: 0,
    isCritical: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: { toString: () => 'task-003' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    name: 'MEP rough-in',
    description: 'Mechanical, electrical, plumbing',
    status: 'not-started' as any,
    plannedStartDate: new Date('2024-11-01'),
    plannedEndDate: new Date('2024-12-15'),
    plannedDuration: 45,
    progress: 0,
    isCritical: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: { toString: () => 'task-004' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    name: 'Drywall installation',
    description: 'Interior wall finishing',
    status: 'not-started' as any,
    plannedStartDate: new Date('2024-11-20'),
    plannedEndDate: new Date('2025-01-10'),
    plannedDuration: 51,
    progress: 0,
    isCritical: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: { toString: () => 'task-005' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    name: 'Final inspection',
    description: 'Building final walkthrough',
    status: 'not-started' as any,
    plannedStartDate: new Date('2025-01-11'),
    plannedEndDate: new Date('2025-01-15'),
    plannedDuration: 4,
    progress: 0,
    isCritical: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as any[]

// Mock dependencies
const mockDependencies: TaskDependency[] = [
  {
    id: { toString: () => 'dep-001' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    predecessorId: { toString: () => 'task-001' } as any,
    successorId: { toString: () => 'task-002' } as any,
    type: 'finish-to-start' as any,
    lag: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: { toString: () => 'dep-002' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    predecessorId: { toString: () => 'task-002' } as any,
    successorId: { toString: () => 'task-003' } as any,
    type: 'start-to-start' as any,
    lag: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: { toString: () => 'dep-003' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    predecessorId: { toString: () => 'task-003' } as any,
    successorId: { toString: () => 'task-004' } as any,
    type: 'finish-to-start' as any,
    lag: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: { toString: () => 'dep-004' } as any,
    projectId: { toString: () => 'proj-001' } as any,
    predecessorId: { toString: () => 'task-004' } as any,
    successorId: { toString: () => 'task-005' } as any,
    type: 'finish-to-start' as any,
    lag: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as any[]

export const GanttChartPage = () => {
  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task.name)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <GanttChart
        tasks={mockTasks}
        dependencies={mockDependencies}
        onTaskClick={handleTaskClick}
      />
    </div>
  )
}
