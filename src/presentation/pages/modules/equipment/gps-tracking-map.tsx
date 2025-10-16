import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Navigation,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Radio,
  Layers,
  ChevronRight,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import './gps-tracking-map.css'

/**
 * GPS Tracking Map Component
 * Real-time equipment location visualization with geofence monitoring
 */

// ============================================================================
// Type Definitions
// ============================================================================

type GPSCoordinate = {
  latitude: number
  longitude: number
}

type EquipmentLocation = {
  equipmentId: string
  equipmentName: string
  equipmentType: string
  location: GPSCoordinate
  accuracy: number
  lastUpdate: Date
  address?: string
  speed?: number
  heading?: number
  isMoving: boolean
  batteryLevel?: number
  projectName?: string
}

type GeofenceZone = {
  id: string
  name: string
  center: GPSCoordinate
  radius: number // meters
  isActive: boolean
  alertsEnabled: boolean
  equipmentCount: number
  color: string
  projectName?: string
}

type GeofenceAlert = {
  id: string
  equipmentId: string
  equipmentName: string
  geofenceId: string
  geofenceName: string
  alertType: 'entry' | 'exit' | 'unauthorized-entry' | 'unauthorized-exit'
  location: GPSCoordinate
  timestamp: Date
  isAcknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  severity: 'high' | 'medium' | 'low'
}

type TrackingStats = {
  totalTracked: number
  activeAlerts: number
  activeZones: number
  lastUpdateTime: Date | null
}

// ============================================================================
// Mock Data Generation
// ============================================================================

const MOCK_CONSTRUCTION_SITES: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Downtown High-Rise Project', lat: 37.7749, lng: -122.4194 },
  { name: 'Bay Bridge Expansion', lat: 37.8044, lng: -122.3712 },
  { name: 'Mission District Renovation', lat: 37.7599, lng: -122.4148 },
  { name: 'Golden Gate Park Development', lat: 37.7694, lng: -122.4862 },
  { name: 'South Bay Commercial Complex', lat: 37.7280, lng: -122.4034 },
]

const EQUIPMENT_TYPES = ['Excavator', 'Crane', 'Bulldozer', 'Dump Truck', 'Concrete Mixer', 'Loader']

const generateMockLocation = (baseLat: number, baseLng: number): GPSCoordinate => {
  return {
    latitude: baseLat + (Math.random() - 0.5) * 0.01,
    longitude: baseLng + (Math.random() - 0.5) * 0.01,
  }
}

const generateMockEquipmentLocations = (): EquipmentLocation[] => {
  const locations: EquipmentLocation[] = []
  
  MOCK_CONSTRUCTION_SITES.forEach((site, siteIdx) => {
    const equipmentCount = 3 + Math.floor(Math.random() * 3) // 3-5 equipment per site
    
    for (let i = 0; i < equipmentCount; i++) {
      const type = EQUIPMENT_TYPES[Math.floor(Math.random() * EQUIPMENT_TYPES.length)]
      const location = generateMockLocation(site.lat, site.lng)
      
      locations.push({
        equipmentId: `EQ-${siteIdx + 1}${String(i + 1).padStart(2, '0')}`,
        equipmentName: `${type} ${siteIdx + 1}${String(i + 1).padStart(2, '0')}`,
        equipmentType: type,
        location,
        accuracy: 10 + Math.random() * 20,
        lastUpdate: new Date(Date.now() - Math.random() * 600000), // Last 10 minutes
        address: site.name,
        speed: Math.random() > 0.7 ? Math.random() * 15 : 0,
        heading: Math.random() * 360,
        isMoving: Math.random() > 0.7,
        batteryLevel: 20 + Math.random() * 80,
        projectName: site.name,
      })
    }
  })
  
  return locations
}

const generateMockGeofences = (): GeofenceZone[] => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  
  return MOCK_CONSTRUCTION_SITES.slice(0, 3).map((site, idx) => ({
    id: `GF-${idx + 1}`,
    name: `${site.name} Zone`,
    center: { latitude: site.lat, longitude: site.lng },
    radius: 500 + Math.random() * 500, // 500-1000 meters
    isActive: true,
    alertsEnabled: true,
    equipmentCount: 3 + Math.floor(Math.random() * 3),
    color: colors[idx % colors.length],
    projectName: site.name,
  }))
}

const generateMockAlerts = (equipment: EquipmentLocation[], geofences: GeofenceZone[]): GeofenceAlert[] => {
  const alerts: GeofenceAlert[] = []
  const alertTypes: GeofenceAlert['alertType'][] = ['entry', 'exit', 'unauthorized-entry', 'unauthorized-exit']
  
  // Generate 2-4 alerts
  const alertCount = 2 + Math.floor(Math.random() * 3)
  
  for (let i = 0; i < alertCount; i++) {
    const eq = equipment[Math.floor(Math.random() * equipment.length)]
    const gf = geofences[Math.floor(Math.random() * geofences.length)]
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    
    alerts.push({
      id: `ALERT-${i + 1}`,
      equipmentId: eq.equipmentId,
      equipmentName: eq.equipmentName,
      geofenceId: gf.id,
      geofenceName: gf.name,
      alertType,
      location: eq.location,
      timestamp: new Date(Date.now() - Math.random() * 3600000), // Last hour
      isAcknowledged: Math.random() > 0.6,
      severity: alertType.includes('unauthorized') ? 'high' : 'medium',
    })
  }
  
  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatRelativeTime = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const getAlertIcon = (alertType: GeofenceAlert['alertType']) => {
  switch (alertType) {
    case 'entry':
      return <CheckCircle className="alert-icon alert-icon--success" />
    case 'exit':
      return <XCircle className="alert-icon alert-icon--info" />
    case 'unauthorized-entry':
    case 'unauthorized-exit':
      return <AlertCircle className="alert-icon alert-icon--danger" />
    default:
      return <AlertCircle className="alert-icon" />
  }
}

const getAlertTypeLabel = (alertType: GeofenceAlert['alertType']): string => {
  switch (alertType) {
    case 'entry':
      return 'Entered Zone'
    case 'exit':
      return 'Exited Zone'
    case 'unauthorized-entry':
      return 'Unauthorized Entry'
    case 'unauthorized-exit':
      return 'Unauthorized Exit'
    default:
      return alertType
  }
}

// Convert lat/lng to percentage position on map (simplified projection)
const getMapPosition = (coord: GPSCoordinate): { x: number; y: number } => {
  // San Francisco Bay Area bounds (approximate)
  const minLat = 37.70
  const maxLat = 37.85
  const minLng = -122.52
  const maxLng = -122.35
  
  const x = ((coord.longitude - minLng) / (maxLng - minLng)) * 100
  const y = ((maxLat - coord.latitude) / (maxLat - minLat)) * 100
  
  // Clamp to 5-95% to keep markers visible
  return {
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
  }
}

// ============================================================================
// Main Component
// ============================================================================

export const GPSTrackingMap = () => {
  const navigate = useNavigate()
  
  // State
  const [equipmentLocations, setEquipmentLocations] = useState<EquipmentLocation[]>([])
  const [geofences, setGeofences] = useState<GeofenceZone[]>([])
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [selectedGeofence, setSelectedGeofence] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showGeofences, setShowGeofences] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  
  // Computed values
  const stats: TrackingStats = useMemo(() => {
    return {
      totalTracked: equipmentLocations.length,
      activeAlerts: alerts.filter((a) => !a.isAcknowledged).length,
      activeZones: geofences.filter((g) => g.isActive).length,
      lastUpdateTime: equipmentLocations.length > 0
        ? new Date(Math.max(...equipmentLocations.map((e) => e.lastUpdate.getTime())))
        : null,
    }
  }, [equipmentLocations, alerts, geofences])
  
  const unacknowledgedAlerts = useMemo(() => {
    return alerts.filter((a) => !a.isAcknowledged)
  }, [alerts])
  
  const selectedEquipmentData = useMemo(() => {
    return equipmentLocations.find((e) => e.equipmentId === selectedEquipment)
  }, [equipmentLocations, selectedEquipment])
  
  const selectedGeofenceData = useMemo(() => {
    return geofences.find((g) => g.id === selectedGeofence)
  }, [geofences, selectedGeofence])
  
  // Load data
  useEffect(() => {
    loadMapData()
  }, [])
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing) {
        refreshLocations()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isRefreshing])
  
  const loadMapData = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    const equipment = generateMockEquipmentLocations()
    const zones = generateMockGeofences()
    const newAlerts = generateMockAlerts(equipment, zones)
    
    setEquipmentLocations(equipment)
    setGeofences(zones)
    setAlerts(newAlerts)
    setIsLoading(false)
  }
  
  const refreshLocations = async () => {
    setIsRefreshing(true)
    
    // Simulate GPS update
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // Update equipment locations (simulate movement)
    setEquipmentLocations((prev) =>
      prev.map((eq) => ({
        ...eq,
        location: {
          latitude: eq.location.latitude + (Math.random() - 0.5) * 0.001,
          longitude: eq.location.longitude + (Math.random() - 0.5) * 0.001,
        },
        lastUpdate: new Date(),
        isMoving: Math.random() > 0.7,
        speed: Math.random() > 0.7 ? Math.random() * 15 : 0,
      }))
    )
    
    setIsRefreshing(false)
  }
  
  const handleAcknowledgeAlert = async (alertId: string) => {
    // TODO: Call geofence service to acknowledge alert
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              isAcknowledged: true,
              acknowledgedBy: 'Current User',
              acknowledgedAt: new Date(),
            }
          : alert
      )
    )
  }
  
  const handleEquipmentClick = (equipmentId: string) => {
    setSelectedEquipment(equipmentId === selectedEquipment ? null : equipmentId)
    setSelectedGeofence(null)
  }
  
  const handleGeofenceClick = (geofenceId: string) => {
    setSelectedGeofence(geofenceId === selectedGeofence ? null : geofenceId)
    setSelectedEquipment(null)
  }
  
  if (isLoading) {
    return (
      <div className="gps-tracking-map">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading GPS tracking data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="gps-tracking-map">
      {/* Header */}
      <div className="map-header">
        <div className="header-content">
          <div className="header-title">
            <button 
              className="btn btn--back"
              onClick={() => navigate('/equipment')}
              title="Back to Equipment"
            >
              <ArrowLeft size={20} />
            </button>
            <Navigation className="header-icon" />
            <div>
              <h1>GPS Equipment Tracking</h1>
              <p className="header-subtitle">Real-time location monitoring</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`btn btn--secondary ${isRefreshing ? 'btn--loading' : ''}`}
              onClick={refreshLocations}
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? 'icon-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-icon-wrapper">
            <Radio />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalTracked}</div>
            <div className="stat-label">Tracked Equipment</div>
            <div className="stat-meta">
              {stats.lastUpdateTime ? `Updated ${formatRelativeTime(stats.lastUpdateTime)}` : 'No updates'}
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-card--danger">
          <div className="stat-icon-wrapper">
            <AlertCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeAlerts}</div>
            <div className="stat-label">Active Alerts</div>
            <div className="stat-meta">
              {alerts.length > 0 ? `${alerts.length} total alerts` : 'All clear'}
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-card--info">
          <div className="stat-icon-wrapper">
            <Layers />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeZones}</div>
            <div className="stat-label">Active Zones</div>
            <div className="stat-meta">
              {geofences.length} total geofences
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="map-container">
        <div className="map-main">
          {/* Map Controls */}
          <div className="map-controls">
            <button
              className={`map-control-btn ${showGeofences ? 'active' : ''}`}
              onClick={() => setShowGeofences(!showGeofences)}
              title="Toggle geofences"
            >
              <Layers />
            </button>
            <button
              className={`map-control-btn ${showLabels ? 'active' : ''}`}
              onClick={() => setShowLabels(!showLabels)}
              title="Toggle labels"
            >
              <Settings />
            </button>
          </div>
          
          {/* Map Surface */}
          <div className="map-surface">
            {/* Grid Background */}
            <div className="map-grid"></div>
            
            {/* Geofence Zones */}
            {showGeofences &&
              geofences.map((zone) => {
                const pos = getMapPosition(zone.center)
                const isSelected = selectedGeofence === zone.id
                
                return (
                  <div
                    key={zone.id}
                    className={`geofence-zone ${isSelected ? 'geofence-zone--selected' : ''}`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      '--zone-color': zone.color,
                    } as React.CSSProperties}
                    onClick={() => handleGeofenceClick(zone.id)}
                  >
                    <div className="geofence-ring"></div>
                    {(showLabels || isSelected) && (
                      <div className="geofence-label">
                        {zone.name}
                        <span className="geofence-radius">{Math.round(zone.radius)}m</span>
                      </div>
                    )}
                  </div>
                )
              })}
            
            {/* Equipment Markers */}
            {equipmentLocations.map((equipment) => {
              const pos = getMapPosition(equipment.location)
              const isSelected = selectedEquipment === equipment.equipmentId
              const isMoving = equipment.isMoving
              
              return (
                <div
                  key={equipment.equipmentId}
                  className={`equipment-marker ${isSelected ? 'equipment-marker--selected' : ''} ${
                    isMoving ? 'equipment-marker--moving' : ''
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                  onClick={() => handleEquipmentClick(equipment.equipmentId)}
                >
                  <div className="marker-pin">
                    <MapPin />
                  </div>
                  {(showLabels || isSelected) && (
                    <div className="marker-label">
                      <div className="marker-label-name">{equipment.equipmentName}</div>
                      <div className="marker-label-meta">
                        {equipment.equipmentType} • {formatRelativeTime(equipment.lastUpdate)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Selected Equipment Info */}
          {selectedEquipmentData && (
            <div className="map-info-panel">
              <div className="info-panel-header">
                <h3>{selectedEquipmentData.equipmentName}</h3>
                <button
                  className="btn-close"
                  onClick={() => setSelectedEquipment(null)}
                >
                  ×
                </button>
              </div>
              <div className="info-panel-content">
                <div className="info-row">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{selectedEquipmentData.equipmentType}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Location:</span>
                  <span className="info-value">
                    {selectedEquipmentData.location.latitude.toFixed(6)}, {selectedEquipmentData.location.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Accuracy:</span>
                  <span className="info-value">±{selectedEquipmentData.accuracy.toFixed(1)}m</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Update:</span>
                  <span className="info-value">{formatRelativeTime(selectedEquipmentData.lastUpdate)}</span>
                </div>
                {selectedEquipmentData.address && (
                  <div className="info-row">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{selectedEquipmentData.address}</span>
                  </div>
                )}
                {selectedEquipmentData.speed !== undefined && selectedEquipmentData.speed > 0 && (
                  <div className="info-row">
                    <span className="info-label">Speed:</span>
                    <span className="info-value">{selectedEquipmentData.speed.toFixed(1)} km/h</span>
                  </div>
                )}
                {selectedEquipmentData.batteryLevel !== undefined && (
                  <div className="info-row">
                    <span className="info-label">Battery:</span>
                    <span className="info-value">{Math.round(selectedEquipmentData.batteryLevel)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Selected Geofence Info */}
          {selectedGeofenceData && (
            <div className="map-info-panel">
              <div className="info-panel-header">
                <h3>{selectedGeofenceData.name}</h3>
                <button
                  className="btn-close"
                  onClick={() => setSelectedGeofence(null)}
                >
                  ×
                </button>
              </div>
              <div className="info-panel-content">
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value">
                    {selectedGeofenceData.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Radius:</span>
                  <span className="info-value">{Math.round(selectedGeofenceData.radius)}m</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Alerts:</span>
                  <span className="info-value">
                    {selectedGeofenceData.alertsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Equipment:</span>
                  <span className="info-value">{selectedGeofenceData.equipmentCount} in zone</span>
                </div>
                {selectedGeofenceData.projectName && (
                  <div className="info-row">
                    <span className="info-label">Project:</span>
                    <span className="info-value">{selectedGeofenceData.projectName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="map-sidebar">
          {/* Alerts Section */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>Active Alerts</h3>
              <span className="badge badge--danger">{unacknowledgedAlerts.length}</span>
            </div>
            <div className="sidebar-content">
              {unacknowledgedAlerts.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle className="empty-icon" />
                  <p>No active alerts</p>
                </div>
              ) : (
                <div className="alerts-list">
                  {unacknowledgedAlerts.map((alert) => (
                    <div key={alert.id} className={`alert-item alert-item--${alert.severity}`}>
                      <div className="alert-icon-wrapper">{getAlertIcon(alert.alertType)}</div>
                      <div className="alert-content">
                        <div className="alert-title">{alert.equipmentName}</div>
                        <div className="alert-subtitle">
                          {getAlertTypeLabel(alert.alertType)} • {alert.geofenceName}
                        </div>
                        <div className="alert-time">{formatRelativeTime(alert.timestamp)}</div>
                      </div>
                      <button
                        className="btn btn--sm btn--secondary"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Equipment List */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>Equipment</h3>
              <span className="badge badge--primary">{equipmentLocations.length}</span>
            </div>
            <div className="sidebar-content">
              <div className="equipment-list">
                {equipmentLocations.slice(0, 10).map((equipment) => (
                  <div
                    key={equipment.equipmentId}
                    className={`equipment-item ${
                      selectedEquipment === equipment.equipmentId ? 'equipment-item--selected' : ''
                    }`}
                    onClick={() => handleEquipmentClick(equipment.equipmentId)}
                  >
                    <div className="equipment-icon">
                      <MapPin />
                    </div>
                    <div className="equipment-content">
                      <div className="equipment-name">{equipment.equipmentName}</div>
                      <div className="equipment-meta">
                        {equipment.equipmentType} • {formatRelativeTime(equipment.lastUpdate)}
                      </div>
                      {equipment.isMoving && (
                        <div className="equipment-status equipment-status--moving">Moving</div>
                      )}
                    </div>
                    <ChevronRight className="equipment-arrow" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Geofences List */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>Geofence Zones</h3>
              <span className="badge badge--info">{geofences.length}</span>
            </div>
            <div className="sidebar-content">
              <div className="geofence-list">
                {geofences.map((zone) => (
                  <div
                    key={zone.id}
                    className={`geofence-item ${
                      selectedGeofence === zone.id ? 'geofence-item--selected' : ''
                    }`}
                    onClick={() => handleGeofenceClick(zone.id)}
                  >
                    <div
                      className="geofence-color-dot"
                      style={{ backgroundColor: zone.color }}
                    ></div>
                    <div className="geofence-content">
                      <div className="geofence-name">{zone.name}</div>
                      <div className="geofence-meta">
                        {Math.round(zone.radius)}m radius • {zone.equipmentCount} equipment
                      </div>
                    </div>
                    <ChevronRight className="geofence-arrow" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
