import { Result, UniqueEntityID } from '../../domain/shared';
import { TaskDependency } from '../../domain/projects';
import type { TaskDependencyRepository } from '../../domain/projects';

/**
 * Dependency Service
 * 
 * Manages task dependencies, validates dependency graphs, and detects circular dependencies.
 * Provides operations for creating, updating, and analyzing task relationships.
 */
export class DependencyService {
  private readonly dependencyRepository: TaskDependencyRepository;
  
  constructor(dependencyRepository: TaskDependencyRepository) {
    this.dependencyRepository = dependencyRepository;
  }

  /**
   * Create a new task dependency
   */
  public async createDependency(params: {
    projectId: string;
    predecessorId: string;
    successorId: string;
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
    lagDays?: number;
  }): Promise<Result<TaskDependency>> {
    try {
      // Prevent self-dependency
      if (params.predecessorId === params.successorId) {
        return Result.fail('A task cannot depend on itself');
      }

      // Check for circular dependencies before creating
      const circularCheck = await this.wouldCreateCircularDependency(
        params.predecessorId,
        params.successorId
      );

      if (!circularCheck.isSuccess) {
        return Result.fail(circularCheck.error ?? 'Failed to check for circular dependencies');
      }

      if (circularCheck.value) {
        return Result.fail('Creating this dependency would result in a circular dependency');
      }

      const dependencyResult = TaskDependency.create({
        projectId: new UniqueEntityID(params.projectId),
        predecessorId: new UniqueEntityID(params.predecessorId),
        successorId: new UniqueEntityID(params.successorId),
        type: params.type,
        lagDays: params.lagDays ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (!dependencyResult.isSuccess) {
        return Result.fail(dependencyResult.error ?? 'Failed to create dependency');
      }

      const dependency = dependencyResult.value!;
      await this.dependencyRepository.save(dependency);

      return Result.ok(dependency);
    } catch (error) {
      return Result.fail(`Failed to create dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get dependency by ID
   */
  public async getDependencyById(dependencyId: string): Promise<Result<TaskDependency | null>> {
    try {
      const dependency = await this.dependencyRepository.findById(new UniqueEntityID(dependencyId));
      return Result.ok(dependency);
    } catch (error) {
      return Result.fail(`Failed to fetch dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all dependencies for a task (both predecessor and successor relationships)
   */
  public async getTaskDependencies(taskId: string): Promise<Result<{
    predecessors: TaskDependency[];
    successors: TaskDependency[];
  }>> {
    try {
      const taskUniqueId = new UniqueEntityID(taskId);
      
      const predecessors = await this.dependencyRepository.findBySuccessor(taskUniqueId);
      const successors = await this.dependencyRepository.findByPredecessor(taskUniqueId);

      return Result.ok({
        predecessors,
        successors,
      });
    } catch (error) {
      return Result.fail(`Failed to fetch task dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all dependencies for a project
   */
  public async getProjectDependencies(projectId: string): Promise<Result<TaskDependency[]>> {
    try {
      const dependencies = await this.dependencyRepository.findByProject(new UniqueEntityID(projectId));
      return Result.ok(dependencies);
    } catch (error) {
      return Result.fail(`Failed to fetch project dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update dependency lag
   */
  public async updateDependencyLag(
    dependencyId: string,
    lagDays: number
  ): Promise<Result<void>> {
    try {
      const dependency = await this.dependencyRepository.findById(new UniqueEntityID(dependencyId));
      if (!dependency) {
        return Result.fail('Dependency not found');
      }

      const updateResult = dependency.updateLag(lagDays);
      if (!updateResult.isSuccess) {
        return Result.fail(updateResult.error ?? 'Failed to update lag');
      }

      await this.dependencyRepository.update(dependency);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to update dependency lag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a dependency
   */
  public async deleteDependency(dependencyId: string): Promise<Result<void>> {
    try {
      await this.dependencyRepository.delete(new UniqueEntityID(dependencyId));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to delete dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if creating a dependency would result in a circular dependency
   */
  public async wouldCreateCircularDependency(
    predecessorId: string,
    successorId: string
  ): Promise<Result<boolean>> {
    try {
      // Check if successorId has a path to predecessorId
      const hasPath = await this.hasPathBetweenTasks(successorId, predecessorId);
      return Result.ok(hasPath);
    } catch (error) {
      return Result.fail(`Failed to check for circular dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if there's a dependency path from startTaskId to endTaskId
   */
  private async hasPathBetweenTasks(startTaskId: string, endTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue: string[] = [startTaskId];

    while (queue.length > 0) {
      const currentTaskId = queue.shift()!;
      
      if (currentTaskId === endTaskId) {
        return true;
      }

      if (visited.has(currentTaskId)) {
        continue;
      }

      visited.add(currentTaskId);

      // Get all successors of the current task
      const successors = await this.dependencyRepository.findByPredecessor(
        new UniqueEntityID(currentTaskId)
      );

      for (const dependency of successors) {
        const successorId = dependency.successorId.toString();
        if (!visited.has(successorId)) {
          queue.push(successorId);
        }
      }
    }

    return false;
  }

  /**
   * Get all dependencies in the path between two tasks
   */
  public async getDependencyPath(
    startTaskId: string,
    endTaskId: string
  ): Promise<Result<TaskDependency[]>> {
    try {
      const path: TaskDependency[] = [];
      const visited = new Set<string>();
      const found = await this.findPathRecursive(
        startTaskId,
        endTaskId,
        visited,
        path
      );

      if (!found) {
        return Result.ok([]);
      }

      return Result.ok(path);
    } catch (error) {
      return Result.fail(`Failed to find dependency path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findPathRecursive(
    currentTaskId: string,
    targetTaskId: string,
    visited: Set<string>,
    path: TaskDependency[]
  ): Promise<boolean> {
    if (currentTaskId === targetTaskId) {
      return true;
    }

    if (visited.has(currentTaskId)) {
      return false;
    }

    visited.add(currentTaskId);

    const successors = await this.dependencyRepository.findByPredecessor(
      new UniqueEntityID(currentTaskId)
    );

    for (const dependency of successors) {
      const successorId = dependency.successorId.toString();
      path.push(dependency);

      const found = await this.findPathRecursive(
        successorId,
        targetTaskId,
        visited,
        path
      );

      if (found) {
        return true;
      }

      path.pop();
    }

    return false;
  }

  /**
   * Perform topological sort on project tasks
   * Returns tasks in execution order (respecting dependencies)
   */
  public async getTopologicalSort(projectId: string): Promise<Result<string[]>> {
    try {
      const dependencies = await this.dependencyRepository.findByProject(
        new UniqueEntityID(projectId)
      );

      // Build adjacency list and in-degree map
      const adjacencyList = new Map<string, string[]>();
      const inDegree = new Map<string, number>();
      const allTasks = new Set<string>();

      for (const dep of dependencies) {
        const pred = dep.predecessorId.toString();
        const succ = dep.successorId.toString();

        allTasks.add(pred);
        allTasks.add(succ);

        if (!adjacencyList.has(pred)) {
          adjacencyList.set(pred, []);
        }
        adjacencyList.get(pred)!.push(succ);

        inDegree.set(succ, (inDegree.get(succ) || 0) + 1);
        if (!inDegree.has(pred)) {
          inDegree.set(pred, 0);
        }
      }

      // Kahn's algorithm for topological sort
      const queue: string[] = [];
      const result: string[] = [];

      // Add all tasks with no dependencies
      for (const [task, degree] of inDegree.entries()) {
        if (degree === 0) {
          queue.push(task);
        }
      }

      while (queue.length > 0) {
        const task = queue.shift()!;
        result.push(task);

        const neighbors = adjacencyList.get(task) || [];
        for (const neighbor of neighbors) {
          const newDegree = (inDegree.get(neighbor) || 0) - 1;
          inDegree.set(neighbor, newDegree);

          if (newDegree === 0) {
            queue.push(neighbor);
          }
        }
      }

      // Check for circular dependencies
      if (result.length !== allTasks.size) {
        return Result.fail('Circular dependencies detected in project');
      }

      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Failed to perform topological sort: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate all dependencies in a project
   */
  public async validateProjectDependencies(projectId: string): Promise<Result<{
    valid: boolean;
    errors: string[];
  }>> {
    try {
      const errors: string[] = [];

      // Get topological sort to check for cycles
      const sortResult = await this.getTopologicalSort(projectId);
      if (!sortResult.isSuccess) {
        errors.push(sortResult.error ?? 'Topological sort failed');
      }

      // Additional validation can be added here
      // e.g., check for invalid lag values, missing tasks, etc.

      return Result.ok({
        valid: errors.length === 0,
        errors,
      });
    } catch (error) {
      return Result.fail(`Failed to validate dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
