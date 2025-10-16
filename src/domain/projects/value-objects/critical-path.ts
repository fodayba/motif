import { Result } from '../../shared/core/result';
import { Duration } from './duration';
import { Float } from './float';

/**
 * Critical Path Value Object
 * Represents the critical path through a project network
 */
export class CriticalPath {
  private readonly _taskIds: string[]
  private readonly _totalDuration: Duration
  private readonly _calculatedAt: Date

  private constructor(
    taskIds: string[],
    totalDuration: Duration,
    calculatedAt: Date
  ) {
    this._taskIds = taskIds
    this._totalDuration = totalDuration
    this._calculatedAt = calculatedAt
  }

  get taskIds(): string[] {
    return [...this._taskIds];
  }

  get totalDuration(): Duration {
    return this._totalDuration;
  }

  get calculatedAt(): Date {
    return this._calculatedAt;
  }

  /**
   * Create critical path
   */
  static create(
    taskIds: string[],
    totalDuration: Duration
  ): Result<CriticalPath> {
    if (taskIds.length === 0) {
      return Result.fail('Critical path must contain at least one task');
    }

    if (totalDuration.toHours() < 0) {
      return Result.fail('Total duration must be non-negative');
    }

    return Result.ok(new CriticalPath(taskIds, totalDuration, new Date()));
  }

  /**
   * Calculate critical path using forward and backward pass
   * Returns the longest path through the project network
   */
  static calculate(
    tasks: CPMTask[]
  ): Result<CriticalPath> {
    if (tasks.length === 0) {
      return Result.fail('Cannot calculate critical path with no tasks');
    }

    // Validate task network
    const validation = CriticalPath.validateNetwork(tasks);
    if (!validation.isSuccess) {
      return Result.fail(validation.error!);
    }

    // Forward pass - calculate earliest start/finish
    const forwardPass = CriticalPath.forwardPass(tasks);
    if (!forwardPass.isSuccess) {
      return Result.fail(forwardPass.error!);
    }

    const tasksWithES = forwardPass.value!;

    // Backward pass - calculate latest start/finish
    const backwardPass = CriticalPath.backwardPass(tasksWithES);
    if (!backwardPass.isSuccess) {
      return Result.fail(backwardPass.error!);
    }

    const tasksWithFloat = backwardPass.value!;

    // Identify critical path (tasks with zero or near-zero float)
    const criticalTasks = tasksWithFloat
      .filter((t: CPMTask) => t.float!.isCritical())
      .sort((a: CPMTask, b: CPMTask) => a.earliestStart!.getTime() - b.earliestStart!.getTime());

    if (criticalTasks.length === 0) {
      return Result.fail('No critical path found');
    }

    // Calculate total duration (project completion time)
    const projectFinish = Math.max(...tasksWithFloat.map((t: CPMTask) => t.earliestFinish!.getTime()));
    const projectStart = Math.min(...tasksWithFloat.map((t: CPMTask) => t.earliestStart!.getTime()));
    const durationHours = (projectFinish - projectStart) / (1000 * 60 * 60);

    const durationResult = Duration.fromHours(durationHours);
    if (!durationResult.isSuccess) {
      return Result.fail(durationResult.error!);
    }
    
    return CriticalPath.create(
      criticalTasks.map((t: CPMTask) => t.id),
      durationResult.value!
    );
  }

  /**
   * Forward pass calculation
   * ES = max(EF of all predecessors)
   * EF = ES + Duration
   */
  private static forwardPass(tasks: CPMTask[]): Result<CPMTask[]> {
    const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));
    
    // Start tasks have ES = project start (0)
    const startTasks = tasks.filter(t => t.predecessorIds.length === 0);
    const projectStart = new Date();
    
    startTasks.forEach(task => {
      const t = taskMap.get(task.id)!;
      t.earliestStart = projectStart;
      t.earliestFinish = new Date(projectStart.getTime() + task.duration.toHours() * 60 * 60 * 1000);
    });

    // Process remaining tasks in topological order
    const processed = new Set<string>();
    const queue = [...startTasks.map(t => t.id)];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (processed.has(currentId)) continue;

      processed.add(currentId);

      // Find successors
      tasks.filter(t => t.predecessorIds.includes(currentId)).forEach(successor => {
        const succ = taskMap.get(successor.id)!;
        
        // Calculate ES as max EF of all predecessors
        const predecessorFinishes = successor.predecessorIds
          .map(pid => taskMap.get(pid)?.earliestFinish)
          .filter(ef => ef !== undefined) as Date[];

        if (predecessorFinishes.length === successor.predecessorIds.length) {
          const maxFinish = new Date(Math.max(...predecessorFinishes.map(d => d.getTime())));
          
          if (!succ.earliestStart || maxFinish.getTime() > succ.earliestStart.getTime()) {
            succ.earliestStart = maxFinish;
            succ.earliestFinish = new Date(maxFinish.getTime() + successor.duration.toHours() * 60 * 60 * 1000);
          }

          if (!queue.includes(successor.id)) {
            queue.push(successor.id);
          }
        }
      });
    }

    // Validate all tasks have ES/EF
    const result = Array.from(taskMap.values());
    if (result.some(t => !t.earliestStart || !t.earliestFinish)) {
      return Result.fail('Failed to calculate earliest times for all tasks');
    }

    return Result.ok(result);
  }

  /**
   * Backward pass calculation
   * LF = min(LS of all successors)
   * LS = LF - Duration
   * Float = LS - ES
   */
  private static backwardPass(tasks: CPMTask[]): Result<CPMTask[]> {
    const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));
    
    // End tasks have LF = EF (project finish)
    const projectFinish = new Date(Math.max(...tasks.map(t => t.earliestFinish!.getTime())));
    const endTasks = tasks.filter(t => 
      !tasks.some(other => other.predecessorIds.includes(t.id))
    );

    endTasks.forEach(task => {
      const t = taskMap.get(task.id)!;
      t.latestFinish = projectFinish;
      t.latestStart = new Date(projectFinish.getTime() - task.duration.toHours() * 60 * 60 * 1000);
    });

    // Process remaining tasks in reverse topological order
    const processed = new Set<string>();
    const queue = [...endTasks.map(t => t.id)];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (processed.has(currentId)) continue;

      const current = taskMap.get(currentId)!;
      processed.add(currentId);

      // Process predecessors
      current.predecessorIds.forEach(predId => {
        const pred = taskMap.get(predId)!;
        
        // Find all successors of this predecessor
        const successorStarts = Array.from(taskMap.values())
          .filter(t => t.predecessorIds.includes(predId))
          .map(t => t.latestStart)
          .filter(ls => ls !== undefined) as Date[];

        if (successorStarts.length > 0) {
          const minStart = new Date(Math.min(...successorStarts.map(d => d.getTime())));
          
          if (!pred.latestFinish || minStart.getTime() < pred.latestFinish.getTime()) {
            pred.latestFinish = minStart;
            pred.latestStart = new Date(minStart.getTime() - pred.duration.toHours() * 60 * 60 * 1000);
          }

          if (!queue.includes(predId)) {
            queue.push(predId);
          }
        }
      });
    }

    // Calculate float for all tasks
    const result = Array.from(taskMap.values());
    result.forEach(task => {
      if (task.latestStart && task.earliestStart) {
        const floatResult = Float.calculateTotalFloat(task.latestStart, task.earliestStart);
        if (floatResult.isSuccess) {
          task.float = floatResult.value;
        }
      }
    });

    return Result.ok(result);
  }

  /**
   * Validate task network (no cycles, valid dependencies)
   */
  private static validateNetwork(tasks: CPMTask[]): Result<boolean> {
    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task) {
        for (const predId of task.predecessorIds) {
          if (hasCycle(predId)) return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (hasCycle(task.id)) {
        return Result.fail('Task network contains a cycle');
      }
    }

    // Validate all predecessors exist
    const taskIds = new Set(tasks.map(t => t.id));
    for (const task of tasks) {
      for (const predId of task.predecessorIds) {
        if (!taskIds.has(predId)) {
          return Result.fail(`Task ${task.id} references non-existent predecessor ${predId}`);
        }
      }
    }

    return Result.ok(true);
  }

  /**
   * Check if task is on critical path
   */
  containsTask(taskId: string): boolean {
    return this._taskIds.includes(taskId);
  }

  /**
   * Get critical path length
   */
  get length(): number {
    return this._taskIds.length;
  }

  /**
   * Format for display
   */
  toString(): string {
    return `Critical Path: ${this._taskIds.join(' → ')} (${this._totalDuration.toString()})`;
  }
}

/**
 * CPM Task interface for calculations
 */
export interface CPMTask {
  id: string;
  duration: Duration;
  predecessorIds: string[];
  earliestStart?: Date;
  earliestFinish?: Date;
  latestStart?: Date;
  latestFinish?: Date;
  float?: Float;
}
