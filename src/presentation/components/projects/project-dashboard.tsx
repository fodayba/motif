import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  BarChart3,
  ArrowLeft,
  Download,
  ChevronRight,
  FileText,
  Flag,
} from 'lucide-react';
import { SchedulingService } from '@application/projects';
import type { Project } from '@domain/projects/entities/project';
import type { Task } from '@domain/projects/entities/task';
import type { EarnedValueMetrics } from '@application/projects/types';
import './project-dashboard.css';

interface ProjectDashboardProps {
  project: Project;
  tasks: Task[];
  schedulingService: SchedulingService;
}

interface NavigationCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  tasks,
  schedulingService,
}) => {
  const navigate = useNavigate();
  const [evmMetrics, setEvmMetrics] = useState<EarnedValueMetrics | null>(null);
  const [criticalPath, setCriticalPath] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [project, tasks]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate EVM metrics
      const evmResult = await schedulingService.calculateEarnedValue({
        projectId: project.id.toString(),
        asOf: new Date(),
      });
      
      if (evmResult.isSuccess && evmResult.value) {
        setEvmMetrics(evmResult.value);
      }
      
      // Note: Critical path calculation requires CPM implementation in scheduling service
      // For now, showing mock critical path
      const criticalTasks = tasks.filter((task) => 
        task.status === 'in-progress' || task.status === 'not-started'
      ).slice(0, 5);
      setCriticalPath(criticalTasks);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPerformanceColor = (value: number | null, threshold = 1.0): string => {
    if (value === null) return '';
    if (value >= threshold) return 'stat-card--success';
    if (value >= threshold * 0.9) return 'stat-card--warning';
    return 'stat-card--danger';
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export project data');
  };

  const navigationCards: NavigationCard[] = [
    {
      title: 'All Projects',
      description: 'View and manage all projects',
      icon: <Target className="navigation-card__icon" />,
      route: '/projects',
      color: 'blue',
    },
    {
      title: 'Gantt Chart',
      description: 'View project timeline and schedule',
      icon: <BarChart3 className="navigation-card__icon" />,
      route: '/projects/gantt',
      color: 'green',
    },
    {
      title: 'Change Orders',
      description: 'Manage project change requests',
      icon: <FileText className="navigation-card__icon" />,
      route: '/projects/change-orders',
      color: 'orange',
    },
    {
      title: 'Milestones',
      description: 'Track project milestones and goals',
      icon: <Flag className="navigation-card__icon" />,
      route: '/projects/milestones',
      color: 'purple',
    },
  ];

  if (loading) {
    return (
      <div className="project-dashboard project-dashboard--loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!evmMetrics) {
    return (
      <div className="project-dashboard">
        <div className="project-dashboard__empty">
          <AlertTriangle size={48} />
          <p>Unable to load project metrics</p>
        </div>
      </div>
    );
  }

  const progressPercentage = ((evmMetrics.earnedValue / evmMetrics.plannedValue) * 100);

  return (
    <div className="project-dashboard">
      {/* Project Header */}
      <header className="project-dashboard__header">
        <div className="project-dashboard__header-left">
          <button 
            className="project-dashboard__button project-dashboard__button--back"
            onClick={() => navigate('/projects')}
            title="Back to Projects"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="project-dashboard__label">Project Management</p>
            <h1 className="project-dashboard__title">{project.name.value}</h1>
            <div className="project-dashboard__subtitle">
              <span className="project-dashboard__subtitle-item">
                <Calendar size={14} />
                {project.startDate.toLocaleDateString()} - {project.endDate?.toLocaleDateString() || 'TBD'}
              </span>
              <span className="project-dashboard__subtitle-item">
                <DollarSign size={14} />
                Budget: {formatCurrency(project.budget.amount)}
              </span>
              <span className={`project-dashboard__tag project-dashboard__tag--${project.status}`}>
                {project.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <button 
          className="project-dashboard__button project-dashboard__button--primary"
          onClick={handleExport}
        >
          <Download size={20} />
          <span>Export Report</span>
        </button>
      </header>

      {/* KPI Stats Grid */}
      <section className="project-dashboard__stats">
        {/* Schedule Performance Index */}
        <div className={`stat-card ${getPerformanceColor(evmMetrics.spi)}`}>
          <div className={`stat-card__icon-wrapper ${getPerformanceColor(evmMetrics.spi).replace('stat-card', 'stat-card__icon-wrapper')}`}>
            <Clock className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Schedule Performance</p>
            <p className="stat-card__value">{evmMetrics.spi?.toFixed(2) || 'N/A'}</p>
            <p className="stat-card__sublabel">
              {evmMetrics.spi && evmMetrics.spi >= 1 ? 'Ahead of schedule' : 'Behind schedule'}
            </p>
          </div>
        </div>

        {/* Cost Performance Index */}
        <div className={`stat-card ${getPerformanceColor(evmMetrics.cpi)}`}>
          <div className={`stat-card__icon-wrapper ${getPerformanceColor(evmMetrics.cpi).replace('stat-card', 'stat-card__icon-wrapper')}`}>
            <DollarSign className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Cost Performance</p>
            <p className="stat-card__value">{evmMetrics.cpi?.toFixed(2) || 'N/A'}</p>
            <p className="stat-card__sublabel">
              {evmMetrics.cpi && evmMetrics.cpi >= 1 ? 'Under budget' : 'Over budget'}
            </p>
          </div>
        </div>

        {/* Estimate at Completion */}
        <div className="stat-card stat-card--info">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--info">
            <Activity className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Estimate at Completion</p>
            <p className="stat-card__value">
              {evmMetrics.estimateAtCompletion ? formatCurrency(evmMetrics.estimateAtCompletion) : 'N/A'}
            </p>
            <p className="stat-card__sublabel">
              VAC: {evmMetrics.varianceAtCompletion ? formatCurrency(evmMetrics.varianceAtCompletion) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--primary">
            <Target className="stat-card__icon" />
          </div>
          <div className="stat-card__content">
            <p className="stat-card__label">Overall Progress</p>
            <p className="stat-card__value">{progressPercentage.toFixed(1)}%</p>
            <p className="stat-card__sublabel">
              {evmMetrics.plannedValue > 0 ? 'On track' : 'No baseline'}
            </p>
          </div>
        </div>
      </section>

      {/* Variance Analysis Metrics */}
      <section className="project-dashboard__metrics">
        {/* Cost Variance */}
        <div className="metric-card">
          <div className="metric-card__header">
            <h3 className="metric-card__title">Cost Variance</h3>
            <div className={`metric-card__trend ${evmMetrics.costVariance >= 0 ? 'metric-card__trend--up' : 'metric-card__trend--down'}`}>
              {evmMetrics.costVariance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{formatCurrency(evmMetrics.costVariance)}</span>
            </div>
          </div>
          <div className="metric-card__body">
            <div className="metric-card__breakdown">
              <div className="metric-card__breakdown-item">
                <span className="metric-card__breakdown-label">Planned Value (PV)</span>
                <span className="metric-card__breakdown-value">{formatCurrency(evmMetrics.plannedValue)}</span>
              </div>
              <div className="metric-card__breakdown-item">
                <span className="metric-card__breakdown-label">Earned Value (EV)</span>
                <span className="metric-card__breakdown-value">{formatCurrency(evmMetrics.earnedValue)}</span>
              </div>
              <div className="metric-card__breakdown-item">
                <span className="metric-card__breakdown-label">Actual Cost (AC)</span>
                <span className="metric-card__breakdown-value">{formatCurrency(evmMetrics.actualCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Variance */}
        <div className="metric-card">
          <div className="metric-card__header">
            <h3 className="metric-card__title">Schedule Variance</h3>
            <div className={`metric-card__trend ${evmMetrics.scheduleVariance >= 0 ? 'metric-card__trend--up' : 'metric-card__trend--down'}`}>
              {evmMetrics.scheduleVariance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{formatCurrency(evmMetrics.scheduleVariance)}</span>
            </div>
          </div>
          <div className="metric-card__body">
            <div className="progress-bar">
              <div 
                className="progress-bar__fill"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="metric-card__description">
              {evmMetrics.scheduleVariance >= 0 ? '+' : ''}{Math.round(evmMetrics.scheduleVariance / (evmMetrics.plannedValue / 30))} days {evmMetrics.scheduleVariance >= 0 ? 'ahead' : 'behind'}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="project-dashboard__navigation">
        <h2 className="project-dashboard__section-title">Quick Actions</h2>
        <div className="navigation-grid">
          {navigationCards.map((card) => (
            <div
              key={card.route}
              className={`navigation-card navigation-card--${card.color}`}
              onClick={() => navigate(card.route)}
            >
              <div className="navigation-card__icon-wrapper">
                {card.icon}
              </div>
              <div className="navigation-card__content">
                <h3 className="navigation-card__title">{card.title}</h3>
                <p className="navigation-card__description">{card.description}</p>
              </div>
              <ChevronRight className="navigation-card__arrow" />
            </div>
          ))}
        </div>
      </section>

      {/* Critical Path Tasks */}
      <section className="project-dashboard__activity">
        <h2 className="project-dashboard__section-title">
          <AlertTriangle size={20} style={{ display: 'inline', marginRight: '8px', color: 'rgb(220, 38, 38)' }} />
          Critical Path Tasks ({criticalPath.length})
        </h2>
        <div className="activity-list">
          {criticalPath.length === 0 ? (
            <div className="activity-list__empty">
              <CheckCircle size={48} style={{ color: 'rgb(22, 163, 74)' }} />
              <p>No critical path identified</p>
            </div>
          ) : (
            criticalPath.slice(0, 5).map((task) => (
              <div key={task.id.toString()} className="activity-item">
                <div className="activity-item__icon">
                  <BarChart3 size={16} />
                </div>
                <div className="activity-item__content">
                  <p className="activity-item__title">
                    <strong>{task.name}</strong> - {task.wbsCode}
                  </p>
                  <p className="activity-item__meta">
                    {task.plannedStartDate.toLocaleDateString()} - {task.plannedEndDate.toLocaleDateString()} • 
                    <span className={`project-dashboard__tag project-dashboard__tag--${task.status}`} style={{ marginLeft: '8px' }}>
                      {task.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
          {criticalPath.length > 5 && (
            <div className="activity-list__empty">
              <p>+ {criticalPath.length - 5} more critical tasks</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
