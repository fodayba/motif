import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Filter,
  Plus,
  MapPin,
  DollarSign,
  List,
  ArrowLeft,
} from 'lucide-react'
import './maintenance-calendar.css'

/**
 * Maintenance Schedule Calendar Component
 * Full-month calendar view with maintenance scheduling
 */

// ============================================================================
// Type Definitions
// ============================================================================

type MaintenanceType = 'preventive' | 'corrective' | 'predictive' | 'inspection' | 'calibration'

type MaintenanceEvent = {
  id: string
  equipmentId: string
  equipmentName: string
  equipmentType: string
  maintenanceType: MaintenanceType
  description: string
  scheduledDate: Date
  estimatedDuration: number // hours
  estimatedCost: number
  isOverdue: boolean
  isDueSoon: boolean
  isCompleted: boolean
  completedDate?: Date
  assignedTo?: string
  priority: 'high' | 'medium' | 'low'
  taskList?: string[]
  partsRequired?: string[]
}

type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: MaintenanceEvent[]
}

type MaintenanceStats = {
  totalScheduled: number
  overdue: number
  dueSoon: number
  completedThisMonth: number
  totalCost: number
}

// ============================================================================
// Mock Data Generation
// ============================================================================

const EQUIPMENT_ITEMS = [
  { name: 'Excavator 01', type: 'Excavator' },
  { name: 'Crane 02', type: 'Crane' },
  { name: 'Bulldozer 03', type: 'Bulldozer' },
  { name: 'Dump Truck 04', type: 'Dump Truck' },
  { name: 'Concrete Mixer 05', type: 'Concrete Mixer' },
  { name: 'Loader 06', type: 'Loader' },
  { name: 'Backhoe 07', type: 'Backhoe' },
  { name: 'Forklift 08', type: 'Forklift' },
]

const MAINTENANCE_TYPES: MaintenanceType[] = ['preventive', 'corrective', 'predictive', 'inspection', 'calibration']

const MAINTENANCE_DESCRIPTIONS: Record<MaintenanceType, string[]> = {
  preventive: ['Oil Change', 'Filter Replacement', 'Lubrication Service', 'Tire Rotation'],
  corrective: ['Hydraulic Repair', 'Engine Repair', 'Brake Replacement', 'Transmission Service'],
  predictive: ['Vibration Analysis', 'Thermal Imaging', 'Oil Analysis', 'Performance Test'],
  inspection: ['Safety Inspection', 'Annual Inspection', 'Compliance Check', 'Visual Inspection'],
  calibration: ['Sensor Calibration', 'Gauge Calibration', 'Load Test', 'Pressure Test'],
}

const generateMockEvents = (year: number, month: number): MaintenanceEvent[] => {
  const events: MaintenanceEvent[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Generate 15-25 events throughout the month
  const eventCount = 15 + Math.floor(Math.random() * 11)
  
  for (let i = 0; i < eventCount; i++) {
    const day = 1 + Math.floor(Math.random() * daysInMonth)
    const equipment = EQUIPMENT_ITEMS[Math.floor(Math.random() * EQUIPMENT_ITEMS.length)]
    const maintenanceType = MAINTENANCE_TYPES[Math.floor(Math.random() * MAINTENANCE_TYPES.length)]
    const descriptions = MAINTENANCE_DESCRIPTIONS[maintenanceType]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    const scheduledDate = new Date(year, month, day)
    scheduledDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0)
    
    const isOverdue = scheduledDate < today && Math.random() > 0.7
    const isDueSoon = !isOverdue && scheduledDate >= today && scheduledDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const isCompleted = scheduledDate < today && !isOverdue
    
    events.push({
      id: `MAINT-${i + 1}`,
      equipmentId: `EQ-${i + 1}`,
      equipmentName: equipment.name,
      equipmentType: equipment.type,
      maintenanceType,
      description,
      scheduledDate,
      estimatedDuration: 1 + Math.random() * 7, // 1-8 hours
      estimatedCost: 200 + Math.random() * 1800, // $200-$2000
      isOverdue,
      isDueSoon,
      isCompleted,
      completedDate: isCompleted ? new Date(scheduledDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : undefined,
      assignedTo: Math.random() > 0.3 ? `Technician ${Math.floor(Math.random() * 5) + 1}` : undefined,
      priority: isOverdue ? 'high' : isDueSoon ? 'medium' : 'low',
      taskList: Array.from({ length: 3 + Math.floor(Math.random() * 4) }, (_, idx) => `Task ${idx + 1}`),
      partsRequired: Math.random() > 0.5 ? Array.from({ length: 1 + Math.floor(Math.random() * 3) }, (_, idx) => `Part ${idx + 1}`) : undefined,
    })
  }
  
  return events.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
}

// ============================================================================
// Helper Functions
// ============================================================================

const getMonthName = (month: number): string => {
  return new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'long' })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const getMaintenanceTypeLabel = (type: MaintenanceType): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const getMaintenanceTypeColor = (type: MaintenanceType): string => {
  const colors: Record<MaintenanceType, string> = {
    preventive: '#3b82f6',
    corrective: '#ef4444',
    predictive: '#8b5cf6',
    inspection: '#10b981',
    calibration: '#f59e0b',
  }
  return colors[type]
}

const generateCalendarDays = (year: number, month: number, events: MaintenanceEvent[]): CalendarDay[] => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const days: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      events: [],
    })
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    
    const dayEvents = events.filter((event) => {
      const eventDate = new Date(event.scheduledDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === date.getTime()
    })
    
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      events: dayEvents,
    })
  }
  
  // Next month days
  const remainingDays = 42 - days.length // 6 weeks
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      events: [],
    })
  }
  
  return days
}

// ============================================================================
// Main Component
// ============================================================================

export const MaintenanceCalendar = () => {
  // Navigation
  const navigate = useNavigate()
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<MaintenanceEvent[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [filterType, setFilterType] = useState<MaintenanceType | 'all'>('all')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Computed values
  const filteredEvents = useMemo(() => {
    let filtered = events
    
    if (filterType !== 'all') {
      filtered = filtered.filter((e) => e.maintenanceType === filterType)
    }
    
    if (showOverdueOnly) {
      filtered = filtered.filter((e) => e.isOverdue)
    }
    
    return filtered
  }, [events, filterType, showOverdueOnly])
  
  const calendarDays = useMemo(() => {
    return generateCalendarDays(year, month, filteredEvents)
  }, [year, month, filteredEvents])
  
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    
    const selectedDate = new Date(selectedDay)
    selectedDate.setHours(0, 0, 0, 0)
    
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.scheduledDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === selectedDate.getTime()
    })
  }, [selectedDay, filteredEvents])
  
  const stats: MaintenanceStats = useMemo(() => {
    const monthEvents = events.filter((e) => {
      const eventDate = e.scheduledDate
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
    
    return {
      totalScheduled: monthEvents.filter((e) => !e.isCompleted).length,
      overdue: monthEvents.filter((e) => e.isOverdue).length,
      dueSoon: monthEvents.filter((e) => e.isDueSoon).length,
      completedThisMonth: monthEvents.filter((e) => e.isCompleted).length,
      totalCost: monthEvents.reduce((sum, e) => sum + e.estimatedCost, 0),
    }
  }, [events, year, month])
  
  // Load data
  useEffect(() => {
    loadMonthData()
  }, [year, month])
  
  const loadMonthData = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600))
    
    const monthEvents = generateMockEvents(year, month)
    setEvents(monthEvents)
    setIsLoading(false)
  }
  
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }
  
  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDay(null)
  }
  
  const handleDayClick = (day: CalendarDay) => {
    if (day.events.length > 0) {
      setSelectedDay(day.date)
    }
  }
  
  if (isLoading) {
    return (
      <div className="maintenance-calendar">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading maintenance schedule...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="maintenance-calendar">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-content">
          <div className="header-title">
            <button 
              className="btn btn--back"
              onClick={() => navigate('/equipment')}
              title="Back to Equipment"
            >
              <ArrowLeft size={20} />
            </button>
            <CalendarIcon className="header-icon" />
            <div>
              <h1>Maintenance Schedule</h1>
              <p className="header-subtitle">Equipment maintenance calendar</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`btn ${viewMode === 'calendar' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon />
              Calendar
            </button>
            <button
              className={`btn ${viewMode === 'list' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <List />
              List
            </button>
            <button className="btn btn--primary" onClick={() => {/* TODO: Open create modal */}}>
              <Plus />
              Schedule Maintenance
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-icon-wrapper">
            <CalendarIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalScheduled}</div>
            <div className="stat-label">Scheduled</div>
            <div className="stat-meta">This month</div>
          </div>
        </div>
        
        <div className="stat-card stat-card--danger">
          <div className="stat-icon-wrapper">
            <AlertTriangle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-label">Overdue</div>
            <div className="stat-meta">Requires attention</div>
          </div>
        </div>
        
        <div className="stat-card stat-card--warning">
          <div className="stat-icon-wrapper">
            <Clock />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.dueSoon}</div>
            <div className="stat-label">Due Soon</div>
            <div className="stat-meta">Next 7 days</div>
          </div>
        </div>
        
        <div className="stat-card stat-card--success">
          <div className="stat-icon-wrapper">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completedThisMonth}</div>
            <div className="stat-label">Completed</div>
            <div className="stat-meta">This month</div>
          </div>
        </div>
        
        <div className="stat-card stat-card--info">
          <div className="stat-icon-wrapper">
            <DollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalCost)}</div>
            <div className="stat-label">Total Cost</div>
            <div className="stat-meta">Estimated</div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="calendar-filters">
        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as MaintenanceType | 'all')}
          >
            <option value="all">All Types</option>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="predictive">Predictive</option>
            <option value="inspection">Inspection</option>
            <option value="calibration">Calibration</option>
          </select>
        </div>
        
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showOverdueOnly}
            onChange={(e) => setShowOverdueOnly(e.target.checked)}
          />
          <span>Show overdue only</span>
        </label>
        
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-dot legend-dot--overdue"></div>
            <span>Overdue</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot legend-dot--due-soon"></div>
            <span>Due Soon</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot legend-dot--completed"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>
      
      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="calendar-container">
          {/* Calendar Navigation */}
          <div className="calendar-nav">
            <button className="btn btn--secondary" onClick={handlePreviousMonth}>
              <ChevronLeft />
            </button>
            <h2 className="calendar-month">
              {getMonthName(month)} {year}
            </h2>
            <button className="btn btn--secondary" onClick={handleNextMonth}>
              <ChevronRight />
            </button>
            <button className="btn btn--secondary" onClick={handleToday}>
              Today
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="calendar-grid">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${!day.isCurrentMonth ? 'calendar-day--other-month' : ''} ${
                  day.isToday ? 'calendar-day--today' : ''
                } ${day.events.length > 0 ? 'calendar-day--has-events' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="calendar-day-number">{day.date.getDate()}</div>
                
                {day.events.length > 0 && (
                  <div className="calendar-events">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`calendar-event ${event.isOverdue ? 'calendar-event--overdue' : ''} ${
                          event.isDueSoon ? 'calendar-event--due-soon' : ''
                        } ${event.isCompleted ? 'calendar-event--completed' : ''}`}
                        style={{ '--event-color': getMaintenanceTypeColor(event.maintenanceType) } as React.CSSProperties}
                        title={`${event.equipmentName} - ${event.description}`}
                      >
                        <span className="event-time">{formatTime(event.scheduledDate)}</span>
                        <span className="event-title">{event.description}</span>
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="calendar-more-events">+{day.events.length - 3} more</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <div className="list-container">
          <div className="list-header">
            <h3>{getMonthName(month)} {year} - {filteredEvents.length} Events</h3>
          </div>
          <div className="list-content">
            {filteredEvents.length === 0 ? (
              <div className="empty-state">
                <CalendarIcon className="empty-icon" />
                <p>No maintenance events scheduled</p>
              </div>
            ) : (
              <div className="events-list">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`event-card ${event.isOverdue ? 'event-card--overdue' : ''} ${
                      event.isDueSoon ? 'event-card--due-soon' : ''
                    } ${event.isCompleted ? 'event-card--completed' : ''}`}
                  >
                    <div className="event-card-header">
                      <div className="event-date">
                        <div className="event-day">{event.scheduledDate.getDate()}</div>
                        <div className="event-month">{getMonthName(event.scheduledDate.getMonth()).slice(0, 3)}</div>
                      </div>
                      <div className="event-info">
                        <div className="event-title-row">
                          <h4>{event.description}</h4>
                          <span
                            className="event-type-badge"
                            style={{ backgroundColor: getMaintenanceTypeColor(event.maintenanceType) }}
                          >
                            {getMaintenanceTypeLabel(event.maintenanceType)}
                          </span>
                        </div>
                        <div className="event-meta">
                          <span>
                            <MapPin className="meta-icon" />
                            {event.equipmentName} ({event.equipmentType})
                          </span>
                          <span>
                            <Clock className="meta-icon" />
                            {formatTime(event.scheduledDate)} • {event.estimatedDuration.toFixed(1)}h
                          </span>
                          <span>
                            <DollarSign className="meta-icon" />
                            {formatCurrency(event.estimatedCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {event.assignedTo && (
                      <div className="event-assigned">
                        Assigned to: <strong>{event.assignedTo}</strong>
                      </div>
                    )}
                    
                    {event.isOverdue && (
                      <div className="event-alert event-alert--danger">
                        <AlertTriangle className="alert-icon" />
                        Overdue
                      </div>
                    )}
                    
                    {event.isDueSoon && !event.isOverdue && (
                      <div className="event-alert event-alert--warning">
                        <Clock className="alert-icon" />
                        Due Soon
                      </div>
                    )}
                    
                    {event.isCompleted && event.completedDate && (
                      <div className="event-alert event-alert--success">
                        <CheckCircle className="alert-icon" />
                        Completed on {event.completedDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Selected Day Sidebar */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="day-details-sidebar">
          <div className="sidebar-header">
            <h3>{selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <button className="btn-close" onClick={() => setSelectedDay(null)}>
              ×
            </button>
          </div>
          <div className="sidebar-content">
            <div className="sidebar-stats">
              <div className="sidebar-stat">
                <Wrench className="stat-icon" />
                <span>{selectedDayEvents.length} Events</span>
              </div>
              <div className="sidebar-stat">
                <DollarSign className="stat-icon" />
                <span>{formatCurrency(selectedDayEvents.reduce((sum, e) => sum + e.estimatedCost, 0))}</span>
              </div>
            </div>
            
            <div className="sidebar-events">
              {selectedDayEvents.map((event) => (
                <div key={event.id} className="sidebar-event">
                  <div
                    className="event-indicator"
                    style={{ backgroundColor: getMaintenanceTypeColor(event.maintenanceType) }}
                  ></div>
                  <div className="event-content">
                    <div className="event-time">{formatTime(event.scheduledDate)}</div>
                    <div className="event-title">{event.description}</div>
                    <div className="event-equipment">{event.equipmentName}</div>
                    <div className="event-details">
                      <span>{event.estimatedDuration.toFixed(1)}h</span>
                      <span>{formatCurrency(event.estimatedCost)}</span>
                    </div>
                    {event.isOverdue && <div className="event-badge event-badge--danger">Overdue</div>}
                    {event.isDueSoon && !event.isOverdue && <div className="event-badge event-badge--warning">Due Soon</div>}
                    {event.isCompleted && <div className="event-badge event-badge--success">Completed</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
