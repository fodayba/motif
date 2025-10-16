import { Result, UniqueEntityID } from '../../domain/shared';
import { Milestone } from '../../domain/projects';
import type { MilestoneRepository, MilestoneStatus } from '../../domain/projects';

/**
 * Milestone Service
 * 
 * Handles milestone lifecycle management, tracking, and reporting.
 * Provides operations for creating, updating, achieving, and monitoring milestones.
 */
export class MilestoneService {
  private readonly milestoneRepository: MilestoneRepository;
  
  constructor(milestoneRepository: MilestoneRepository) {
    this.milestoneRepository = milestoneRepository;
  }

  /**
   * Create a new milestone
   */
  public async createMilestone(params: {
    projectId: string;
    name: string;
    description?: string;
    dueDate: Date;
    critical?: boolean;
    proofRequired?: boolean;
    dependencies?: string[];
  }): Promise<Result<Milestone>> {
    try {
      const milestoneResult = Milestone.create({
        projectId: new UniqueEntityID(params.projectId),
        name: params.name,
        description: params.description,
        dueDate: params.dueDate,
        status: 'pending',
        critical: params.critical ?? false,
        proofRequired: params.proofRequired ?? false,
        dependencies: params.dependencies?.map(id => new UniqueEntityID(id)) ?? [],
        evidence: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (!milestoneResult.isSuccess) {
        return Result.fail(milestoneResult.error ?? 'Failed to create milestone');
      }

      const milestone = milestoneResult.value!;
      await this.milestoneRepository.save(milestone);

      return Result.ok(milestone);
    } catch (error) {
      return Result.fail(`Failed to create milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get milestone by ID
   */
  public async getMilestoneById(milestoneId: string): Promise<Result<Milestone | null>> {
    try {
      const milestone = await this.milestoneRepository.findById(new UniqueEntityID(milestoneId));
      return Result.ok(milestone);
    } catch (error) {
      return Result.fail(`Failed to fetch milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all milestones for a project
   */
  public async getProjectMilestones(projectId: string): Promise<Result<Milestone[]>> {
    try {
      const milestones = await this.milestoneRepository.findByProject(new UniqueEntityID(projectId));
      return Result.ok(milestones);
    } catch (error) {
      return Result.fail(`Failed to fetch project milestones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get milestones by status
   */
  public async getMilestonesByStatus(
    projectId: string,
    status: MilestoneStatus
  ): Promise<Result<Milestone[]>> {
    try {
      const milestones = await this.milestoneRepository.findByStatus(
        new UniqueEntityID(projectId),
        status
      );
      return Result.ok(milestones);
    } catch (error) {
      return Result.fail(`Failed to fetch milestones by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get critical path milestones
   */
  public async getCriticalMilestones(projectId: string): Promise<Result<Milestone[]>> {
    try {
      const milestones = await this.milestoneRepository.findCriticalMilestones(
        new UniqueEntityID(projectId)
      );
      return Result.ok(milestones);
    } catch (error) {
      return Result.fail(`Failed to fetch critical milestones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get overdue milestones
   */
  public async getOverdueMilestones(projectId?: string): Promise<Result<Milestone[]>> {
    try {
      const milestones = await this.milestoneRepository.findOverdueMilestones(
        projectId ? new UniqueEntityID(projectId) : undefined
      );
      return Result.ok(milestones);
    } catch (error) {
      return Result.fail(`Failed to fetch overdue milestones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get upcoming milestones (within specified days)
   */
  public async getUpcomingMilestones(
    projectId: string,
    daysAhead: number = 30
  ): Promise<Result<Milestone[]>> {
    try {
      if (daysAhead <= 0) {
        return Result.fail('Days ahead must be positive');
      }

      const milestones = await this.milestoneRepository.findUpcomingMilestones(
        new UniqueEntityID(projectId),
        daysAhead
      );
      return Result.ok(milestones);
    } catch (error) {
      return Result.fail(`Failed to fetch upcoming milestones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Achieve a milestone
   */
  public async achieveMilestone(
    milestoneId: string,
    completionDate?: Date
  ): Promise<Result<void>> {
    try {
      const milestone = await this.milestoneRepository.findById(new UniqueEntityID(milestoneId));
      if (!milestone) {
        return Result.fail('Milestone not found');
      }

      const achieveResult = milestone.achieve(completionDate);
      if (!achieveResult.isSuccess) {
        return Result.fail(achieveResult.error ?? 'Failed to achieve milestone');
      }

      await this.milestoneRepository.update(milestone);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to achieve milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark milestone as missed
   */
  public async markAsMissed(milestoneId: string): Promise<Result<void>> {
    try {
      const milestone = await this.milestoneRepository.findById(new UniqueEntityID(milestoneId));
      if (!milestone) {
        return Result.fail('Milestone not found');
      }

      const missedResult = milestone.markAsMissed();
      if (!missedResult.isSuccess) {
        return Result.fail(missedResult.error ?? 'Failed to mark as missed');
      }

      await this.milestoneRepository.update(milestone);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to mark milestone as missed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reopen a milestone
   */
  public async reopenMilestone(milestoneId: string): Promise<Result<void>> {
    try {
      const milestone = await this.milestoneRepository.findById(new UniqueEntityID(milestoneId));
      if (!milestone) {
        return Result.fail('Milestone not found');
      }

      const reopenResult = milestone.reopen();
      if (!reopenResult.isSuccess) {
        return Result.fail(reopenResult.error ?? 'Failed to reopen milestone');
      }

      await this.milestoneRepository.update(milestone);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to reopen milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reschedule a milestone
   */
  public async rescheduleMilestone(
    milestoneId: string,
    newDueDate: Date
  ): Promise<Result<void>> {
    try {
      const milestone = await this.milestoneRepository.findById(new UniqueEntityID(milestoneId));
      if (!milestone) {
        return Result.fail('Milestone not found');
      }

      const rescheduleResult = milestone.reschedule(newDueDate);
      if (!rescheduleResult.isSuccess) {
        return Result.fail(rescheduleResult.error ?? 'Failed to reschedule milestone');
      }

      await this.milestoneRepository.update(milestone);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to reschedule milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add evidence to milestone
   */
  public async addEvidence(
    milestoneId: string,
    evidence: {
      submittedBy: string;
      type: 'document' | 'photo' | 'inspection' | 'approval';
      fileUrl?: string;
      notes?: string;
    }
  ): Promise<Result<void>> {
    try {
      const milestone = await this.milestoneRepository.findById(new UniqueEntityID(milestoneId));
      if (!milestone) {
        return Result.fail('Milestone not found');
      }

      const evidenceResult = milestone.addEvidence({
        submittedBy: new UniqueEntityID(evidence.submittedBy),
        submittedAt: new Date(),
        type: evidence.type,
        fileUrl: evidence.fileUrl,
        notes: evidence.notes,
      });

      if (!evidenceResult.isSuccess) {
        return Result.fail(evidenceResult.error ?? 'Failed to add evidence');
      }

      await this.milestoneRepository.update(milestone);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to add evidence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get milestone completion statistics for a project
   */
  public async getMilestoneStatistics(projectId: string): Promise<Result<{
    total: number;
    achieved: number;
    pending: number;
    missed: number;
    approaching: number;
    atRisk: number;
    criticalCount: number;
    completionRate: number;
  }>> {
    try {
      const milestones = await this.milestoneRepository.findByProject(new UniqueEntityID(projectId));
      
      const stats = {
        total: milestones.length,
        achieved: milestones.filter(m => m.status === 'achieved').length,
        pending: milestones.filter(m => m.status === 'pending').length,
        missed: milestones.filter(m => m.status === 'missed').length,
        approaching: milestones.filter(m => m.isDueSoon && m.status === 'pending').length,
        atRisk: milestones.filter(m => m.isOverdue && m.status === 'pending').length,
        criticalCount: milestones.filter(m => m.critical).length,
        completionRate: milestones.length > 0 
          ? Math.round((milestones.filter(m => m.status === 'achieved').length / milestones.length) * 100)
          : 0,
      };

      return Result.ok(stats);
    } catch (error) {
      return Result.fail(`Failed to calculate milestone statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-update milestone statuses based on current date
   */
  public async updateMilestoneStatuses(projectId: string): Promise<Result<number>> {
    try {
      const milestones = await this.milestoneRepository.findByProject(new UniqueEntityID(projectId));
      let updated = 0;

      for (const milestone of milestones) {
        if (milestone.status === 'achieved') {
          continue; // Skip achieved milestones
        }

        // Check if overdue
        if (milestone.isOverdue && milestone.status !== 'missed') {
          await milestone.markAsMissed();
          updated++;
        }
      }

      return Result.ok(updated);
    } catch (error) {
      return Result.fail(`Failed to update milestone statuses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
