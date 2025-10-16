import { Result, UniqueEntityID } from '../../domain/shared';
import { ProjectImportResult, ProjectExportResult, ImportSourceType, ExportFormatType, type ImportIssue, ImportStatus } from '../../domain/projects';
import type { TaskRepository, MilestoneRepository, TaskDependencyRepository } from '../../domain/projects';

/**
 * Project Integration Service
 * 
 * Handles import/export of project data from/to external formats:
 * - MS Project XML (.xml)
 * - Primavera P6 XER (.xer)
 * - CSV/Excel formats
 * 
 * Provides parsing, validation, and transformation capabilities.
 */
export class ProjectIntegrationService {
  private readonly taskRepository: TaskRepository;
  private readonly milestoneRepository: MilestoneRepository;
  private readonly dependencyRepository: TaskDependencyRepository;
  
  constructor(
    taskRepository: TaskRepository,
    milestoneRepository: MilestoneRepository,
    dependencyRepository: TaskDependencyRepository
  ) {
    this.taskRepository = taskRepository;
    this.milestoneRepository = milestoneRepository;
    this.dependencyRepository = dependencyRepository;
  }

  /**
   * Import project from MS Project XML format
   */
  public async importFromMSProject(
    projectId: string,
    xmlContent: string
  ): Promise<Result<ProjectImportResult>> {
    const startTime = Date.now();
    const issues: string[] = [];
    let tasksImported = 0;
    let milestonesImported = 0;
    let dependenciesImported = 0;

    try {
      // Parse MS Project XML
      // Note: This is a placeholder - actual implementation would use DOMParser or xml2js
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        issues.push('XML parsing error: Invalid MS Project XML format');
        return this.createImportResult(
          ImportSourceType.MS_PROJECT_XML,
          'FAILED',
          tasksImported,
          milestonesImported,
          0,
          dependenciesImported,
          issues,
          Date.now() - startTime
        );
      }

      // Extract tasks from XML
      const taskNodes = xmlDoc.querySelectorAll('Task');
      
      for (const taskNode of Array.from(taskNodes)) {
        try {
          const id = taskNode.querySelector('UID')?.textContent;
          const name = taskNode.querySelector('Name')?.textContent;
          const start = taskNode.querySelector('Start')?.textContent;
          const finish = taskNode.querySelector('Finish')?.textContent;
          const isMilestone = taskNode.querySelector('Milestone')?.textContent === '1';

          if (!id || !name || !start || !finish) {
            issues.push(`Skipped task with missing required fields`);
            continue;
          }

          // TODO: Create task/milestone entity and save to repository
          // This would involve mapping MS Project fields to our domain model
          
          if (isMilestone) {
            milestonesImported++;
          } else {
            tasksImported++;
          }
        } catch (error) {
          issues.push(`Error importing task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Extract dependencies (PredecessorLink)
      const linkNodes = xmlDoc.querySelectorAll('PredecessorLink');
      
      for (const linkNode of Array.from(linkNodes)) {
        try {
          const predecessorUID = linkNode.querySelector('PredecessorUID')?.textContent;
          const successorUID = linkNode.querySelector('SuccessorUID')?.textContent;
          const linkType = linkNode.querySelector('Type')?.textContent;

          if (!predecessorUID || !successorUID) {
            issues.push('Skipped dependency with missing task references');
            continue;
          }

          // TODO: Create TaskDependency entity and save
          dependenciesImported++;
        } catch (error) {
          issues.push(`Error importing dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const status = issues.some(i => i.includes('Error')) ? 'PARTIAL' : 'SUCCESS';
      
      return this.createImportResult(
        ImportSourceType.MS_PROJECT_XML,
        status,
        tasksImported,
        milestonesImported,
        0,
        dependenciesImported,
        issues,
        Date.now() - startTime
      );
    } catch (error) {
      issues.push(`Fatal import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.createImportResult(
        ImportSourceType.MS_PROJECT_XML,
        'FAILED',
        tasksImported,
        milestonesImported,
        0,
        dependenciesImported,
        issues,
        Date.now() - startTime
      );
    }
  }

  /**
   * Import project from Primavera P6 XER format
   */
  public async importFromPrimaveraP6(
    projectId: string,
    xerContent: string
  ): Promise<Result<ProjectImportResult>> {
    const startTime = Date.now();
    const issues: string[] = [];
    let tasksImported = 0;
    let milestonesImported = 0;
    let dependenciesImported = 0;

    try {
      // Parse XER format (tab-delimited text format)
      const lines = xerContent.split('\n');
      let currentTable = '';
      const tables: Record<string, string[][]> = {};

      for (const line of lines) {
        if (line.startsWith('%T')) {
          // Table definition
          currentTable = line.split('\t')[1];
          tables[currentTable] = [];
        } else if (line.startsWith('%F')) {
          // Field definitions (column headers) - can be stored if needed
          continue;
        } else if (line.startsWith('%R') && currentTable) {
          // Row data
          const values = line.substring(3).split('\t');
          tables[currentTable].push(values);
        }
      }

      // Import tasks from TASK table
      const taskTable = tables['TASK'] || [];
      for (const row of taskTable) {
        try {
          // XER TASK columns (typical): task_id, proj_id, wbs_id, task_code, task_name, task_type, duration, etc.
          // Note: Actual column indices depend on XER file structure
          const taskType = row[5] || ''; // Typically task_type column
          const isMilestone = taskType === 'TT_Mile';

          if (isMilestone) {
            milestonesImported++;
          } else {
            tasksImported++;
          }
        } catch (error) {
          issues.push(`Error importing P6 task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Import dependencies from TASKPRED table
      const predTable = tables['TASKPRED'] || [];
      for (const row of predTable) {
        try {
          // TODO: Create TaskDependency entity
          dependenciesImported++;
        } catch (error) {
          issues.push(`Error importing P6 dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const status = issues.some(i => i.includes('Error')) ? 'PARTIAL' : 'SUCCESS';
      
      return this.createImportResult(
        ImportSourceType.PRIMAVERA_P6_XER,
        status,
        tasksImported,
        milestonesImported,
        0,
        dependenciesImported,
        issues,
        Date.now() - startTime
      );
    } catch (error) {
      issues.push(`Fatal import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.createImportResult(
        ImportSourceType.PRIMAVERA_P6_XER,
        'FAILED',
        tasksImported,
        milestonesImported,
        0,
        dependenciesImported,
        issues,
        Date.now() - startTime
      );
    }
  }

  /**
   * Import project from CSV format
   */
  public async importFromCSV(
    projectId: string,
    csvContent: string
  ): Promise<Result<ProjectImportResult>> {
    const startTime = Date.now();
    const issues: string[] = [];
    let tasksImported = 0;
    let milestonesImported = 0;

    try {
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Validate required columns
      const requiredColumns = ['name', 'start_date', 'end_date'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        issues.push(`Missing required columns: ${missingColumns.join(', ')}`);
        return this.createImportResult(
          ImportSourceType.CSV,
          'FAILED',
          0,
          0,
          0,
          0,
          issues,
          Date.now() - startTime
        );
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const rowData: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          const isMilestone = rowData['milestone']?.toLowerCase() === 'yes' || 
                             rowData['milestone']?.toLowerCase() === 'true';

          // TODO: Create task/milestone entity
          
          if (isMilestone) {
            milestonesImported++;
          } else {
            tasksImported++;
          }
        } catch (error) {
          issues.push(`Error importing CSV row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const status = issues.some(i => i.includes('Error')) ? 'PARTIAL' : 'SUCCESS';
      
      return this.createImportResult(
        ImportSourceType.CSV,
        status,
        tasksImported,
        milestonesImported,
        0,
        0,
        issues,
        Date.now() - startTime
      );
    } catch (error) {
      issues.push(`Fatal import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.createImportResult(
        ImportSourceType.CSV,
        'FAILED',
        tasksImported,
        milestonesImported,
        0,
        0,
        issues,
        Date.now() - startTime
      );
    }
  }

  /**
   * Export project to MS Project XML format
   */
  public async exportToMSProject(
    projectId: string,
    filePath: string
  ): Promise<Result<ProjectExportResult>> {
    const startTime = Date.now();
    try {
      const tasks = await this.taskRepository.findByProject(new UniqueEntityID(projectId));
      const milestones = await this.milestoneRepository.findByProject(new UniqueEntityID(projectId));
      const dependencies = await this.dependencyRepository.findByProject(new UniqueEntityID(projectId));

      // Build MS Project XML structure
      let xmlData = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xmlData += '<Project xmlns="http://schemas.microsoft.com/project">\n';
      
      // Add tasks
      xmlData += '  <Tasks>\n';
      
      for (const task of tasks) {
        xmlData += '    <Task>\n';
        xmlData += `      <UID>${task.id.toString()}</UID>\n`;
        xmlData += `      <Name>${this.escapeXml(task.name)}</Name>\n`;
        xmlData += `      <Start>${task.plannedStartDate.toISOString()}</Start>\n`;
        xmlData += `      <Finish>${task.plannedEndDate.toISOString()}</Finish>\n`;
        xmlData += `      <Milestone>0</Milestone>\n`;
        xmlData += '    </Task>\n';
      }

      for (const milestone of milestones) {
        xmlData += '    <Task>\n';
        xmlData += `      <UID>${milestone.id.toString()}</UID>\n`;
        xmlData += `      <Name>${this.escapeXml(milestone.name)}</Name>\n`;
        xmlData += `      <Start>${milestone.dueDate.toISOString()}</Start>\n`;
        xmlData += `      <Finish>${milestone.dueDate.toISOString()}</Finish>\n`;
        xmlData += `      <Milestone>1</Milestone>\n`;
        xmlData += '    </Task>\n';
      }
      
      xmlData += '  </Tasks>\n';
      xmlData += '</Project>';

      const exportResult = ProjectExportResult.create({
        success: true,
        formatType: ExportFormatType.MS_PROJECT_XML,
        filePath: filePath,
        fileSize: xmlData.length,
        tasksExported: tasks.length,
        milestonesExported: milestones.length,
        resourcesExported: 0,
        dependenciesExported: dependencies.length,
        durationMs: Date.now() - startTime,
      });

      if (!exportResult.isSuccess) {
        return Result.fail(exportResult.error ?? 'Failed to create export result');
      }

      return Result.ok(exportResult.value!);
    } catch (error) {
      const failedResult = ProjectExportResult.create({
        success: false,
        formatType: ExportFormatType.MS_PROJECT_XML,
        filePath,
        fileSize: 0,
        tasksExported: 0,
        milestonesExported: 0,
        resourcesExported: 0,
        dependenciesExported: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (failedResult.isSuccess && failedResult.value) {
        return Result.ok(failedResult.value);
      }

      return Result.fail('Export failed');
    }
  }

  /**
   * Export project to Primavera P6 XER format
   */
  public async exportToPrimaveraP6(
    projectId: string,
    filePath: string
  ): Promise<Result<ProjectExportResult>> {
    try {
      const tasks = await this.taskRepository.findByProject(new UniqueEntityID(projectId));
      const milestones = await this.milestoneRepository.findByProject(new UniqueEntityID(projectId));
      const dependencies = await this.dependencyRepository.findByProject(new UniqueEntityID(projectId));

      // Build XER format (tab-delimited)
      let xer = 'ERMHDR\t1.0\n';
      
      // Task table
      xer += '%T\tTASK\n';
      xer += '%F\ttask_id\tproj_id\ttask_code\ttask_name\ttask_type\n';
      
      for (const task of tasks) {
        xer += `%R\t${task.id.toString()}\t${projectId}\t${task.id.toString()}\t${task.name}\tTT_Task\n`;
      }

      for (const milestone of milestones) {
        xer += `%R\t${milestone.id.toString()}\t${projectId}\t${milestone.id.toString()}\t${milestone.name}\tTT_Mile\n`;
      }

      const exportResult = ProjectExportResult.create({
        success: true,
        formatType: ExportFormatType.PRIMAVERA_P6_XER,
        filePath,
        fileSize: xer.length,
        tasksExported: tasks.length,
        milestonesExported: milestones.length,
        resourcesExported: 0,
        dependenciesExported: dependencies.length,
      });

      if (!exportResult.isSuccess) {
        return Result.fail(exportResult.error ?? 'Failed to create export result');
      }

      return Result.ok(exportResult.value!);
    } catch (error) {
      const failedResult = ProjectExportResult.create({
        success: false,
        formatType: ExportFormatType.PRIMAVERA_P6_XER,
        filePath,
        fileSize: 0,
        tasksExported: 0,
        milestonesExported: 0,
        resourcesExported: 0,
        dependenciesExported: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (failedResult.isSuccess && failedResult.value) {
        return Result.ok(failedResult.value);
      }

      return Result.fail('Export failed');
    }
  }

  /**
   * Export project to CSV format
   */
  public async exportToCSV(
    projectId: string,
    filePath: string
  ): Promise<Result<ProjectExportResult>> {
    try {
      const tasks = await this.taskRepository.findByProject(new UniqueEntityID(projectId));
      const milestones = await this.milestoneRepository.findByProject(new UniqueEntityID(projectId));

      const headers = ['ID', 'Name', 'Start Date', 'End Date', 'Milestone', 'Critical', 'Progress'];
      const rows: string[][] = [];

      for (const task of tasks) {
        rows.push([
          task.id.toString(),
          task.name,
          task.plannedStartDate.toISOString().split('T')[0],
          task.plannedEndDate.toISOString().split('T')[0],
          'No',
          'No',
          (task.progress || 0).toString(),
        ]);
      }

      for (const milestone of milestones) {
        rows.push([
          milestone.id.toString(),
          milestone.name,
          milestone.dueDate.toISOString().split('T')[0],
          milestone.dueDate.toISOString().split('T')[0],
          'Yes',
          milestone.critical ? 'Yes' : 'No',
          milestone.status === 'achieved' ? '100' : '0',
        ]);
      }

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const exportResult = ProjectExportResult.create({
        success: true,
        formatType: ExportFormatType.CSV,
        filePath,
        fileSize: csv.length,
        tasksExported: tasks.length,
        milestonesExported: milestones.length,
        resourcesExported: 0,
        dependenciesExported: 0,
      });

      if (!exportResult.isSuccess) {
        return Result.fail(exportResult.error ?? 'Failed to create export result');
      }

      return Result.ok(exportResult.value!);
    } catch (error) {
      const failedResult = ProjectExportResult.create({
        success: false,
        formatType: ExportFormatType.CSV,
        filePath,
        fileSize: 0,
        tasksExported: 0,
        milestonesExported: 0,
        resourcesExported: 0,
        dependenciesExported: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (failedResult.isSuccess && failedResult.value) {
        return Result.ok(failedResult.value);
      }

      return Result.fail('Export failed');
    }
  }

  /**
   * Create import result
   */
  private createImportResult(
    sourceType: string,
    status: string,
    tasksImported: number,
    milestonesImported: number,
    resourcesImported: number,
    dependenciesImported: number,
    issues: string[],
    durationMs: number
  ): Result<ProjectImportResult> {
    const importIssues: ImportIssue[] = issues.map(msg => ({
      type: 'error' as const,
      message: msg,
    }));

    const result = ProjectImportResult.create({
      sourceType: sourceType as ImportSourceType,
      status: status as ImportStatus,
      tasksImported,
      milestonesImported,
      resourcesImported,
      dependenciesImported,
      issues: importIssues,
      durationMs,
    });

    if (!result.isSuccess) {
      return Result.fail(result.error ?? 'Failed to create import result');
    }

    return Result.ok(result.value!);
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
