import { Result } from '../shared/core/result';

/**
 * Gantt Task Value Object
 * 
 * Represents a task in a Gantt chart with all necessary data for visualization.
 * Includes position, dependencies, progress, and styling information.
 */
export class GanttTask {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _startDate: Date;
  private readonly _endDate: Date;
  private readonly _progress: number;
  private readonly _dependencyIds: string[];
  private readonly _isCritical: boolean;
  private readonly _isMilestone: boolean;
  private readonly _assignedTo: string[];
  private readonly _color: string;
  private readonly _parent: string | null;

  private constructor(
    id: string,
    name: string,
    startDate: Date,
    endDate: Date,
    progress: number,
    dependencyIds: string[],
    isCritical: boolean,
    isMilestone: boolean,
    assignedTo: string[],
    color: string,
    parent: string | null
  ) {
    this._id = id;
    this._name = name;
    this._startDate = startDate;
    this._endDate = endDate;
    this._progress = progress;
    this._dependencyIds = dependencyIds;
    this._isCritical = isCritical;
    this._isMilestone = isMilestone;
    this._assignedTo = assignedTo;
    this._color = color;
    this._parent = parent;
  }

  public static create(props: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    progress?: number;
    dependencyIds?: string[];
    isCritical?: boolean;
    isMilestone?: boolean;
    assignedTo?: string[];
    color?: string;
    parent?: string | null;
  }): Result<GanttTask> {
    // Validation
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail('Task ID is required');
    }

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('Task name is required');
    }

    if (!(props.startDate instanceof Date) || isNaN(props.startDate.getTime())) {
      return Result.fail('Valid start date is required');
    }

    if (!(props.endDate instanceof Date) || isNaN(props.endDate.getTime())) {
      return Result.fail('Valid end date is required');
    }

    if (props.endDate < props.startDate) {
      return Result.fail('End date must be after start date');
    }

    const progress = props.progress ?? 0;
    if (progress < 0 || progress > 100) {
      return Result.fail('Progress must be between 0 and 100');
    }

    // Default colors
    const defaultColor = props.isCritical ? '#ef4444' : '#3b82f6';

    const task = new GanttTask(
      props.id,
      props.name.trim(),
      props.startDate,
      props.endDate,
      progress,
      props.dependencyIds ?? [],
      props.isCritical ?? false,
      props.isMilestone ?? false,
      props.assignedTo ?? [],
      props.color ?? defaultColor,
      props.parent ?? null
    );

    return Result.ok(task);
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get startDate(): Date {
    return this._startDate;
  }

  public get endDate(): Date {
    return this._endDate;
  }

  public get progress(): number {
    return this._progress;
  }

  public get dependencyIds(): string[] {
    return [...this._dependencyIds];
  }

  public get isCritical(): boolean {
    return this._isCritical;
  }

  public get isMilestone(): boolean {
    return this._isMilestone;
  }

  public get assignedTo(): string[] {
    return [...this._assignedTo];
  }

  public get color(): string {
    return this._color;
  }

  public get parent(): string | null {
    return this._parent;
  }

  /**
   * Get duration in days
   */
  public getDurationDays(): number {
    const ms = this._endDate.getTime() - this._startDate.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if task is in progress
   */
  public isInProgress(): boolean {
    const now = new Date();
    return now >= this._startDate && now <= this._endDate && this._progress < 100;
  }

  /**
   * Check if task is completed
   */
  public isCompleted(): boolean {
    return this._progress === 100;
  }

  /**
   * Check if task is overdue
   */
  public isOverdue(): boolean {
    return new Date() > this._endDate && this._progress < 100;
  }

  /**
   * Convert to plain object for chart libraries
   */
  public toChartData() {
    return {
      id: this._id,
      name: this._name,
      start: this._startDate,
      end: this._endDate,
      progress: this._progress,
      dependencies: this._dependencyIds,
      critical: this._isCritical,
      milestone: this._isMilestone,
      assignedTo: this._assignedTo,
      color: this._color,
      parent: this._parent,
      duration: this.getDurationDays(),
    };
  }
}

/**
 * Gantt Chart Data Value Object
 * 
 * Aggregates all tasks and metadata for complete Gantt chart rendering.
 */
export class GanttChartData {
  private readonly _tasks: GanttTask[];
  private readonly _projectName: string;
  private readonly _startDate: Date;
  private readonly _endDate: Date;
  private readonly _criticalPathIds: string[];

  private constructor(
    tasks: GanttTask[],
    projectName: string,
    startDate: Date,
    endDate: Date,
    criticalPathIds: string[]
  ) {
    this._tasks = tasks;
    this._projectName = projectName;
    this._startDate = startDate;
    this._endDate = endDate;
    this._criticalPathIds = criticalPathIds;
  }

  public static create(props: {
    tasks: GanttTask[];
    projectName: string;
    startDate: Date;
    endDate: Date;
    criticalPathIds?: string[];
  }): Result<GanttChartData> {
    if (!props.tasks || props.tasks.length === 0) {
      return Result.fail('At least one task is required');
    }

    if (!props.projectName || props.projectName.trim().length === 0) {
      return Result.fail('Project name is required');
    }

    if (!(props.startDate instanceof Date) || isNaN(props.startDate.getTime())) {
      return Result.fail('Valid start date is required');
    }

    if (!(props.endDate instanceof Date) || isNaN(props.endDate.getTime())) {
      return Result.fail('Valid end date is required');
    }

    if (props.endDate < props.startDate) {
      return Result.fail('End date must be after start date');
    }

    const chartData = new GanttChartData(
      props.tasks,
      props.projectName.trim(),
      props.startDate,
      props.endDate,
      props.criticalPathIds ?? []
    );

    return Result.ok(chartData);
  }

  // Getters
  public get tasks(): GanttTask[] {
    return [...this._tasks];
  }

  public get projectName(): string {
    return this._projectName;
  }

  public get startDate(): Date {
    return this._startDate;
  }

  public get endDate(): Date {
    return this._endDate;
  }

  public get criticalPathIds(): string[] {
    return [...this._criticalPathIds];
  }

  /**
   * Get total project duration in days
   */
  public getTotalDurationDays(): number {
    const ms = this._endDate.getTime() - this._startDate.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /**
   * Get overall project progress (average of all tasks)
   */
  public getOverallProgress(): number {
    if (this._tasks.length === 0) return 0;
    
    const totalProgress = this._tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / this._tasks.length);
  }

  /**
   * Get critical path tasks
   */
  public getCriticalPathTasks(): GanttTask[] {
    return this._tasks.filter(task => this._criticalPathIds.includes(task.id));
  }

  /**
   * Get tasks by status
   */
  public getTasksByStatus(): {
    notStarted: GanttTask[];
    inProgress: GanttTask[];
    completed: GanttTask[];
    overdue: GanttTask[];
  } {
    const now = new Date();
    
    return {
      notStarted: this._tasks.filter(t => now < t.startDate && t.progress === 0),
      inProgress: this._tasks.filter(t => t.isInProgress()),
      completed: this._tasks.filter(t => t.isCompleted()),
      overdue: this._tasks.filter(t => t.isOverdue()),
    };
  }

  /**
   * Convert to format suitable for chart libraries
   */
  public toChartFormat() {
    return {
      projectName: this._projectName,
      startDate: this._startDate,
      endDate: this._endDate,
      duration: this.getTotalDurationDays(),
      progress: this.getOverallProgress(),
      tasks: this._tasks.map(task => task.toChartData()),
      criticalPath: this._criticalPathIds,
    };
  }
}
