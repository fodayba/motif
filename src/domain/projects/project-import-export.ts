import { Result } from '../shared/core/result';

/**
 * Import Source Types
 */
export const ImportSourceType = {
  MS_PROJECT_XML: 'ms-project-xml',
  MS_PROJECT_MPP: 'ms-project-mpp',
  PRIMAVERA_P6_XER: 'primavera-p6-xer',
  PRIMAVERA_P6_XML: 'primavera-p6-xml',
  CSV: 'csv',
  EXCEL: 'excel',
} as const;

export type ImportSourceType = typeof ImportSourceType[keyof typeof ImportSourceType];

/**
 * Import Status
 */
export const ImportStatus = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

export type ImportStatus = typeof ImportStatus[keyof typeof ImportStatus];

/**
 * Import Warning/Error Types
 */
export interface ImportIssue {
  type: 'error' | 'warning';
  message: string;
  lineNumber?: number;
  field?: string;
}

/**
 * Project Import Result Value Object
 * 
 * Contains the result of importing a project from external sources
 * (MS Project, Primavera P6, etc.)
 */
export class ProjectImportResult {
  private readonly _status: ImportStatus;
  private readonly _sourceType: ImportSourceType;
  private readonly _projectId: string | null;
  private readonly _tasksImported: number;
  private readonly _milestonesImported: number;
  private readonly _resourcesImported: number;
  private readonly _dependenciesImported: number;
  private readonly _issues: ImportIssue[];
  private readonly _importedAt: Date;
  private readonly _durationMs: number;

  private constructor(
    status: ImportStatus,
    sourceType: ImportSourceType,
    projectId: string | null,
    tasksImported: number,
    milestonesImported: number,
    resourcesImported: number,
    dependenciesImported: number,
    issues: ImportIssue[],
    importedAt: Date,
    durationMs: number
  ) {
    this._status = status;
    this._sourceType = sourceType;
    this._projectId = projectId;
    this._tasksImported = tasksImported;
    this._milestonesImported = milestonesImported;
    this._resourcesImported = resourcesImported;
    this._dependenciesImported = dependenciesImported;
    this._issues = issues;
    this._importedAt = importedAt;
    this._durationMs = durationMs;
  }

  public static create(props: {
    status: ImportStatus;
    sourceType: ImportSourceType;
    projectId?: string | null;
    tasksImported?: number;
    milestonesImported?: number;
    resourcesImported?: number;
    dependenciesImported?: number;
    issues?: ImportIssue[];
    importedAt?: Date;
    durationMs?: number;
  }): Result<ProjectImportResult> {
    const result = new ProjectImportResult(
      props.status,
      props.sourceType,
      props.projectId ?? null,
      props.tasksImported ?? 0,
      props.milestonesImported ?? 0,
      props.resourcesImported ?? 0,
      props.dependenciesImported ?? 0,
      props.issues ?? [],
      props.importedAt ?? new Date(),
      props.durationMs ?? 0
    );

    return Result.ok(result);
  }

  // Getters
  public get status(): ImportStatus {
    return this._status;
  }

  public get sourceType(): ImportSourceType {
    return this._sourceType;
  }

  public get projectId(): string | null {
    return this._projectId;
  }

  public get tasksImported(): number {
    return this._tasksImported;
  }

  public get milestonesImported(): number {
    return this._milestonesImported;
  }

  public get resourcesImported(): number {
    return this._resourcesImported;
  }

  public get dependenciesImported(): number {
    return this._dependenciesImported;
  }

  public get issues(): ImportIssue[] {
    return [...this._issues];
  }

  public get importedAt(): Date {
    return this._importedAt;
  }

  public get durationMs(): number {
    return this._durationMs;
  }

  /**
   * Check if import was successful (no errors)
   */
  public isSuccessful(): boolean {
    return this._status === ImportStatus.SUCCESS;
  }

  /**
   * Check if import has errors
   */
  public hasErrors(): boolean {
    return this._issues.some(issue => issue.type === 'error');
  }

  /**
   * Check if import has warnings
   */
  public hasWarnings(): boolean {
    return this._issues.some(issue => issue.type === 'warning');
  }

  /**
   * Get error count
   */
  public getErrorCount(): number {
    return this._issues.filter(issue => issue.type === 'error').length;
  }

  /**
   * Get warning count
   */
  public getWarningCount(): number {
    return this._issues.filter(issue => issue.type === 'warning').length;
  }

  /**
   * Get total imported items
   */
  public getTotalImported(): number {
    return (
      this._tasksImported +
      this._milestonesImported +
      this._resourcesImported +
      this._dependenciesImported
    );
  }

  /**
   * Get import summary
   */
  public getSummary(): string {
    const items = [];
    
    if (this._tasksImported > 0) {
      items.push(`${this._tasksImported} task${this._tasksImported !== 1 ? 's' : ''}`);
    }
    if (this._milestonesImported > 0) {
      items.push(`${this._milestonesImported} milestone${this._milestonesImported !== 1 ? 's' : ''}`);
    }
    if (this._resourcesImported > 0) {
      items.push(`${this._resourcesImported} resource${this._resourcesImported !== 1 ? 's' : ''}`);
    }
    if (this._dependenciesImported > 0) {
      items.push(`${this._dependenciesImported} ${this._dependenciesImported !== 1 ? 'dependencies' : 'dependency'}`);
    }

    return items.length > 0 ? `Imported ${items.join(', ')}` : 'No items imported';
  }

  /**
   * Convert to plain object
   */
  public toObject() {
    return {
      status: this._status,
      sourceType: this._sourceType,
      projectId: this._projectId,
      tasksImported: this._tasksImported,
      milestonesImported: this._milestonesImported,
      resourcesImported: this._resourcesImported,
      dependenciesImported: this._dependenciesImported,
      issues: this._issues,
      importedAt: this._importedAt,
      durationMs: this._durationMs,
      summary: this.getSummary(),
      errorCount: this.getErrorCount(),
      warningCount: this.getWarningCount(),
      totalImported: this.getTotalImported(),
    };
  }
}

/**
 * Export Format Types
 */
export const ExportFormatType = {
  MS_PROJECT_XML: 'ms-project-xml',
  PRIMAVERA_P6_XER: 'primavera-p6-xer',
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json',
} as const;

export type ExportFormatType = typeof ExportFormatType[keyof typeof ExportFormatType];

/**
 * Project Export Result Value Object
 * 
 * Contains the result of exporting a project to external formats
 */
export class ProjectExportResult {
  private readonly _success: boolean;
  private readonly _formatType: ExportFormatType;
  private readonly _filePath: string | null;
  private readonly _fileSize: number;
  private readonly _tasksExported: number;
  private readonly _milestonesExported: number;
  private readonly _resourcesExported: number;
  private readonly _dependenciesExported: number;
  private readonly _error: string | null;
  private readonly _exportedAt: Date;
  private readonly _durationMs: number;

  private constructor(
    success: boolean,
    formatType: ExportFormatType,
    filePath: string | null,
    fileSize: number,
    tasksExported: number,
    milestonesExported: number,
    resourcesExported: number,
    dependenciesExported: number,
    error: string | null,
    exportedAt: Date,
    durationMs: number
  ) {
    this._success = success;
    this._formatType = formatType;
    this._filePath = filePath;
    this._fileSize = fileSize;
    this._tasksExported = tasksExported;
    this._milestonesExported = milestonesExported;
    this._resourcesExported = resourcesExported;
    this._dependenciesExported = dependenciesExported;
    this._error = error;
    this._exportedAt = exportedAt;
    this._durationMs = durationMs;
  }

  public static create(props: {
    success: boolean;
    formatType: ExportFormatType;
    filePath?: string | null;
    fileSize?: number;
    tasksExported?: number;
    milestonesExported?: number;
    resourcesExported?: number;
    dependenciesExported?: number;
    error?: string | null;
    exportedAt?: Date;
    durationMs?: number;
  }): Result<ProjectExportResult> {
    const result = new ProjectExportResult(
      props.success,
      props.formatType,
      props.filePath ?? null,
      props.fileSize ?? 0,
      props.tasksExported ?? 0,
      props.milestonesExported ?? 0,
      props.resourcesExported ?? 0,
      props.dependenciesExported ?? 0,
      props.error ?? null,
      props.exportedAt ?? new Date(),
      props.durationMs ?? 0
    );

    return Result.ok(result);
  }

  // Getters
  public get success(): boolean {
    return this._success;
  }

  public get formatType(): ExportFormatType {
    return this._formatType;
  }

  public get filePath(): string | null {
    return this._filePath;
  }

  public get fileSize(): number {
    return this._fileSize;
  }

  public get tasksExported(): number {
    return this._tasksExported;
  }

  public get milestonesExported(): number {
    return this._milestonesExported;
  }

  public get resourcesExported(): number {
    return this._resourcesExported;
  }

  public get dependenciesExported(): number {
    return this._dependenciesExported;
  }

  public get error(): string | null {
    return this._error;
  }

  public get exportedAt(): Date {
    return this._exportedAt;
  }

  public get durationMs(): number {
    return this._durationMs;
  }

  /**
   * Get file size in human-readable format
   */
  public getFileSizeFormatted(): string {
    const kb = this._fileSize / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  /**
   * Get total exported items
   */
  public getTotalExported(): number {
    return (
      this._tasksExported +
      this._milestonesExported +
      this._resourcesExported +
      this._dependenciesExported
    );
  }

  /**
   * Get export summary
   */
  public getSummary(): string {
    if (!this._success) {
      return `Export failed: ${this._error ?? 'Unknown error'}`;
    }

    const items = [];
    
    if (this._tasksExported > 0) {
      items.push(`${this._tasksExported} task${this._tasksExported !== 1 ? 's' : ''}`);
    }
    if (this._milestonesExported > 0) {
      items.push(`${this._milestonesExported} milestone${this._milestonesExported !== 1 ? 's' : ''}`);
    }
    if (this._resourcesExported > 0) {
      items.push(`${this._resourcesExported} resource${this._resourcesExported !== 1 ? 's' : ''}`);
    }
    if (this._dependenciesExported > 0) {
      items.push(`${this._dependenciesExported} ${this._dependenciesExported !== 1 ? 'dependencies' : 'dependency'}`);
    }

    return items.length > 0 
      ? `Exported ${items.join(', ')} (${this.getFileSizeFormatted()})`
      : 'No items exported';
  }

  /**
   * Convert to plain object
   */
  public toObject() {
    return {
      success: this._success,
      formatType: this._formatType,
      filePath: this._filePath,
      fileSize: this._fileSize,
      fileSizeFormatted: this.getFileSizeFormatted(),
      tasksExported: this._tasksExported,
      milestonesExported: this._milestonesExported,
      resourcesExported: this._resourcesExported,
      dependenciesExported: this._dependenciesExported,
      error: this._error,
      exportedAt: this._exportedAt,
      durationMs: this._durationMs,
      summary: this.getSummary(),
      totalExported: this.getTotalExported(),
    };
  }
}
