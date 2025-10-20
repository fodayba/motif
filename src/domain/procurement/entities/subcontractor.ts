import { AggregateRoot, Guard, Result, UniqueEntityID } from '../../shared'

export type SubcontractorStatus =
  | 'prequalifying'
  | 'active'
  | 'suspended'
  | 'terminated'

export const SUBCONTRACTOR_STATUSES: SubcontractorStatus[] = [
  'prequalifying',
  'active',
  'suspended',
  'terminated',
]

export type ComplianceDocument = {
  id: string
  type: ComplianceDocumentType
  documentName: string
  documentUrl: string
  issueDate: Date
  expiryDate?: Date
  verified: boolean
  verifiedBy?: UniqueEntityID
  verifiedDate?: Date
  notes?: string
}

export type ComplianceDocumentType =
  | 'license'
  | 'insurance-general-liability'
  | 'insurance-workers-comp'
  | 'insurance-auto'
  | 'bonding'
  | 'safety-certification'
  | 'environmental-permit'
  | 'tax-clearance'
  | 'other'

export type SafetyRecord = {
  id: string
  recordDate: Date
  incidentType: 'injury' | 'near-miss' | 'violation' | 'observation'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  projectId?: UniqueEntityID
  projectName?: string
  resolved: boolean
  resolvedDate?: Date
}

export type PerformanceMetric = {
  onTimeCompletionRate: number
  qualityScore: number
  safetyScore: number
  complianceScore: number
  averagePaymentDays: number
  disputeCount: number
}

type SubcontractorProps = {
  companyName: string
  taxId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  address: string
  status: SubcontractorStatus
  tradeSpecialties: string[]
  complianceDocuments: ComplianceDocument[]
  safetyRecords: SafetyRecord[]
  performanceMetrics: PerformanceMetric
  insuranceLimits: {
    generalLiability: number
    workersComp: number
    auto: number
  }
  bondingCapacity?: number
  paymentTerms: string
  rating: number
  notes?: string
  prequalifiedDate?: Date
  prequalifiedBy?: UniqueEntityID
  activatedDate?: Date
  createdAt: Date
  updatedAt: Date
}

export class Subcontractor extends AggregateRoot<SubcontractorProps> {
  private constructor(props: SubcontractorProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get companyName(): string {
    return this.props.companyName
  }

  get taxId(): string {
    return this.props.taxId
  }

  get contactName(): string {
    return this.props.contactName
  }

  get contactEmail(): string {
    return this.props.contactEmail
  }

  get contactPhone(): string {
    return this.props.contactPhone
  }

  get address(): string {
    return this.props.address
  }

  get status(): SubcontractorStatus {
    return this.props.status
  }

  get tradeSpecialties(): string[] {
    return [...this.props.tradeSpecialties]
  }

  get complianceDocuments(): ComplianceDocument[] {
    return [...this.props.complianceDocuments]
  }

  get safetyRecords(): SafetyRecord[] {
    return [...this.props.safetyRecords]
  }

  get performanceMetrics(): PerformanceMetric {
    return { ...this.props.performanceMetrics }
  }

  get insuranceLimits(): {
    generalLiability: number
    workersComp: number
    auto: number
  } {
    return { ...this.props.insuranceLimits }
  }

  get bondingCapacity(): number | undefined {
    return this.props.bondingCapacity
  }

  get paymentTerms(): string {
    return this.props.paymentTerms
  }

  get rating(): number {
    return this.props.rating
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get prequalifiedDate(): Date | undefined {
    return this.props.prequalifiedDate
  }

  get prequalifiedBy(): UniqueEntityID | undefined {
    return this.props.prequalifiedBy
  }

  get activatedDate(): Date | undefined {
    return this.props.activatedDate
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  public static create(
    props: SubcontractorProps,
    id?: UniqueEntityID,
  ): Result<Subcontractor> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.companyName, argumentName: 'companyName' },
      { argument: props.taxId, argumentName: 'taxId' },
      { argument: props.contactName, argumentName: 'contactName' },
      { argument: props.contactEmail, argumentName: 'contactEmail' },
      { argument: props.contactPhone, argumentName: 'contactPhone' },
      { argument: props.address, argumentName: 'address' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.tradeSpecialties, argumentName: 'tradeSpecialties' },
      { argument: props.insuranceLimits, argumentName: 'insuranceLimits' },
      { argument: props.paymentTerms, argumentName: 'paymentTerms' },
      { argument: props.createdAt, argumentName: 'createdAt' },
      { argument: props.updatedAt, argumentName: 'updatedAt' },
    ])

    if (!guardResult.success) {
      return Result.fail(guardResult.message)
    }

    if (!SUBCONTRACTOR_STATUSES.includes(props.status)) {
      return Result.fail('invalid subcontractor status')
    }

    if (props.tradeSpecialties.length === 0) {
      return Result.fail('subcontractor must have at least one trade specialty')
    }

    if (props.rating < 0 || props.rating > 5) {
      return Result.fail('rating must be between 0 and 5')
    }

    return Result.ok(new Subcontractor(props, id))
  }

  public addComplianceDocument(document: ComplianceDocument) {
    this.props.complianceDocuments = [...this.props.complianceDocuments, document]
    this.touch()
  }

  public verifyComplianceDocument(
    documentId: string,
    verifiedBy: UniqueEntityID,
  ) {
    const doc = this.props.complianceDocuments.find((d) => d.id === documentId)
    if (!doc) {
      throw new Error('compliance document not found')
    }

    doc.verified = true
    doc.verifiedBy = verifiedBy
    doc.verifiedDate = new Date()
    this.touch()
  }

  public addSafetyRecord(record: SafetyRecord) {
    this.props.safetyRecords = [...this.props.safetyRecords, record]
    this.updateSafetyScore()
    this.touch()
  }

  public updatePerformanceMetrics(metrics: Partial<PerformanceMetric>) {
    this.props.performanceMetrics = {
      ...this.props.performanceMetrics,
      ...metrics,
    }
    this.touch()
  }

  public prequalify(prequalifiedBy: UniqueEntityID) {
    if (this.props.status !== 'prequalifying') {
      throw new Error('only prequalifying subcontractors can be prequalified')
    }

    // Check if all required compliance documents are verified
    const hasInsurance = this.props.complianceDocuments.some(
      (doc) =>
        doc.type === 'insurance-general-liability' &&
        doc.verified &&
        (!doc.expiryDate || doc.expiryDate > new Date()),
    )

    if (!hasInsurance) {
      throw new Error('general liability insurance must be verified before prequalification')
    }

    this.props.prequalifiedDate = new Date()
    this.props.prequalifiedBy = prequalifiedBy
    this.touch()
  }

  public activate() {
    if (!this.props.prequalifiedDate) {
      throw new Error('subcontractor must be prequalified before activation')
    }

    this.props.status = 'active'
    this.props.activatedDate = new Date()
    this.touch()
  }

  public suspend() {
    if (this.props.status !== 'active') {
      throw new Error('only active subcontractors can be suspended')
    }

    this.props.status = 'suspended'
    this.touch()
  }

  public terminate() {
    this.props.status = 'terminated'
    this.touch()
  }

  public updateRating(rating: number) {
    if (rating < 0 || rating > 5) {
      throw new Error('rating must be between 0 and 5')
    }

    this.props.rating = rating
    this.touch()
  }

  public getExpiringDocuments(daysThreshold: number = 30): ComplianceDocument[] {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

    return this.props.complianceDocuments.filter(
      (doc) => doc.expiryDate && doc.expiryDate <= thresholdDate && doc.expiryDate > new Date(),
    )
  }

  public getExpiredDocuments(): ComplianceDocument[] {
    const now = new Date()
    return this.props.complianceDocuments.filter(
      (doc) => doc.expiryDate && doc.expiryDate <= now,
    )
  }

  private updateSafetyScore() {
    const recentRecords = this.props.safetyRecords.filter((record) => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return record.recordDate >= sixMonthsAgo
    })

    if (recentRecords.length === 0) {
      this.props.performanceMetrics.safetyScore = 100
      return
    }

    // Calculate safety score based on incident severity and resolution
    const severityWeights = { low: 1, medium: 3, high: 5, critical: 10 }
    const totalDemerits = recentRecords.reduce((sum, record) => {
      const weight = severityWeights[record.severity]
      return sum + (record.resolved ? weight * 0.5 : weight)
    }, 0)

    // Score starts at 100 and decreases with demerits
    const score = Math.max(0, 100 - totalDemerits)
    this.props.performanceMetrics.safetyScore = score
  }

  private touch() {
    this.props.updatedAt = new Date()
  }
}
