import { Result, UniqueEntityID } from '@domain/shared'
import {
  Subcontractor,
  type SubcontractorRepository,
  type SubcontractorStatus,
  type ComplianceDocument,
  type SafetyRecord,
  type PerformanceMetric,
} from '@domain/procurement'

export type RegisterSubcontractorInput = {
  companyName: string
  taxId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  address: string
  tradeSpecialties: string[]
  insuranceLimits: {
    generalLiability: number
    workersComp: number
    auto: number
  }
  bondingCapacity?: number
  paymentTerms: string
}

export type AddComplianceDocumentInput = {
  subcontractorId: string
  type: ComplianceDocument['type']
  documentName: string
  documentUrl: string
  issueDate: Date
  expiryDate?: Date
  notes?: string
}

export type VerifyDocumentInput = {
  subcontractorId: string
  documentId: string
  verifiedBy: string
}

export type AddSafetyRecordInput = {
  subcontractorId: string
  incidentType: 'injury' | 'near-miss' | 'violation' | 'observation'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  projectId?: string
  projectName?: string
}

export type UpdatePerformanceInput = {
  subcontractorId: string
  metrics: Partial<PerformanceMetric>
}

export type PrequalifySubcontractorInput = {
  subcontractorId: string
  prequalifiedBy: string
}

export type ComplianceStatus = {
  subcontractorId: string
  companyName: string
  status: SubcontractorStatus
  totalDocuments: number
  verifiedDocuments: number
  expiringDocuments: number
  expiredDocuments: number
  complianceScore: number
  insuranceValid: boolean
  documentsRequiringAttention: ComplianceDocument[]
}

export class SubcontractorService {
  private readonly subcontractorRepository: SubcontractorRepository

  constructor(params: { subcontractorRepository: SubcontractorRepository }) {
    this.subcontractorRepository = params.subcontractorRepository
  }

  async registerSubcontractor(
    input: RegisterSubcontractorInput,
  ): Promise<Result<Subcontractor>> {
    // Check for duplicate tax ID
    const existing = await this.subcontractorRepository.findByTaxId(input.taxId)
    if (existing) {
      return Result.fail('subcontractor with this tax ID already exists')
    }

    if (input.tradeSpecialties.length === 0) {
      return Result.fail('at least one trade specialty is required')
    }

    const now = new Date()

    const subcontractorResult = Subcontractor.create({
      companyName: input.companyName,
      taxId: input.taxId,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      address: input.address,
      status: 'prequalifying',
      tradeSpecialties: input.tradeSpecialties,
      complianceDocuments: [],
      safetyRecords: [],
      performanceMetrics: {
        onTimeCompletionRate: 0,
        qualityScore: 0,
        safetyScore: 100,
        complianceScore: 0,
        averagePaymentDays: 0,
        disputeCount: 0,
      },
      insuranceLimits: input.insuranceLimits,
      bondingCapacity: input.bondingCapacity,
      paymentTerms: input.paymentTerms,
      rating: 0,
      createdAt: now,
      updatedAt: now,
    })

    if (!subcontractorResult.isSuccess || !subcontractorResult.value) {
      return Result.fail(
        subcontractorResult.error ?? 'failed to create subcontractor',
      )
    }

    const subcontractor = subcontractorResult.value
    await this.subcontractorRepository.save(subcontractor)

    return Result.ok(subcontractor)
  }

  async addComplianceDocument(
    input: AddComplianceDocumentInput,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(input.subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    const document: ComplianceDocument = {
      id: crypto.randomUUID(),
      type: input.type,
      documentName: input.documentName,
      documentUrl: input.documentUrl,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
      verified: false,
      notes: input.notes,
    }

    try {
      subcontractor.addComplianceDocument(document)
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to add document',
      )
    }
  }

  async verifyComplianceDocument(
    input: VerifyDocumentInput,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(input.subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const verifiedByResult = this.parseUniqueId(input.verifiedBy, 'verifiedBy')
    if (!verifiedByResult.isSuccess || !verifiedByResult.value) {
      return Result.fail(verifiedByResult.error ?? 'invalid verifiedBy')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    try {
      subcontractor.verifyComplianceDocument(
        input.documentId,
        verifiedByResult.value,
      )
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to verify document',
      )
    }
  }

  async addSafetyRecord(
    input: AddSafetyRecordInput,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(input.subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    let projectIdResult: Result<UniqueEntityID> | undefined
    if (input.projectId) {
      projectIdResult = this.parseUniqueId(input.projectId, 'projectId')
      if (!projectIdResult.isSuccess || !projectIdResult.value) {
        return Result.fail(projectIdResult.error ?? 'invalid projectId')
      }
    }

    const record: SafetyRecord = {
      id: crypto.randomUUID(),
      recordDate: new Date(),
      incidentType: input.incidentType,
      description: input.description,
      severity: input.severity,
      projectId: projectIdResult?.value,
      projectName: input.projectName,
      resolved: false,
    }

    try {
      subcontractor.addSafetyRecord(record)
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to add safety record',
      )
    }
  }

  async updatePerformanceMetrics(
    input: UpdatePerformanceInput,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(input.subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    try {
      subcontractor.updatePerformanceMetrics(input.metrics)
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to update metrics',
      )
    }
  }

  async prequalifySubcontractor(
    input: PrequalifySubcontractorInput,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(input.subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const prequalifiedByResult = this.parseUniqueId(
      input.prequalifiedBy,
      'prequalifiedBy',
    )
    if (!prequalifiedByResult.isSuccess || !prequalifiedByResult.value) {
      return Result.fail(prequalifiedByResult.error ?? 'invalid prequalifiedBy')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    try {
      subcontractor.prequalify(prequalifiedByResult.value)
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to prequalify',
      )
    }
  }

  async activateSubcontractor(
    subcontractorId: string,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    try {
      subcontractor.activate()
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to activate',
      )
    }
  }

  async suspendSubcontractor(
    subcontractorId: string,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    try {
      subcontractor.suspend()
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to suspend',
      )
    }
  }

  async terminateSubcontractor(
    subcontractorId: string,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    try {
      subcontractor.terminate()
      await this.subcontractorRepository.save(subcontractor)

      return Result.ok(subcontractor)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : 'failed to terminate',
      )
    }
  }

  async getSubcontractorById(
    subcontractorId: string,
  ): Promise<Result<Subcontractor>> {
    const idResult = this.parseUniqueId(subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    return Result.ok(subcontractor)
  }

  async listSubcontractorsByStatus(
    status: SubcontractorStatus,
  ): Promise<Result<Subcontractor[]>> {
    const subcontractors = await this.subcontractorRepository.findByStatus(status)
    return Result.ok(subcontractors)
  }

  async listActiveSubcontractors(): Promise<Result<Subcontractor[]>> {
    const subcontractors = await this.subcontractorRepository.listActive()
    return Result.ok(subcontractors)
  }

  async listSubcontractorsByTrade(
    specialty: string,
  ): Promise<Result<Subcontractor[]>> {
    const subcontractors =
      await this.subcontractorRepository.findByTradeSpecialty(specialty)
    return Result.ok(subcontractors)
  }

  async getComplianceStatus(
    subcontractorId: string,
  ): Promise<Result<ComplianceStatus>> {
    const idResult = this.parseUniqueId(subcontractorId, 'subcontractorId')
    if (!idResult.isSuccess || !idResult.value) {
      return Result.fail(idResult.error ?? 'invalid subcontractorId')
    }

    const subcontractor = await this.subcontractorRepository.findById(
      idResult.value,
    )
    if (!subcontractor) {
      return Result.fail('subcontractor not found')
    }

    const totalDocuments = subcontractor.complianceDocuments.length
    const verifiedDocuments = subcontractor.complianceDocuments.filter(
      (doc) => doc.verified,
    ).length
    const expiringDocuments = subcontractor.getExpiringDocuments(30).length
    const expiredDocuments = subcontractor.getExpiredDocuments().length

    const complianceScore =
      totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0

    const hasValidInsurance = subcontractor.complianceDocuments.some(
      (doc) =>
        doc.type === 'insurance-general-liability' &&
        doc.verified &&
        (!doc.expiryDate || doc.expiryDate > new Date()),
    )

    const documentsRequiringAttention = [
      ...subcontractor.getExpiringDocuments(30),
      ...subcontractor.getExpiredDocuments(),
    ].filter((doc) => !doc.verified || doc.expiryDate)

    const status: ComplianceStatus = {
      subcontractorId: subcontractor.id.toString(),
      companyName: subcontractor.companyName,
      status: subcontractor.status,
      totalDocuments,
      verifiedDocuments,
      expiringDocuments,
      expiredDocuments,
      complianceScore,
      insuranceValid: hasValidInsurance,
      documentsRequiringAttention,
    }

    return Result.ok(status)
  }

  async listSubcontractorsWithExpiringDocuments(
    daysThreshold: number = 30,
  ): Promise<Result<Subcontractor[]>> {
    const subcontractors =
      await this.subcontractorRepository.listWithExpiringDocuments(daysThreshold)
    return Result.ok(subcontractors)
  }

  async listSubcontractorsWithExpiredDocuments(): Promise<
    Result<Subcontractor[]>
  > {
    const subcontractors =
      await this.subcontractorRepository.listWithExpiredDocuments()
    return Result.ok(subcontractors)
  }

  private parseUniqueId(value: string, label: string): Result<UniqueEntityID> {
    try {
      return Result.ok(new UniqueEntityID(value))
    } catch (error) {
      return Result.fail(`${label} must be a valid UUID`)
    }
  }
}
