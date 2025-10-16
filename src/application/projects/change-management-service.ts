import { Result, UniqueEntityID, Money, type CurrencyCode } from '../../domain/shared';
import type { ChangeOrderRepository } from '../../domain/projects/repositories/change-order-repository';
import type { ProjectRepository } from '../../domain/projects/repositories/project-repository';
import { ChangeOrder, type ChangeOrderImpact } from '../../domain/projects/entities/change-order';
import type { ChangeOrderStatus } from '../../domain/projects/enums/change-order-status';

/**
 * Change Management Service
 * 
 * Handles change order workflows, impact analysis, approval routing, and reporting.
 * Provides comprehensive change control for construction projects.
 */
export class ChangeManagementService {
  private readonly changeOrderRepository: ChangeOrderRepository;
  private readonly projectRepository: ProjectRepository;

  constructor(
    changeOrderRepository: ChangeOrderRepository,
    projectRepository: ProjectRepository
  ) {
    this.changeOrderRepository = changeOrderRepository;
    this.projectRepository = projectRepository;
  }

  /**
   * Create a new change order
   */
  public async createChangeOrder(params: {
    projectId: string;
    title: string;
    description: string;
    reason: string;
    category: 'scope' | 'schedule' | 'cost' | 'quality' | 'risk' | 'other';
    requestedById: string;
    requestedByName: string;
    impact: {
      costImpact: number; // Amount
      costImpactCurrency?: string;
      scheduleImpact: number; // Days
      scopeImpact: string;
    };
    attachments?: string[];
  }): Promise<Result<ChangeOrder>> {
    try {
      const projectId = new UniqueEntityID(params.projectId);
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        return Result.fail('Project not found');
      }

      // Generate change order number
      const changeOrderNumber = await this.changeOrderRepository.getNextChangeOrderNumber(projectId);

      // Create cost impact money object
      const costImpact = Money.create(
        params.impact.costImpact,
        (params.impact.costImpactCurrency || 'USD') as CurrencyCode
      );

      if (!costImpact.isSuccess) {
        return Result.fail(costImpact.error ?? 'Invalid cost impact');
      }

      const impact: ChangeOrderImpact = {
        costImpact: costImpact.value!,
        scheduleImpact: params.impact.scheduleImpact,
        scopeImpact: params.impact.scopeImpact,
      };

      const changeOrderResult = ChangeOrder.create({
        projectId,
        changeOrderNumber,
        title: params.title,
        description: params.description,
        reason: params.reason,
        category: params.category,
        requestedBy: new UniqueEntityID(params.requestedById),
        requestedByName: params.requestedByName,
        status: 'draft',
        impact,
        attachments: params.attachments || [],
        approvals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (!changeOrderResult.isSuccess) {
        return Result.fail(changeOrderResult.error ?? 'Failed to create change order');
      }

      await this.changeOrderRepository.save(changeOrderResult.value!);

      return Result.ok(changeOrderResult.value!);
    } catch (error) {
      return Result.fail(`Failed to create change order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit change order for review
   */
  public async submitChangeOrder(changeOrderId: string): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const submitResult = changeOrder.submit();

      if (!submitResult.isSuccess) {
        return Result.fail(submitResult.error ?? 'Failed to submit change order');
      }

      await this.changeOrderRepository.update(submitResult.value!);

      return Result.ok(submitResult.value!);
    } catch (error) {
      return Result.fail(`Failed to submit change order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start review process for change order
   */
  public async startReview(changeOrderId: string): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const reviewResult = changeOrder.startReview();

      if (!reviewResult.isSuccess) {
        return Result.fail(reviewResult.error ?? 'Failed to start review');
      }

      await this.changeOrderRepository.update(reviewResult.value!);

      return Result.ok(reviewResult.value!);
    } catch (error) {
      return Result.fail(`Failed to start review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Approve change order
   */
  public async approveChangeOrder(params: {
    changeOrderId: string;
    approvedById: string;
    approvedByName: string;
    comments?: string;
  }): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(params.changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const approveResult = changeOrder.approve(
        new UniqueEntityID(params.approvedById),
        params.approvedByName,
        params.comments
      );

      if (!approveResult.isSuccess) {
        return Result.fail(approveResult.error ?? 'Failed to approve change order');
      }

      await this.changeOrderRepository.update(approveResult.value!);

      return Result.ok(approveResult.value!);
    } catch (error) {
      return Result.fail(`Failed to approve change order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reject change order
   */
  public async rejectChangeOrder(params: {
    changeOrderId: string;
    rejectedById: string;
    rejectedByName: string;
    reason: string;
  }): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(params.changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const rejectResult = changeOrder.reject(
        new UniqueEntityID(params.rejectedById),
        params.rejectedByName,
        params.reason
      );

      if (!rejectResult.isSuccess) {
        return Result.fail(rejectResult.error ?? 'Failed to reject change order');
      }

      await this.changeOrderRepository.update(rejectResult.value!);

      return Result.ok(rejectResult.value!);
    } catch (error) {
      return Result.fail(`Failed to reject change order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel change order
   */
  public async cancelChangeOrder(changeOrderId: string): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const cancelResult = changeOrder.cancel();

      if (!cancelResult.isSuccess) {
        return Result.fail(cancelResult.error ?? 'Failed to cancel change order');
      }

      await this.changeOrderRepository.update(cancelResult.value!);

      return Result.ok(cancelResult.value!);
    } catch (error) {
      return Result.fail(`Failed to cancel change order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update change order impact analysis
   */
  public async updateImpactAnalysis(params: {
    changeOrderId: string;
    costImpact: number;
    costImpactCurrency?: string;
    scheduleImpact: number;
    scopeImpact: string;
  }): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(params.changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const costImpact = Money.create(
        params.costImpact,
        (params.costImpactCurrency || 'USD') as CurrencyCode
      );

      if (!costImpact.isSuccess) {
        return Result.fail(costImpact.error ?? 'Invalid cost impact');
      }

      const impact: ChangeOrderImpact = {
        costImpact: costImpact.value!,
        scheduleImpact: params.scheduleImpact,
        scopeImpact: params.scopeImpact,
      };

      const updateResult = changeOrder.updateImpact(impact);

      if (!updateResult.isSuccess) {
        return Result.fail(updateResult.error ?? 'Failed to update impact');
      }

      await this.changeOrderRepository.update(updateResult.value!);

      return Result.ok(updateResult.value!);
    } catch (error) {
      return Result.fail(`Failed to update impact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get change order by ID
   */
  public async getChangeOrderById(changeOrderId: string): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      return Result.ok(changeOrder);
    } catch (error) {
      return Result.fail(`Failed to get change order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get change orders by project
   */
  public async getProjectChangeOrders(projectId: string): Promise<Result<ChangeOrder[]>> {
    try {
      const changeOrders = await this.changeOrderRepository.findByProject(new UniqueEntityID(projectId));

      return Result.ok(changeOrders);
    } catch (error) {
      return Result.fail(`Failed to get project change orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get change orders by status
   */
  public async getChangeOrdersByStatus(
    projectId: string,
    status: ChangeOrderStatus
  ): Promise<Result<ChangeOrder[]>> {
    try {
      const changeOrders = await this.changeOrderRepository.findByStatus(
        new UniqueEntityID(projectId),
        status
      );

      return Result.ok(changeOrders);
    } catch (error) {
      return Result.fail(`Failed to get change orders by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pending approvals
   */
  public async getPendingApprovals(projectId?: string): Promise<Result<ChangeOrder[]>> {
    try {
      const changeOrders = await this.changeOrderRepository.findPendingApprovals(
        projectId ? new UniqueEntityID(projectId) : undefined
      );

      return Result.ok(changeOrders);
    } catch (error) {
      return Result.fail(`Failed to get pending approvals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate change log report for a project
   */
  public async generateChangeLog(projectId: string): Promise<Result<{
    projectId: string;
    totalChangeOrders: number;
    changeOrdersByStatus: Record<ChangeOrderStatus, number>;
    changeOrdersByCategory: Record<string, number>;
    totalCostImpact: number;
    totalScheduleImpact: number;
    approvalRate: number;
    averageApprovalTime: number; // in days
    changeOrders: Array<{
      changeOrderNumber: string;
      title: string;
      status: ChangeOrderStatus;
      category: string;
      costImpact: number;
      scheduleImpact: number;
      requestedByName: string;
      submittedAt?: Date;
      approvedAt?: Date;
      rejectedAt?: Date;
    }>;
  }>> {
    try {
      const changeOrders = await this.changeOrderRepository.findByProject(new UniqueEntityID(projectId));

      // Initialize counters
      const statusCount: Record<string, number> = {};
      const categoryCount: Record<string, number> = {};
      let totalCostImpact = 0;
      let totalScheduleImpact = 0;
      let approvedCount = 0;
      let totalApprovalTime = 0;
      let approvalTimeCount = 0;

      // Process change orders
      const changeOrderData = changeOrders.map(co => {
        // Count by status
        statusCount[co.status] = (statusCount[co.status] || 0) + 1;

        // Count by category
        categoryCount[co.category] = (categoryCount[co.category] || 0) + 1;

        // Sum impacts
        totalCostImpact += co.impact.costImpact.amount;
        totalScheduleImpact += co.impact.scheduleImpact;

        // Calculate approval metrics
        if (co.status === 'approved') {
          approvedCount++;
          
          if (co.submittedAt && co.approvals.length > 0) {
            const lastApproval = co.approvals[co.approvals.length - 1];
            const approvalTime = (lastApproval.approvedAt.getTime() - co.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
            totalApprovalTime += approvalTime;
            approvalTimeCount++;
          }
        }

        return {
          changeOrderNumber: co.changeOrderNumber,
          title: co.title,
          status: co.status,
          category: co.category,
          costImpact: co.impact.costImpact.amount,
          scheduleImpact: co.impact.scheduleImpact,
          requestedByName: co.requestedByName,
          submittedAt: co.submittedAt,
          approvedAt: co.approvals.length > 0 ? co.approvals[co.approvals.length - 1].approvedAt : undefined,
          rejectedAt: co.rejection?.rejectedAt,
        };
      });

      const approvalRate = changeOrders.length > 0 ? (approvedCount / changeOrders.length) * 100 : 0;
      const averageApprovalTime = approvalTimeCount > 0 ? totalApprovalTime / approvalTimeCount : 0;

      return Result.ok({
        projectId,
        totalChangeOrders: changeOrders.length,
        changeOrdersByStatus: statusCount as Record<ChangeOrderStatus, number>,
        changeOrdersByCategory: categoryCount,
        totalCostImpact,
        totalScheduleImpact,
        approvalRate,
        averageApprovalTime,
        changeOrders: changeOrderData,
      });
    } catch (error) {
      return Result.fail(`Failed to generate change log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze impact of all change orders on project
   */
  public async analyzeProjectImpact(projectId: string): Promise<Result<{
    totalCostImpact: number;
    totalScheduleImpact: number;
    costIncreases: number;
    costDecreases: number;
    scheduleDelays: number;
    scheduleAccelerations: number;
    impactByCategory: Record<string, {
      count: number;
      costImpact: number;
      scheduleImpact: number;
    }>;
    criticalChanges: Array<{
      changeOrderNumber: string;
      title: string;
      costImpact: number;
      scheduleImpact: number;
      status: ChangeOrderStatus;
    }>;
  }>> {
    try {
      const changeOrders = await this.changeOrderRepository.findByProject(new UniqueEntityID(projectId));

      let totalCostImpact = 0;
      let totalScheduleImpact = 0;
      let costIncreases = 0;
      let costDecreases = 0;
      let scheduleDelays = 0;
      let scheduleAccelerations = 0;

      const impactByCategory: Record<string, { count: number; costImpact: number; scheduleImpact: number }> = {};

      // Analyze each change order
      changeOrders.forEach(co => {
        const costImpact = co.impact.costImpact.amount;
        const scheduleImpact = co.impact.scheduleImpact;

        // Total impacts
        totalCostImpact += costImpact;
        totalScheduleImpact += scheduleImpact;

        // Cost analysis
        if (costImpact > 0) {
          costIncreases += costImpact;
        } else if (costImpact < 0) {
          costDecreases += Math.abs(costImpact);
        }

        // Schedule analysis
        if (scheduleImpact > 0) {
          scheduleDelays += scheduleImpact;
        } else if (scheduleImpact < 0) {
          scheduleAccelerations += Math.abs(scheduleImpact);
        }

        // Category analysis
        if (!impactByCategory[co.category]) {
          impactByCategory[co.category] = {
            count: 0,
            costImpact: 0,
            scheduleImpact: 0,
          };
        }
        impactByCategory[co.category].count++;
        impactByCategory[co.category].costImpact += costImpact;
        impactByCategory[co.category].scheduleImpact += scheduleImpact;
      });

      // Identify critical changes (high cost or schedule impact)
      const criticalChanges = changeOrders
        .filter(co => 
          Math.abs(co.impact.costImpact.amount) > 10000 || 
          Math.abs(co.impact.scheduleImpact) > 7
        )
        .map(co => ({
          changeOrderNumber: co.changeOrderNumber,
          title: co.title,
          costImpact: co.impact.costImpact.amount,
          scheduleImpact: co.impact.scheduleImpact,
          status: co.status,
        }))
        .sort((a, b) => Math.abs(b.costImpact) - Math.abs(a.costImpact));

      return Result.ok({
        totalCostImpact,
        totalScheduleImpact,
        costIncreases,
        costDecreases,
        scheduleDelays,
        scheduleAccelerations,
        impactByCategory,
        criticalChanges,
      });
    } catch (error) {
      return Result.fail(`Failed to analyze project impact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add attachment to change order
   */
  public async addAttachment(
    changeOrderId: string,
    attachmentUrl: string
  ): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const addResult = changeOrder.addAttachment(attachmentUrl);

      if (!addResult.isSuccess) {
        return Result.fail(addResult.error ?? 'Failed to add attachment');
      }

      await this.changeOrderRepository.update(addResult.value!);

      return Result.ok(addResult.value!);
    } catch (error) {
      return Result.fail(`Failed to add attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove attachment from change order
   */
  public async removeAttachment(
    changeOrderId: string,
    attachmentUrl: string
  ): Promise<Result<ChangeOrder>> {
    try {
      const changeOrder = await this.changeOrderRepository.findById(new UniqueEntityID(changeOrderId));

      if (!changeOrder) {
        return Result.fail('Change order not found');
      }

      const removeResult = changeOrder.removeAttachment(attachmentUrl);

      if (!removeResult.isSuccess) {
        return Result.fail(removeResult.error ?? 'Failed to remove attachment');
      }

      await this.changeOrderRepository.update(removeResult.value!);

      return Result.ok(removeResult.value!);
    } catch (error) {
      return Result.fail(`Failed to remove attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
