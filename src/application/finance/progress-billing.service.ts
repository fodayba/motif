import { Result, UniqueEntityID } from '@domain/shared'
import type {
  ProgressBilling,
  ProgressBillingRepository,
  WIPReport,
} from '@domain/finance'

export type BillingStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'

export type AIAG702Data = {
  projectName: string
  projectAddress: string
  ownerName: string
  contractorName: string
  contractDate: Date
  originalContractSum: number
  netChangeByChangeOrders: number
  contractSumToDate: number
  totalCompletedAndStoredToDate: number
  retainage: number
  totalEarned: number
  lessPreviousCertificates: number
  currentPaymentDue: number
  balanceToFinish: number
}

export type AIAG703LineItem = {
  lineNumber: number
  description: string
  scheduledValue: number
  workCompletedThisPeriod: number
  materialsStoredThisPeriod: number
  totalCompletedAndStored: number
  percentComplete: number
  balanceToFinish: number
  retainagePercent: number
  retainageAmount: number
}

export type AIAG703Data = {
  applicationNumber: number
  period: string
  lineItems: AIAG703LineItem[]
  totals: {
    scheduledValue: number
    workCompletedThisPeriod: number
    materialsStoredThisPeriod: number
    totalCompletedAndStored: number
    retainageAmount: number
  }
}

export type RetainageCalculation = {
  retainagePercent: number
  grossAmount: number
  retainageAmount: number
  netAmount: number
  cumulativeRetainage: number
  retainageReleaseSchedule: Array<{
    milestone: string
    releasePercent: number
    amount: number
  }>
}

export type PercentageOfCompletionBilling = {
  projectId: string
  wipReport: WIPReport
  billingAmount: number
  revenueRecognized: number
  costOfRevenueRecognized: number
  grossProfit: number
  overUnderBilling: number
}

export type LienWaiverTracking = {
  billingId: string
  totalLienWaivers: number
  receivedLienWaivers: number
  pendingLienWaivers: number
  percentReceived: number
  vendors: Array<{
    vendorId: string
    vendorName: string
    amount: number
    status: 'pending' | 'received' | 'conditional' | 'unconditional'
    receivedDate?: Date
    waiverType: 'partial' | 'final'
  }>
}

export type PaymentApplicationWorkflow = {
  billingId: string
  currentStatus: BillingStatus
  submittedDate?: Date
  reviewedDate?: Date
  approvedDate?: Date
  rejectedDate?: Date
  paidDate?: Date
  rejectionReason?: string
  approver?: string
  submitter: string
  workflowHistory: Array<{
    status: BillingStatus
    date: Date
    user: string
    notes?: string
  }>
}

export class ProgressBillingService {
  private readonly progressBillingRepository: ProgressBillingRepository

  constructor(deps: { progressBillingRepository: ProgressBillingRepository }) {
    this.progressBillingRepository = deps.progressBillingRepository
  }

  /**
   * Generate AIA G702 Application and Certificate for Payment
   */
  public async generateAIAG702(billingId: string): Promise<Result<AIAG702Data>> {
    try {
      const billingIdObj = new UniqueEntityID(billingId)
      const billing = await this.progressBillingRepository.findById(billingIdObj)

      if (!billing) {
        return Result.fail('Billing not found')
      }

      // Extract values from billing entity
      const originalContractSum = billing.originalContractSum.amount
      const netChangeByChangeOrders = billing.changeOrdersApproved.amount
      const contractSumToDate = billing.contractSumToDate.amount
      const totalCompletedAndStoredToDate = billing.totalCompletedAndStored.amount
      const retainage = billing.retainage.amount
      const totalEarned = billing.totalEarned.amount
      const lessPreviousCertificates = billing.lessAmountsPreviouslyCertified.amount
      const currentPaymentDue = billing.currentPaymentDue.amount
      const balanceToFinish = billing.balanceToFinish.amount

      return Result.ok({
        projectName: 'Project Name', // Would come from project data
        projectAddress: 'Project Address', // Would come from project data
        ownerName: 'Owner Name', // Would come from project data
        contractorName: 'Contractor Name', // Would come from company settings
        contractDate: billing.periodEndDate,
        originalContractSum,
        netChangeByChangeOrders,
        contractSumToDate,
        totalCompletedAndStoredToDate,
        retainage,
        totalEarned,
        lessPreviousCertificates,
        currentPaymentDue,
        balanceToFinish,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to generate AIA G702: ${message}`)
    }
  }

  /**
   * Generate AIA G703 Continuation Sheet with line items
   */
  public async generateAIAG703(billingId: string): Promise<Result<AIAG703Data>> {
    try {
      const billingIdObj = new UniqueEntityID(billingId)
      const billing = await this.progressBillingRepository.findById(billingIdObj)

      if (!billing) {
        return Result.fail('Billing not found')
      }

      // Convert billing line items to G703 format
      const lineItems: AIAG703LineItem[] = billing.lineItems.map((item: any, index: number) => {
        const scheduledValue = item.scheduledValue.amount
        const totalCompletedAndStored = item.totalCompletedAndStored.amount
        const workCompletedThisPeriod = item.workCompletedThisPeriod.amount
        const materialsStoredThisPeriod = item.materialsStoredThisPeriod.amount
        const percentComplete = item.percentComplete
        const balanceToFinish = item.balanceToFinish.amount
        const retainagePercent = item.retainagePercent
        const retainageAmount = item.retainageAmount.amount

        return {
          lineNumber: index + 1,
          description: item.description || 'Line Item',
          scheduledValue,
          workCompletedThisPeriod,
          materialsStoredThisPeriod,
          totalCompletedAndStored,
          percentComplete,
          balanceToFinish,
          retainagePercent,
          retainageAmount,
        }
      })

      // Calculate totals
      const totals = {
        scheduledValue: lineItems.reduce((sum, item) => sum + item.scheduledValue, 0),
        workCompletedThisPeriod: lineItems.reduce(
          (sum, item) => sum + item.workCompletedThisPeriod,
          0,
        ),
        materialsStoredThisPeriod: lineItems.reduce(
          (sum, item) => sum + item.materialsStoredThisPeriod,
          0,
        ),
        totalCompletedAndStored: lineItems.reduce(
          (sum, item) => sum + item.totalCompletedAndStored,
          0,
        ),
        retainageAmount: lineItems.reduce((sum, item) => sum + item.retainageAmount, 0),
      }

      return Result.ok({
        applicationNumber: billing.applicationNumber,
        period: billing.periodEndDate.toLocaleDateString(),
        lineItems,
        totals,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to generate AIA G703: ${message}`)
    }
  }

  /**
   * Calculate retainage with release schedule
   */
  public calculateRetainage(
    grossAmount: number,
    retainagePercent: number,
    cumulativeRetainage: number,
  ): Result<RetainageCalculation> {
    try {
      const retainageAmount = grossAmount * (retainagePercent / 100)
      const netAmount = grossAmount - retainageAmount
      const totalRetainage = cumulativeRetainage + retainageAmount

      // Default release schedule (can be customized per contract)
      const retainageReleaseSchedule = [
        {
          milestone: 'Substantial Completion',
          releasePercent: 50,
          amount: totalRetainage * 0.5,
        },
        {
          milestone: 'Final Completion',
          releasePercent: 50,
          amount: totalRetainage * 0.5,
        },
      ]

      return Result.ok({
        retainagePercent,
        grossAmount,
        retainageAmount,
        netAmount,
        cumulativeRetainage: totalRetainage,
        retainageReleaseSchedule,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate retainage: ${message}`)
    }
  }

  /**
   * Calculate percentage-of-completion billing
   */
  public calculatePercentageOfCompletionBilling(
    projectId: string,
    wipReport: WIPReport,
  ): Result<PercentageOfCompletionBilling> {
    try {
      const percentComplete = wipReport.percentComplete
      const revisedContractAmount = wipReport.revisedContractAmount.amount

      // Calculate billing amount based on percentage complete
      const billingAmount = revisedContractAmount * (percentComplete / 100)

      // Revenue recognition
      const revenueRecognized = wipReport.earnedRevenue.amount
      const costOfRevenueRecognized = wipReport.costOfEarnedRevenue.amount
      const grossProfit = revenueRecognized - costOfRevenueRecognized

      // Over/under billing
      const overUnderBilling = wipReport.overUnderBillings.amount

      return Result.ok({
        projectId,
        wipReport,
        billingAmount,
        revenueRecognized,
        costOfRevenueRecognized,
        grossProfit,
        overUnderBilling,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to calculate percentage-of-completion billing: ${message}`)
    }
  }

  /**
   * Track lien waivers for a billing
   */
  public async trackLienWaivers(billingId: string): Promise<Result<LienWaiverTracking>> {
    try {
      const billingIdObj = new UniqueEntityID(billingId)
      const billing = await this.progressBillingRepository.findById(billingIdObj)

      
      if (!billing) {
        return Result.fail('Billing not found')
      }

      // Get lien waiver status
      const vendors = billing.lienWaivers.map((waiver) => ({
        vendorId: waiver.id,
        vendorName: 'Vendor', // Would come from vendor lookup
        amount: waiver.amount.amount,
        status: waiver.isReceived ? ('received' as const) : ('pending' as const),
        receivedDate: waiver.receivedDate,
        waiverType: waiver.type === 'final' ? ('final' as const) : ('partial' as const),
      }))

      const totalLienWaivers = vendors.length
      const receivedLienWaivers = vendors.filter((v) => v.status === 'received').length
      const pendingLienWaivers = totalLienWaivers - receivedLienWaivers
      const percentReceived = totalLienWaivers > 0 ? (receivedLienWaivers / totalLienWaivers) * 100 : 0

      return Result.ok({
        billingId,
        totalLienWaivers,
        receivedLienWaivers,
        pendingLienWaivers,
        percentReceived,
        vendors,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to track lien waivers: ${message}`)
    }
  }

  /**
   * Manage payment application workflow
   */
  public async submitForApproval(
    billingId: string,
    submitter: string,
  ): Promise<Result<PaymentApplicationWorkflow>> {
    try {
      const billingIdObj = new UniqueEntityID(billingId)
      const billing = await this.progressBillingRepository.findById(billingIdObj)

      
      if (!billing) {
        return Result.fail('Billing not found')
      }

      // Update billing status to submitted
      const submitterIdObj = new UniqueEntityID(submitter)
      const submitResult = billing.submit(submitterIdObj)
      if (!submitResult.isSuccess) {
        return Result.fail(submitResult.error || 'Failed to submit billing')
      }

      // Save updated billing
      await this.progressBillingRepository.save(billing)

      return Result.ok({
        billingId,
        currentStatus: 'submitted',
        submittedDate: new Date(),
        submitter,
        workflowHistory: [
          {
            status: 'draft',
            date: billing.createdAt,
            user: billing.createdBy.toString(),
          },
          {
            status: 'submitted',
            date: new Date(),
            user: submitter,
          },
        ],
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to submit for approval: ${message}`)
    }
  }

  /**
   * Approve billing application
   */
  public async approveBilling(
    billingId: string,
    approver: string,
    notes?: string,
  ): Promise<Result<PaymentApplicationWorkflow>> {
    try {
      const billingIdObj = new UniqueEntityID(billingId)
      const billing = await this.progressBillingRepository.findById(billingIdObj)

      
      if (!billing) {
        return Result.fail('Billing not found')
      }

      // Update billing status to approved
      const approverIdObj = new UniqueEntityID(approver)
      const approveResult = billing.approve(approverIdObj)
      if (!approveResult.isSuccess) {
        return Result.fail(approveResult.error || 'Failed to approve billing')
      }

      // Save updated billing
      await this.progressBillingRepository.save(billing)

      return Result.ok({
        billingId,
        currentStatus: 'approved',
        approvedDate: new Date(),
        approver,
        submitter: billing.createdBy.toString(),
        workflowHistory: [
          {
            status: 'submitted',
            date: billing.createdAt,
            user: billing.createdBy.toString(),
          },
          {
            status: 'approved',
            date: new Date(),
            user: approver,
            notes,
          },
        ],
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to approve billing: ${message}`)
    }
  }

  /**
   * Reject billing application
   */
  public async rejectBilling(
    billingId: string,
    rejector: string,
    reason: string,
  ): Promise<Result<PaymentApplicationWorkflow>> {
    try {
      const billingIdObj = new UniqueEntityID(billingId)
      const billing = await this.progressBillingRepository.findById(billingIdObj)

      
      if (!billing) {
        return Result.fail('Billing not found')
      }

      // Update billing status to rejected
      const rejectorIdObj = new UniqueEntityID(rejector)
      const rejectResult = billing.reject(rejectorIdObj, reason)
      if (!rejectResult.isSuccess) {
        return Result.fail(rejectResult.error || 'Failed to reject billing')
      }

      // Save updated billing
      await this.progressBillingRepository.save(billing)

      return Result.ok({
        billingId,
        currentStatus: 'rejected',
        rejectedDate: new Date(),
        rejectionReason: reason,
        submitter: billing.createdBy.toString(),
        workflowHistory: [
          {
            status: 'submitted',
            date: billing.createdAt,
            user: billing.createdBy.toString(),
          },
          {
            status: 'rejected',
            date: new Date(),
            user: rejector,
            notes: reason,
          },
        ],
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to reject billing: ${message}`)
    }
  }

  /**
   * Mark billing as paid
   */
  public async markAsPaid(
    billingId: string,
    paidBy: string,
    paymentDate: Date,
  ): Promise<Result<PaymentApplicationWorkflow>> {
    try {
      const billingIdObj = new UniqueEntityID(billingId)
      const billing = await this.progressBillingRepository.findById(billingIdObj)

      
      if (!billing) {
        return Result.fail('Billing not found')
      }

      // Update billing status to paid
      const paymentReference = `PAY-${Date.now()}`
      const payResult = billing.markAsPaid(paymentReference)
      if (!payResult.isSuccess) {
        return Result.fail(payResult.error || 'Failed to mark billing as paid')
      }

      // Save updated billing
      await this.progressBillingRepository.save(billing)

      return Result.ok({
        billingId,
        currentStatus: 'paid',
        paidDate: paymentDate,
        submitter: billing.createdBy.toString(),
        workflowHistory: [
          {
            status: 'approved',
            date: billing.createdAt,
            user: billing.createdBy.toString(),
          },
          {
            status: 'paid',
            date: paymentDate,
            user: paidBy,
          },
        ],
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to mark as paid: ${message}`)
    }
  }

  /**
   * Get pending approval billings
   */
  public async getPendingApprovals(): Promise<Result<ProgressBilling[]>> {
    try {
      return await this.progressBillingRepository.findPendingApproval()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get pending approvals: ${message}`)
    }
  }

  /**
   * Get pending payment billings
   */
  public async getPendingPayments(): Promise<Result<ProgressBilling[]>> {
    try {
      return await this.progressBillingRepository.findPendingPayment()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get pending payments: ${message}`)
    }
  }

  /**
   * Get billings with unreceived lien waivers
   */
  public async getBillingsWithUnreceivedLienWaivers(): Promise<Result<ProgressBilling[]>> {
    try {
      return await this.progressBillingRepository.findWithUnreceivedLienWaivers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get billings with unreceived lien waivers: ${message}`)
    }
  }

  /**
   * Get latest billing for a project
   */
  public async getLatestBilling(projectId: string): Promise<Result<ProgressBilling | null>> {
    try {
      const projectIdObj = new UniqueEntityID(projectId)
      return await this.progressBillingRepository.findLatest(projectIdObj)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return Result.fail(`Failed to get latest billing: ${message}`)
    }
  }
}
