import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Filter,
  LayoutGrid,
  List,
  BarChart3,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
} from 'lucide-react';
import type { Task } from '@domain/projects/entities/task';
import type { TaskDependency } from '@domain/projects/entities/task-dependency';
import './gantt-chart.css';

interface GanttChartProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: Task) => void;
}

type TimeScale = 'day' | 'week' | 'month';
type ViewMode = 'gantt' | 'list' | 'board';

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dependencies,
  onTaskClick,
}) => {
  const navigate = useNavigate();
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const earliest = tasks.reduce((min, task) => 
      task.plannedStartDate < min ? task.plannedStartDate : min,
      tasks[0]?.plannedStartDate || new Date()
    );
    return new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  });
  const [filter, setFilter] = useState<'all' | 'critical' | 'active'>('all');

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'critical':
        return tasks.filter((t) => t.dependencies.length > 0);
      case 'active':
        return tasks.filter((t) => t.status === 'in-progress');
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const timelineColumns = useMemo(() => {
    const columns: Date[] = [];
    const current = new Date(viewStart);
    const monthsToShow = 6;

    for (let i = 0; i < monthsToShow * 4; i++) {
      columns.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return columns;
  }, [viewStart, timeScale]);

  const calculateBarPosition = (task: Task) => {
    const start = task.plannedStartDate.getTime();
    const end = task.plannedEndDate.getTime();
    const timelineStart = viewStart.getTime();
    const totalDays = 180; // 6 months
    const msPerDay = 24 * 60 * 60 * 1000;

    const leftPercent = ((start - timelineStart) / (totalDays * msPerDay)) * 100;
    const widthPercent = ((end - start) / (totalDays * msPerDay)) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.max(1, widthPercent)}%`,
    };
  };

  const getTaskStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'gantt-chart__bar--completed';
      case 'in-progress':
        return 'gantt-chart__bar--in-progress';
      case 'delayed':
        return 'gantt-chart__bar--delayed';
      default:
        return 'gantt-chart__bar--not-started';
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(viewStart);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewStart(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewStart);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewStart(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setViewStart(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleExport = () => {
    // Export logic would go here
    console.log('Exporting Gantt chart...');
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'gantt-chart__status-badge--completed';
      case 'in-progress':
        return 'gantt-chart__status-badge--in-progress';
      case 'delayed':
        return 'gantt-chart__status-badge--delayed';
      default:
        return 'gantt-chart__status-badge--not-started';
    }
  };

  const formatDateRange = (start: Date, end: Date): string => {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const groupTasksByStatus = useMemo(() => {
    const grouped = {
      'not-started': [] as Task[],
      'in-progress': [] as Task[],
      'completed': [] as Task[],
      'delayed': [] as Task[],
    };
    
    filteredTasks.forEach((task) => {
      if (grouped[task.status as keyof typeof grouped]) {
        grouped[task.status as keyof typeof grouped].push(task);
      }
    });
    
    return grouped;
  }, [filteredTasks]);

  return (
    <div className="gantt-chart">
      {/* Header Controls */}
      <div className="gantt-chart__header">
        <div className="gantt-chart__header-left">
          <button
            onClick={() => navigate('/projects')}
            className="gantt-chart__button gantt-chart__button--back"
            aria-label="Back to projects"
            title="Back to Projects"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="gantt-chart__title">Gantt Chart</h2>
            <span className="gantt-chart__count">
              ({filteredTasks.length} tasks)
            </span>
          </div>
        </div>

        <div className="gantt-chart__controls">
          {/* View Mode Selector */}
          <div className="gantt-chart__view-mode">
            <button
              onClick={() => setViewMode('gantt')}
              className={`gantt-chart__view-button ${viewMode === 'gantt' ? 'gantt-chart__view-button--active' : ''}`}
              title="Timeline View"
            >
              <BarChart3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`gantt-chart__view-button ${viewMode === 'list' ? 'gantt-chart__view-button--active' : ''}`}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`gantt-chart__view-button ${viewMode === 'board' ? 'gantt-chart__view-button--active' : ''}`}
              title="Board View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Filter */}
          <div className="gantt-chart__filter">
            <Filter className="gantt-chart__filter-icon" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="gantt-chart__select"
            >
              <option value="all">All Tasks</option>
              <option value="critical">Critical Path</option>
              <option value="active">Active Only</option>
            </select>
          </div>

          {/* Navigation */}
          <div className="gantt-chart__nav">
            <button
              onClick={handlePrevious}
              className="gantt-chart__nav-button"
              title="Previous month"
            >
              <ChevronLeft className="gantt-chart__nav-icon" />
            </button>
            <button
              onClick={handleToday}
              className="gantt-chart__nav-button gantt-chart__nav-button--today"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="gantt-chart__nav-button"
              title="Next month"
            >
              <ChevronRight className="gantt-chart__nav-icon" />
            </button>
          </div>

          {/* Time Scale */}
          <div className="gantt-chart__scale-group">
            <button
              onClick={() => setTimeScale('day')}
              className={`gantt-chart__scale-button ${
                timeScale === 'day' ? 'gantt-chart__scale-button--active' : ''
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeScale('week')}
              className={`gantt-chart__scale-button ${
                timeScale === 'week' ? 'gantt-chart__scale-button--active' : ''
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeScale('month')}
              className={`gantt-chart__scale-button ${
                timeScale === 'month' ? 'gantt-chart__scale-button--active' : ''
              }`}
            >
              Month
            </button>
          </div>

          {/* Zoom Controls (only for gantt view) */}
          {viewMode === 'gantt' && (
            <div className="gantt-chart__zoom">
              <button
                onClick={handleZoomOut}
                className="gantt-chart__zoom-button"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="gantt-chart__zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="gantt-chart__zoom-button"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          {/* Export */}
          <button
            onClick={handleExport}
            className="gantt-chart__export"
            title="Export Gantt Chart"
          >
            <Download className="gantt-chart__export-icon" />
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'gantt' && (
        <div className="gantt-chart__container">
          <div className="gantt-chart__wrapper" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
          {/* Timeline Header */}
          <div className="gantt-chart__timeline-header">
            <div className="gantt-chart__task-header">
              <div className="gantt-chart__task-header-text">Task Name</div>
            </div>
            <div className="gantt-chart__timeline-columns">
              {timelineColumns.map((date, index) => (
                <div key={index} className="gantt-chart__column">
                  <div className="gantt-chart__column-month">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="gantt-chart__column-day">
                    {date.toLocaleDateString('en-US', { day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="gantt-chart__rows">
            {filteredTasks.length === 0 ? (
              <div className="gantt-chart__empty">
                <Calendar className="gantt-chart__empty-icon" />
                <p>No tasks to display</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const barPosition = calculateBarPosition(task);
                const statusColor = getTaskStatusColor(task.status);

                return (
                  <div key={task.id.toString()} className="gantt-chart__row">
                    {/* Task Name Column */}
                    <div className="gantt-chart__task-cell">
                      <div className="gantt-chart__task-info">
                        <button
                          onClick={() => onTaskClick?.(task)}
                          className="gantt-chart__task-name"
                        >
                          {task.name}
                        </button>
                      </div>
                      <div className="gantt-chart__task-wbs">
                        {task.wbsCode || 'No WBS'}
                      </div>
                    </div>

                    {/* Timeline Column */}
                    <div className="gantt-chart__timeline-cell">
                      {/* Today indicator */}
                      {new Date() >= viewStart &&
                        new Date() <= new Date(viewStart.getTime() + 180 * 24 * 60 * 60 * 1000) && (
                          <div
                            className="gantt-chart__today-line"
                            style={{
                              left: `${((new Date().getTime() - viewStart.getTime()) / (180 * 24 * 60 * 60 * 1000)) * 100}%`,
                            }}
                          />
                        )}

                      {/* Task Bar */}
                      <div
                        className={`gantt-chart__bar ${statusColor}`}
                        style={{
                          left: barPosition.left,
                          width: barPosition.width,
                        }}
                        title={`${task.name}\n${task.plannedStartDate.toLocaleDateString()} - ${task.plannedEndDate.toLocaleDateString()}\nProgress: ${task.progress}%`}
                      >
                        {/* Progress Indicator */}
                        <div
                          className="gantt-chart__bar-progress"
                          style={{ width: `${task.progress}%` }}
                        />
                        {/* Task Label */}
                        <span className="gantt-chart__bar-label">
                          {task.progress}%
                        </span>
                      </div>

                      {/* Dependency Lines (simplified) */}
                      {dependencies
                        .filter((dep) => dep.successorId.toString() === task.id.toString())
                        .map((dep) => (
                          <div
                            key={dep.id.toString()}
                            className="gantt-chart__dependency"
                          />
                        ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="gantt-chart__list-view">
          <div className="gantt-chart__list-header">
            <div className="gantt-chart__list-col gantt-chart__list-col--task">Task</div>
            <div className="gantt-chart__list-col gantt-chart__list-col--status">Status</div>
            <div className="gantt-chart__list-col gantt-chart__list-col--dates">Timeline</div>
            <div className="gantt-chart__list-col gantt-chart__list-col--progress">Progress</div>
          </div>
          <div className="gantt-chart__list-body">
            {filteredTasks.length === 0 ? (
              <div className="gantt-chart__empty">
                <List className="gantt-chart__empty-icon" />
                <p>No tasks to display</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id.toString()} className="gantt-chart__list-row">
                  <div className="gantt-chart__list-col gantt-chart__list-col--task">
                    <button
                      onClick={() => onTaskClick?.(task)}
                      className="gantt-chart__task-name"
                    >
                      {task.name}
                    </button>
                    <div className="gantt-chart__task-wbs">{task.wbsCode || 'No WBS'}</div>
                  </div>
                  <div className="gantt-chart__list-col gantt-chart__list-col--status">
                    <span className={`gantt-chart__status-badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="gantt-chart__list-col gantt-chart__list-col--dates">
                    {formatDateRange(task.plannedStartDate, task.plannedEndDate)}
                  </div>
                  <div className="gantt-chart__list-col gantt-chart__list-col--progress">
                    <div className="gantt-chart__progress-container">
                      <div className="gantt-chart__progress-bar">
                        <div 
                          className="gantt-chart__progress-fill"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="gantt-chart__progress-text">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="gantt-chart__board-view">
          <div className="gantt-chart__board-column">
            <div className="gantt-chart__board-header gantt-chart__board-header--not-started">
              <h3>Not Started</h3>
              <span className="gantt-chart__board-count">{groupTasksByStatus['not-started'].length}</span>
            </div>
            <div className="gantt-chart__board-tasks">
              {groupTasksByStatus['not-started'].map((task) => (
                <div key={task.id.toString()} className="gantt-chart__board-card" onClick={() => onTaskClick?.(task)}>
                  <h4 className="gantt-chart__board-card-title">{task.name}</h4>
                  <p className="gantt-chart__board-card-wbs">{task.wbsCode}</p>
                  <div className="gantt-chart__board-card-footer">
                    <Calendar size={12} />
                    <span>{formatDateRange(task.plannedStartDate, task.plannedEndDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gantt-chart__board-column">
            <div className="gantt-chart__board-header gantt-chart__board-header--in-progress">
              <h3>In Progress</h3>
              <span className="gantt-chart__board-count">{groupTasksByStatus['in-progress'].length}</span>
            </div>
            <div className="gantt-chart__board-tasks">
              {groupTasksByStatus['in-progress'].map((task) => (
                <div key={task.id.toString()} className="gantt-chart__board-card" onClick={() => onTaskClick?.(task)}>
                  <h4 className="gantt-chart__board-card-title">{task.name}</h4>
                  <p className="gantt-chart__board-card-wbs">{task.wbsCode}</p>
                  <div className="gantt-chart__board-card-progress">
                    <div className="gantt-chart__progress-bar">
                      <div 
                        className="gantt-chart__progress-fill"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="gantt-chart__board-card-footer">
                    <Calendar size={12} />
                    <span>{formatDateRange(task.plannedStartDate, task.plannedEndDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gantt-chart__board-column">
            <div className="gantt-chart__board-header gantt-chart__board-header--delayed">
              <h3>Delayed</h3>
              <span className="gantt-chart__board-count">{groupTasksByStatus['delayed'].length}</span>
            </div>
            <div className="gantt-chart__board-tasks">
              {groupTasksByStatus['delayed'].map((task) => (
                <div key={task.id.toString()} className="gantt-chart__board-card" onClick={() => onTaskClick?.(task)}>
                  <h4 className="gantt-chart__board-card-title">{task.name}</h4>
                  <p className="gantt-chart__board-card-wbs">{task.wbsCode}</p>
                  <div className="gantt-chart__board-card-progress">
                    <div className="gantt-chart__progress-bar">
                      <div 
                        className="gantt-chart__progress-fill"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="gantt-chart__board-card-footer">
                    <Calendar size={12} />
                    <span>{formatDateRange(task.plannedStartDate, task.plannedEndDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gantt-chart__board-column">
            <div className="gantt-chart__board-header gantt-chart__board-header--completed">
              <h3>Completed</h3>
              <span className="gantt-chart__board-count">{groupTasksByStatus['completed'].length}</span>
            </div>
            <div className="gantt-chart__board-tasks">
              {groupTasksByStatus['completed'].map((task) => (
                <div key={task.id.toString()} className="gantt-chart__board-card" onClick={() => onTaskClick?.(task)}>
                  <h4 className="gantt-chart__board-card-title">{task.name}</h4>
                  <p className="gantt-chart__board-card-wbs">{task.wbsCode}</p>
                  <div className="gantt-chart__board-card-footer">
                    <Calendar size={12} />
                    <span>{formatDateRange(task.plannedStartDate, task.plannedEndDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend (only for gantt view) */}
      {viewMode === 'gantt' && (
        <div className="gantt-chart__legend">
        <div className="gantt-chart__legend-item">
          <div className="gantt-chart__legend-color gantt-chart__legend-color--completed" />
          <span className="gantt-chart__legend-text">Completed</span>
        </div>
        <div className="gantt-chart__legend-item">
          <div className="gantt-chart__legend-color gantt-chart__legend-color--in-progress" />
          <span className="gantt-chart__legend-text">In Progress</span>
        </div>
        <div className="gantt-chart__legend-item">
          <div className="gantt-chart__legend-color gantt-chart__legend-color--delayed" />
          <span className="gantt-chart__legend-text">Delayed</span>
        </div>
        <div className="gantt-chart__legend-item">
          <div className="gantt-chart__legend-color gantt-chart__legend-color--not-started" />
          <span className="gantt-chart__legend-text">Not Started</span>
        </div>
        <div className="gantt-chart__legend-item gantt-chart__legend-item--auto">
          <div className="gantt-chart__legend-line" />
          <span className="gantt-chart__legend-text">Dependencies</span>
        </div>
      </div>
      )}
    </div>
  );
};
