import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import type { ChangeOrder } from '@domain/projects/entities/change-order';
import type { ChangeManagementService } from '@application/projects';
import './change-order-management.css';

interface ChangeOrderManagementProps {
  projectId: string;
  changeManagementService: ChangeManagementService;
}

interface ChangeOrderStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalCostImpact: number;
  totalScheduleImpact: number;
}

export const ChangeOrderManagement: React.FC<ChangeOrderManagementProps> = ({
  projectId,
  changeManagementService,
}) => {
  const navigate = useNavigate();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [stats, setStats] = useState<ChangeOrderStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalCostImpact: 0,
    totalScheduleImpact: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadChangeOrders();
  }, [projectId, selectedStatus]);

  const loadChangeOrders = async () => {
    setLoading(true);
    try {
      const result = await changeManagementService.getProjectChangeOrders(projectId);
      
      if (result.isSuccess && result.value) {
        let orders = result.value;
        
        // Filter by status
        if (selectedStatus !== 'all') {
          orders = orders.filter((co: ChangeOrder) => co.status === selectedStatus);
        }
        
        setChangeOrders(orders);
        
        // Calculate stats
        const stats: ChangeOrderStats = {
          total: result.value.length,
          pending: result.value.filter((co: ChangeOrder) => co.status === 'under-review').length,
          approved: result.value.filter((co: ChangeOrder) => co.status === 'approved').length,
          rejected: result.value.filter((co: ChangeOrder) => co.status === 'rejected').length,
          totalCostImpact: result.value.reduce((sum: number, co: ChangeOrder) => sum + co.impact.costImpact.amount, 0),
          totalScheduleImpact: result.value.reduce((sum: number, co: ChangeOrder) => sum + (co.impact.scheduleImpact || 0), 0),
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error loading change orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'under-review':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'change-order-management__status-badge--approved';
      case 'rejected':
        return 'change-order-management__status-badge--rejected';
      case 'under-review':
        return 'change-order-management__status-badge--under-review';
      case 'submitted':
        return 'change-order-management__status-badge--submitted';
      case 'cancelled':
        return 'change-order-management__status-badge--cancelled';
      default:
        return 'change-order-management__status-badge--draft';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDays = (days: number): string => {
    if (days === 0) return 'No impact';
    return `${days > 0 ? '+' : ''}${days} days`;
  };

  if (loading) {
    return (
      <div className="change-order-management__loading">
        <div className="change-order-management__spinner"></div>
      </div>
    );
  }

  return (
    <div className="change-order-management">
      {/* Header */}
      <div className="change-order-management__header">
        <div className="change-order-management__header-left">
          <button
            onClick={() => navigate('/projects')}
            className="change-order-management__button change-order-management__button--back"
            aria-label="Back to projects"
            title="Back to Projects"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="change-order-management__title">Change Orders</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="change-order-management__button change-order-management__button--primary"
        >
          <Plus size={20} />
          New Change Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="change-order-management__stats">
        <div className="change-order-management__stat-card">
          <div className="change-order-management__stat-header">
            <h3 className="change-order-management__stat-label">Total Change Orders</h3>
            <div className="change-order-management__stat-icon change-order-management__stat-icon--blue">
              <FileText size={20} />
            </div>
          </div>
          <p className="change-order-management__stat-value">{stats.total}</p>
        </div>

        <div className="change-order-management__stat-card">
          <div className="change-order-management__stat-header">
            <h3 className="change-order-management__stat-label">Pending Review</h3>
            <div className="change-order-management__stat-icon change-order-management__stat-icon--yellow">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="change-order-management__stat-value change-order-management__stat-value--yellow">{stats.pending}</p>
        </div>

        <div className="change-order-management__stat-card">
          <div className="change-order-management__stat-header">
            <h3 className="change-order-management__stat-label">Cost Impact</h3>
            <div className="change-order-management__stat-icon change-order-management__stat-icon--red">
              <DollarSign size={20} />
            </div>
          </div>
          <p className={`change-order-management__stat-value ${stats.totalCostImpact >= 0 ? 'change-order-management__stat-value--red' : 'change-order-management__stat-value--green'}`}>
            {formatCurrency(stats.totalCostImpact)}
          </p>
        </div>

        <div className="change-order-management__stat-card">
          <div className="change-order-management__stat-header">
            <h3 className="change-order-management__stat-label">Schedule Impact</h3>
            <div className="change-order-management__stat-icon change-order-management__stat-icon--orange">
              <CalendarIcon size={20} />
            </div>
          </div>
          <p className={`change-order-management__stat-value ${stats.totalScheduleImpact >= 0 ? 'change-order-management__stat-value--orange' : 'change-order-management__stat-value--green'}`}>
            {formatDays(stats.totalScheduleImpact)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="change-order-management__filters">
        <div className="change-order-management__filters-content">
          <span className="change-order-management__filters-label">Filter by Status:</span>
          <div className="change-order-management__filter-buttons">
            {['all', 'draft', 'submitted', 'under-review', 'approved', 'rejected', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`change-order-management__filter-button ${
                  selectedStatus === status ? 'change-order-management__filter-button--active' : ''
                }`}
              >
                {status.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Change Orders List */}
      <div className="change-order-management__list">
        {changeOrders.length === 0 ? (
          <div className="change-order-management__empty">
            <FileText className="change-order-management__empty-icon" />
            <p className="change-order-management__empty-text">No change orders found</p>
          </div>
        ) : (
          <div className="change-order-management__items">
            {changeOrders.map((order) => (
              <div key={order.id.toString()} className="change-order-management__item">
                <div className="change-order-management__item-content">
                  <div className="change-order-management__item-left">
                    <div className="change-order-management__item-icon">{getStatusIcon(order.status)}</div>
                    <div className="change-order-management__item-details">
                      <div className="change-order-management__item-header">
                        <h3 className="change-order-management__item-number">
                          CO-{order.changeOrderNumber.toString().padStart(4, '0')}
                        </h3>
                        <span className={`change-order-management__status-badge ${getStatusColor(order.status)}`}>
                          {order.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="change-order-management__item-title">{order.title}</p>
                      <p className="change-order-management__item-description">{order.description}</p>
                      
                      <div className="change-order-management__item-meta">
                        <div className="change-order-management__meta-item">
                          <User size={16} />
                          {order.requestedBy.toString()}
                        </div>
                        <div className="change-order-management__meta-item">
                          <CalendarIcon size={16} />
                          {order.submittedAt?.toLocaleDateString() || 'Not submitted'}
                        </div>
                        <div className="change-order-management__meta-item">
                          <FileText size={16} />
                          {order.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="change-order-management__item-right">
                    <div className="change-order-management__impact">
                      <div className="change-order-management__impact-label">Cost Impact</div>
                      <div className={`change-order-management__impact-value ${
                        order.impact.costImpact.amount >= 0 ? 'change-order-management__impact-value--positive-cost' : 'change-order-management__impact-value--negative-cost'
                      }`}>
                        {formatCurrency(order.impact.costImpact.amount)}
                      </div>
                    </div>
                    <div className="change-order-management__impact">
                      <div className="change-order-management__impact-label">Schedule Impact</div>
                      <div className={`change-order-management__impact-value ${
                        (order.impact.scheduleImpact || 0) >= 0 ? 'change-order-management__impact-value--positive-schedule' : 'change-order-management__impact-value--negative-schedule'
                      }`}>
                        {formatDays(order.impact.scheduleImpact || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope Impact */}
                {order.impact.scopeImpact && (
                  <div className="change-order-management__scope-impact">
                    <div className="change-order-management__scope-impact-content">
                      <TrendingUp size={16} className="change-order-management__scope-impact-icon" />
                      <div>
                        <div className="change-order-management__scope-impact-title">Scope Impact</div>
                        <p className="change-order-management__scope-impact-text">{order.impact.scopeImpact}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approvals */}
                {order.approvals.length > 0 && (
                  <div className="change-order-management__approvals">
                    <div className="change-order-management__approvals-title">Approvals</div>
                    <div className="change-order-management__approvals-list">
                      {order.approvals.map((approval, index) => (
                        <div key={index} className="change-order-management__approval-badge">
                          <CheckCircle size={12} />
                          {approval.approvedBy.toString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="change-order-management__modal-overlay">
          <div className="change-order-management__modal">
            <h3 className="change-order-management__modal-title">Create New Change Order</h3>
            <p className="change-order-management__modal-content">Form implementation would go here...</p>
            <div className="change-order-management__modal-actions">
              <button
                onClick={() => setShowCreateModal(false)}
                className="change-order-management__button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle create
                  setShowCreateModal(false);
                }}
                className="change-order-management__button change-order-management__button--primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
