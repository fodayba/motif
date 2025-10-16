import { Result, UniqueEntityID } from '../../domain/shared';
import { GanttTask, GanttChartData } from '../../domain/projects';
import type { TaskRepository, MilestoneRepository } from '../../domain/projects';

/**
 * Gantt Chart Service
 * 
 * Generates Gantt chart data from project tasks and milestones.
 * Handles chart formatting, critical path calculation, and progress tracking.
 */
export class GanttChartService {
  private readonly taskRepository: TaskRepository;
  private readonly milestoneRepository: MilestoneRepository;
  
  constructor(
    taskRepository: TaskRepository,
    milestoneRepository: MilestoneRepository
  ) {
    this.taskRepository = taskRepository;
    this.milestoneRepository = milestoneRepository;
  }

  /**
   * Generate Gantt chart data for a project
   */
  public async generateGanttChart(
    projectId: string,
    projectName: string
  ): Promise<Result<GanttChartData>> {
    try {
      const tasks = await this.taskRepository.findByProject(new UniqueEntityID(projectId));
      const milestones = await this.milestoneRepository.findByProject(new UniqueEntityID(projectId));

      const ganttTasks: GanttTask[] = [];

      // Convert tasks to Gantt tasks
      for (const task of tasks) {
        const ganttTaskResult = GanttTask.create({
          id: task.id.toString(),
          name: task.name,
          startDate: task.plannedStartDate,
          endDate: task.plannedEndDate,
          progress: task.progress || 0,
          dependencyIds: task.dependencies?.map(d => d.predecessorId.toString()) || [],
          isCritical: false,
          isMilestone: false,
          color: this.getTaskColor(task.status),
        });

        if (ganttTaskResult.isSuccess && ganttTaskResult.value) {
          ganttTasks.push(ganttTaskResult.value);
        }
      }

      // Convert milestones to Gantt tasks
      for (const milestone of milestones) {
        const ganttTaskResult = GanttTask.create({
          id: milestone.id.toString(),
          name: milestone.name,
          startDate: milestone.dueDate,
          endDate: milestone.dueDate,
          progress: milestone.status === 'achieved' ? 100 : 0,
          dependencyIds: [],
          isCritical: milestone.critical,
          isMilestone: true,
          color: this.getMilestoneColor(milestone.status),
        });

        if (ganttTaskResult.isSuccess && ganttTaskResult.value) {
          ganttTasks.push(ganttTaskResult.value);
        }
      }

      // Create Gantt chart data
      const chartDataResult = GanttChartData.create({
        projectName,
        tasks: ganttTasks,
        startDate: this.getEarliestDate(ganttTasks),
        endDate: this.getLatestDate(ganttTasks),
      });

      if (!chartDataResult.isSuccess) {
        return Result.fail(chartDataResult.error ?? 'Failed to create Gantt chart data');
      }

      return Result.ok(chartDataResult.value!);
    } catch (error) {
      return Result.fail(`Failed to generate Gantt chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Gantt chart data with custom date range
   */
  public async generateGanttChartWithRange(
    projectId: string,
    projectName: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<GanttChartData>> {
    try {
      const chartResult = await this.generateGanttChart(projectId, projectName);
      
      if (!chartResult.isSuccess || !chartResult.value) {
        return chartResult;
      }

      const chart = chartResult.value;
      
      // Filter tasks within date range
      const filteredTasks = chart.tasks.filter(task => {
        return task.startDate <= endDate && task.endDate >= startDate;
      });

      const newChartResult = GanttChartData.create({
        projectName,
        tasks: filteredTasks,
        startDate,
        endDate,
      });

      if (!newChartResult.isSuccess) {
        return Result.fail(newChartResult.error ?? 'Failed to create filtered chart');
      }

      return Result.ok(newChartResult.value!);
    } catch (error) {
      return Result.fail(`Failed to generate chart with range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get critical path tasks
   */
  public async getCriticalPathTasks(projectId: string): Promise<Result<GanttTask[]>> {
    try {
      const chartResult = await this.generateGanttChart(projectId, 'Project');
      
      if (!chartResult.isSuccess || !chartResult.value) {
        return Result.fail(chartResult.error ?? 'Failed to generate chart');
      }

      const criticalTasks = chartResult.value.getCriticalPathTasks();
      return Result.ok(criticalTasks);
    } catch (error) {
      return Result.fail(`Failed to get critical path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate project timeline statistics
   */
  public async getTimelineStatistics(projectId: string): Promise<Result<{
    totalDuration: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    overdueTasks: number;
    criticalTasks: number;
    milestones: number;
    completedMilestones: number;
    overallProgress: number;
  }>> {
    try {
      const chartResult = await this.generateGanttChart(projectId, 'Project');
      
      if (!chartResult.isSuccess || !chartResult.value) {
        return Result.fail(chartResult.error ?? 'Failed to generate chart');
      }

      const chart = chartResult.value;
      const tasks = chart.tasks;

      const stats = {
        totalDuration: chart.getTotalDurationDays(),
        completedTasks: tasks.filter(t => !t.isMilestone && t.isCompleted()).length,
        inProgressTasks: tasks.filter(t => !t.isMilestone && t.isInProgress()).length,
        notStartedTasks: tasks.filter(t => !t.isMilestone && t.progress === 0).length,
        overdueTasks: tasks.filter(t => !t.isMilestone && t.isOverdue()).length,
        criticalTasks: tasks.filter(t => t.isCritical).length,
        milestones: tasks.filter(t => t.isMilestone).length,
        completedMilestones: tasks.filter(t => t.isMilestone && t.isCompleted()).length,
        overallProgress: chart.getOverallProgress(),
      };

      return Result.ok(stats);
    } catch (error) {
      return Result.fail(`Failed to calculate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tasks grouped by status
   */
  public async getTasksByStatus(projectId: string): Promise<Result<{
    notStarted: GanttTask[];
    inProgress: GanttTask[];
    completed: GanttTask[];
    overdue: GanttTask[];
  }>> {
    try {
      const chartResult = await this.generateGanttChart(projectId, 'Project');
      
      if (!chartResult.isSuccess || !chartResult.value) {
        return Result.fail(chartResult.error ?? 'Failed to generate chart');
      }

      const tasks = chartResult.value.tasks.filter(t => !t.isMilestone);

      return Result.ok({
        notStarted: tasks.filter(t => t.progress === 0 && !t.isOverdue()),
        inProgress: tasks.filter(t => t.isInProgress() && !t.isOverdue()),
        completed: tasks.filter(t => t.isCompleted()),
        overdue: tasks.filter(t => t.isOverdue()),
      });
    } catch (error) {
      return Result.fail(`Failed to group tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export Gantt chart data in various formats
   */
  public async exportGanttChart(
    projectId: string,
    projectName: string,
    format: 'json' | 'csv'
  ): Promise<Result<string>> {
    try {
      const chartResult = await this.generateGanttChart(projectId, projectName);
      
      if (!chartResult.isSuccess || !chartResult.value) {
        return Result.fail(chartResult.error ?? 'Failed to generate chart');
      }

      const chart = chartResult.value;

      if (format === 'json') {
        return Result.ok(JSON.stringify(chart.toChartFormat(), null, 2));
      }

      if (format === 'csv') {
        return Result.ok(this.convertToCSV(chart));
      }

      return Result.fail('Unsupported export format');
    } catch (error) {
      return Result.fail(`Failed to export chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get task color based on status
   */
  private getTaskColor(status: string): string {
    const colorMap: Record<string, string> = {
      'not-started': '#94a3b8',
      'in-progress': '#3b82f6',
      'completed': '#10b981',
      'on-hold': '#f59e0b',
      'cancelled': '#ef4444',
    };

    return colorMap[status] || '#64748b';
  }

  /**
   * Get milestone color based on status
   */
  private getMilestoneColor(status: string): string {
    const colorMap: Record<string, string> = {
      'pending': '#8b5cf6',
      'achieved': '#10b981',
      'missed': '#ef4444',
    };

    return colorMap[status] || '#6366f1';
  }

  /**
   * Get earliest date from tasks
   */
  private getEarliestDate(tasks: GanttTask[]): Date {
    if (tasks.length === 0) {
      return new Date();
    }

    return new Date(
      Math.min(...tasks.map(t => t.startDate.getTime()))
    );
  }

  /**
   * Get latest date from tasks
   */
  private getLatestDate(tasks: GanttTask[]): Date {
    if (tasks.length === 0) {
      return new Date();
    }

    return new Date(
      Math.max(...tasks.map(t => t.endDate.getTime()))
    );
  }

  /**
   * Convert Gantt chart to CSV format
   */
  private convertToCSV(chart: GanttChartData): string {
    const headers = [
      'ID',
      'Name',
      'Start Date',
      'End Date',
      'Duration (Days)',
      'Progress (%)',
      'Dependencies',
      'Critical',
      'Milestone',
      'Status',
    ];

    const rows = chart.tasks.map(task => [
      task.id,
      task.name,
      task.startDate.toISOString().split('T')[0],
      task.endDate.toISOString().split('T')[0],
      task.getDurationDays().toString(),
      task.progress.toString(),
      task.dependencyIds.join(';'),
      task.isCritical ? 'Yes' : 'No',
      task.isMilestone ? 'Yes' : 'No',
      task.isCompleted() ? 'Completed' : task.isInProgress() ? 'In Progress' : 'Not Started',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }
}
