import { Money, Result, UniqueEntityID, Validation } from '@domain/shared'
import type { CurrencyCode } from '@domain/shared'
import {
  BudgetLine,
  CostCode,
  ProjectBudget,
  type BudgetStatus,
  type CostCategory,
  type ProjectBudgetRepository,
} from '@domain/finance'

export type MoneyInput = {
  amount: number
  currency: CurrencyCode
}

export type BudgetLineInput = {
  lineId: string
  costCode: { value: string; description?: string }
  category: CostCategory
  description: string
  planned: MoneyInput
  committed?: MoneyInput
  actual?: MoneyInput
}

export type CreateBudgetInput = {
  projectId: string
  currency: CurrencyCode
  status?: BudgetStatus
  lines: BudgetLineInput[]
  baselineTotal?: MoneyInput
}

export type ApproveBaselineInput = {
  budgetId: string
  total: MoneyInput
}

export type UpdateBudgetLineTotalsInput = {
  budgetId: string
  lineId: string
  plannedAmount?: number
  committedAmount?: number
  actualAmount?: number
}

export type JobCostLineReport = {
  lineId: string
  description: string
  category: CostCategory
  planned: number
  committed: number
  actual: number
  variance: number
}

export type JobCostReport = {
  projectId: string
  budgetId: string
  version: number
  currency: CurrencyCode
  totals: {
    planned: number
    committed: number
    actual: number
    variance: number
    baseline?: number
  }
  lines: JobCostLineReport[]
}

export type RetentionSummary = {
  amount: number
  withheld: number
  release: number
  retentionPercent: number
  currency: CurrencyCode
}

export type ProgressInvoiceInput = {
  budgetId: string
  percentComplete: number
  previouslyBilledAmount: number
  retentionPercent?: number
}

export type ProgressInvoiceSummary = {
  currency: CurrencyCode
  budgetId: string
  percentComplete: number
  plannedValue: number
  earnedValue: number
  previouslyBilled: number
  currentBillable: number
  retentionWithheld: number
  amountDue: number
}

export class FinanceService {
  private readonly repository: ProjectBudgetRepository

  constructor(repository: ProjectBudgetRepository) {
    this.repository = repository
  }

  async createBudgetVersion(input: CreateBudgetInput): Promise<Result<ProjectBudget>> {
    if (input.lines.length === 0) {
      return Result.fail('budget must contain at least one line')
    }

    const projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
    if (!projectIdResult.isSuccess || !projectIdResult.value) {
      return Result.fail(projectIdResult.error ?? 'invalid projectId')
    }

    const latest = await this.repository.findLatestByProject(projectIdResult.value)
    const version = latest ? latest.version + 1 : 1

    const lineResults: BudgetLine[] = []
    for (const line of input.lines) {
      const lineResult = this.createBudgetLine(line, input.currency)
      if (!lineResult.isSuccess || !lineResult.value) {
        return Result.fail(lineResult.error ?? 'invalid budget line')
      }

      lineResults.push(lineResult.value)
    }

    let baselineTotalMoney: Money | undefined
    if (input.baselineTotal) {
      if (input.baselineTotal.currency !== input.currency) {
        return Result.fail('baseline total currency must match budget currency')
      }

      const baselineResult = Money.create(
        input.baselineTotal.amount,
        input.baselineTotal.currency,
      )

      if (!baselineResult.isSuccess || !baselineResult.value) {
        return Result.fail(baselineResult.error ?? 'invalid baseline total')
      }

      baselineTotalMoney = baselineResult.value
    }

    const now = new Date()

    const budgetResult = ProjectBudget.create({
      projectId: projectIdResult.value,
      version,
      status: input.status ?? 'draft',
      currency: input.currency,
      lines: lineResults,
      baselineTotal: baselineTotalMoney,
      createdAt: now,
      updatedAt: now,
    })

    if (!budgetResult.isSuccess || !budgetResult.value) {
      return Result.fail(budgetResult.error ?? 'failed to create budget')
    }

    const budget = budgetResult.value
    await this.repository.save(budget)

    return Result.ok(budget)
  }

  async approveBaseline(input: ApproveBaselineInput): Promise<Result<ProjectBudget>> {
    const budgetResult = await this.loadBudget(input.budgetId)
    if (!budgetResult.isSuccess || !budgetResult.value) {
      return Result.fail(budgetResult.error ?? 'budget not found')
    }

    const budget = budgetResult.value

    if (input.total.currency !== budget.currency) {
      return Result.fail('baseline total currency must match budget currency')
    }

    const baselineResult = Money.create(input.total.amount, input.total.currency)
    if (!baselineResult.isSuccess || !baselineResult.value) {
      return Result.fail(baselineResult.error ?? 'invalid baseline total')
    }

    budget.approveBaseline(baselineResult.value)
    await this.repository.save(budget)

    return Result.ok(budget)
  }

  async recordBudgetLineTotals(
    input: UpdateBudgetLineTotalsInput,
  ): Promise<Result<ProjectBudget>> {
    const budgetResult = await this.loadBudget(input.budgetId)
    if (!budgetResult.isSuccess || !budgetResult.value) {
      return Result.fail(budgetResult.error ?? 'budget not found')
    }

    const budget = budgetResult.value
    const targetLine = budget.lines.find((line) => line.lineId === input.lineId)

    if (!targetLine) {
      return Result.fail('budget line not found')
    }

    const currency = targetLine.planned.currency

    const plannedResult = input.plannedAmount !== undefined
      ? Money.create(input.plannedAmount, currency)
      : Result.ok(targetLine.planned)

    if (!plannedResult.isSuccess || !plannedResult.value) {
      return Result.fail(plannedResult.error ?? 'invalid planned amount')
    }

    const committedResult = input.committedAmount !== undefined
      ? Money.create(input.committedAmount, currency)
      : Result.ok(targetLine.committed)

    if (!committedResult.isSuccess || !committedResult.value) {
      return Result.fail(committedResult.error ?? 'invalid committed amount')
    }

    const actualResult = input.actualAmount !== undefined
      ? Money.create(input.actualAmount, currency)
      : Result.ok(targetLine.actual)

    if (!actualResult.isSuccess || !actualResult.value) {
      return Result.fail(actualResult.error ?? 'invalid actual amount')
    }

    const updatedLineResult = BudgetLine.create({
      lineId: targetLine.lineId,
      costCode: targetLine.costCode,
      category: targetLine.category,
      description: targetLine.description,
      planned: plannedResult.value,
      committed: committedResult.value,
      actual: actualResult.value,
    })

    if (!updatedLineResult.isSuccess || !updatedLineResult.value) {
      return Result.fail(updatedLineResult.error ?? 'failed to update budget line')
    }

    budget.replaceLine(updatedLineResult.value)
    await this.repository.save(budget)

    return Result.ok(budget)
  }

  async generateJobCostReport(budgetId: string): Promise<Result<JobCostReport>> {
    const budgetResult = await this.loadBudget(budgetId)
    if (!budgetResult.isSuccess || !budgetResult.value) {
      return Result.fail(budgetResult.error ?? 'budget not found')
    }

    const budget = budgetResult.value

    const currency = budget.currency as CurrencyCode

    const lines: JobCostLineReport[] = budget.lines.map((line) => ({
      lineId: line.lineId,
      description: line.description,
      category: line.category,
      planned: line.planned.amount,
      committed: line.committed.amount,
      actual: line.actual.amount,
      variance: line.variance,
    }))

    const totals = {
      planned: budget.plannedTotal,
      committed: budget.committedTotal,
      actual: budget.actualTotal,
      variance: budget.plannedTotal - budget.actualTotal,
      baseline: budget.baselineTotal?.amount,
    }

    return Result.ok({
      projectId: budget.projectId.toString(),
      budgetId: budget.id.toString(),
      version: budget.version,
      currency,
      totals,
      lines,
    })
  }

  calculateRetention(input: {
    amount: number
    retentionPercent: number
    currency: CurrencyCode
  }): Result<RetentionSummary> {
    const amountValidation = Validation.nonNegativeNumber(input.amount, 'amount')
    if (!amountValidation.isSuccess) {
      return Result.fail(amountValidation.error ?? 'amount cannot be negative')
    }

    const retentionValidation = Validation.percentage(
      input.retentionPercent,
      'retentionPercent',
    )

    if (!retentionValidation.isSuccess) {
      return Result.fail(retentionValidation.error ?? 'retention percent invalid')
    }

    const retentionAmount = (input.amount * input.retentionPercent) / 100
    const release = input.amount - retentionAmount

    return Result.ok({
      amount: input.amount,
      withheld: retentionAmount,
      release,
      retentionPercent: input.retentionPercent,
      currency: input.currency,
    })
  }

  async prepareProgressInvoice(
    input: ProgressInvoiceInput,
  ): Promise<Result<ProgressInvoiceSummary>> {
    const budgetResult = await this.loadBudget(input.budgetId)
    if (!budgetResult.isSuccess || !budgetResult.value) {
      return Result.fail(budgetResult.error ?? 'budget not found')
    }

    const budget = budgetResult.value
    const currency = budget.currency as CurrencyCode

    const percentValidation = Validation.percentage(
      input.percentComplete,
      'percentComplete',
    )

    if (!percentValidation.isSuccess) {
      return Result.fail(percentValidation.error ?? 'percentComplete invalid')
    }

    const billedValidation = Validation.nonNegativeNumber(
      input.previouslyBilledAmount,
      'previouslyBilledAmount',
    )

    if (!billedValidation.isSuccess) {
      return Result.fail(billedValidation.error ?? 'previously billed amount invalid')
    }

    const plannedValue = budget.plannedTotal
    const earnedValue = (plannedValue * input.percentComplete) / 100
    const remainingBillable = Math.max(earnedValue - input.previouslyBilledAmount, 0)

    let retentionWithheld = 0
    let amountDue = remainingBillable

    if (input.retentionPercent !== undefined) {
      const retentionResult = this.calculateRetention({
        amount: remainingBillable,
        retentionPercent: input.retentionPercent,
        currency,
      })

      if (!retentionResult.isSuccess || !retentionResult.value) {
        return Result.fail(retentionResult.error ?? 'invalid retention calculation')
      }

      retentionWithheld = retentionResult.value.withheld
      amountDue = retentionResult.value.release
    }

    return Result.ok({
      currency,
      budgetId: budget.id.toString(),
      percentComplete: input.percentComplete,
      plannedValue,
      earnedValue,
      previouslyBilled: input.previouslyBilledAmount,
      currentBillable: remainingBillable,
      retentionWithheld,
      amountDue,
    })
  }

  private async loadBudget(budgetId: string): Promise<Result<ProjectBudget>> {
    const budgetIdResult = this.parseUniqueId(budgetId, 'budgetId')
    if (!budgetIdResult.isSuccess || !budgetIdResult.value) {
      return Result.fail(budgetIdResult.error ?? 'invalid budgetId')
    }

    const budget = await this.repository.findById(budgetIdResult.value)
    if (!budget) {
      return Result.fail('budget not found')
    }

    return Result.ok(budget)
  }

  private createBudgetLine(
    input: BudgetLineInput,
    budgetCurrency: CurrencyCode,
  ): Result<BudgetLine> {
    if (input.planned.currency !== budgetCurrency) {
      return Result.fail('planned amount currency must match budget currency')
    }

    if (input.committed && input.committed.currency !== budgetCurrency) {
      return Result.fail('committed amount currency must match budget currency')
    }

    if (input.actual && input.actual.currency !== budgetCurrency) {
      return Result.fail('actual amount currency must match budget currency')
    }

    const costCodeResult = CostCode.create(
      input.costCode.value,
      input.costCode.description,
    )

    if (!costCodeResult.isSuccess || !costCodeResult.value) {
      return Result.fail(costCodeResult.error ?? 'invalid cost code')
    }

    const plannedResult = Money.create(input.planned.amount, budgetCurrency)
    if (!plannedResult.isSuccess || !plannedResult.value) {
      return Result.fail(plannedResult.error ?? 'invalid planned amount')
    }

    const committedResult = Money.create(
      input.committed?.amount ?? 0,
      budgetCurrency,
    )

    if (!committedResult.isSuccess || !committedResult.value) {
      return Result.fail(committedResult.error ?? 'invalid committed amount')
    }

    const actualResult = Money.create(input.actual?.amount ?? 0, budgetCurrency)
    if (!actualResult.isSuccess || !actualResult.value) {
      return Result.fail(actualResult.error ?? 'invalid actual amount')
    }

    return BudgetLine.create({
      lineId: input.lineId,
      costCode: costCodeResult.value,
      category: input.category,
      description: input.description,
      planned: plannedResult.value,
      committed: committedResult.value,
      actual: actualResult.value,
    })
  }

  private parseUniqueId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }
}
