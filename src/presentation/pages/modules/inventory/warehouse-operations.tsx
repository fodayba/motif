import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Plus,
  Search,
  Filter,
  Truck,
  MapPin,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Box,
  Layers,
  Navigation,
  Download,
  Eye,
  Edit,
  Printer,
  ArrowLeft
} from 'lucide-react'
import './warehouse-operations.css'

interface PickList {
  id: string
  pickListNumber: string
  status: 'pending' | 'assigned' | 'picking' | 'completed' | 'cancelled'
  assignedTo?: string
  createdDate: Date
  dueDate: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  items: PickListItem[]
  completionPercent: number
}

interface PickListItem {
  itemId: string
  itemName: string
  sku: string
  quantity: number
  pickedQuantity: number
  binLocation: string
  zone: string
  status: 'pending' | 'picking' | 'picked'
}

interface PackingSlip {
  id: string
  slipNumber: string
  status: 'draft' | 'packing' | 'completed' | 'shipped'
  orderId: string
  customerName: string
  shippingAddress: string
  items: PackingSlipItem[]
  totalWeight: number
  createdDate: Date
}

interface PackingSlipItem {
  itemName: string
  sku: string
  quantity: number
  weight: number
  packed: boolean
}

interface Shipment {
  id: string
  trackingNumber: string
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled'
  carrier: string
  origin: string
  destination: string
  estimatedDelivery: Date
  actualDelivery?: Date
  items: number
  weight: number
}

interface BinLocation {
  id: string
  binCode: string
  zone: string
  aisle: string
  bay: string
  level: string
  capacity: number
  currentUtilization: number
  itemCount: number
  status: 'active' | 'inactive' | 'maintenance'
}

interface WarehouseMetrics {
  pickAccuracy: number
  pickRate: number
  averagePickTime: number
  onTimeShipments: number
  utilizationRate: number
  ordersFulfilled: number
  pendingPicks: number
  delayedShipments: number
  zonePerformance: Array<{
    zone: string
    pickRate: number
    accuracy: number
    utilization: number
  }>
  topPerformers: Array<{
    name: string
    picksCompleted: number
    accuracy: number
    avgTime: number
  }>
}

export default function WarehouseOperations() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'picks' | 'packing' | 'shipments' | 'bins' | 'metrics'>('picks')
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [binLocations, setBinLocations] = useState<BinLocation[]>([])
  const [metrics, setMetrics] = useState<WarehouseMetrics | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    loadWarehouseData()
  }, [])

  const loadWarehouseData = async () => {
    // Mock pick lists
    const mockPickLists: PickList[] = [
      {
        id: 'pick-1',
        pickListNumber: 'PICK-2024-001',
        status: 'assigned',
        assignedTo: 'John Smith',
        createdDate: new Date('2024-10-16T08:00:00'),
        dueDate: new Date('2024-10-16T12:00:00'),
        priority: 'high',
        completionPercent: 65,
        items: [
          {
            itemId: 'item-1',
            itemName: 'Structural Steel Beams',
            sku: 'STL-001',
            quantity: 10,
            pickedQuantity: 7,
            binLocation: 'A-01-02-03',
            zone: 'Zone A',
            status: 'picking'
          },
          {
            itemId: 'item-2',
            itemName: 'Concrete Blocks',
            sku: 'CNB-045',
            quantity: 50,
            pickedQuantity: 50,
            binLocation: 'A-02-01-01',
            zone: 'Zone A',
            status: 'picked'
          }
        ]
      },
      {
        id: 'pick-2',
        pickListNumber: 'PICK-2024-002',
        status: 'pending',
        createdDate: new Date('2024-10-16T09:30:00'),
        dueDate: new Date('2024-10-16T14:00:00'),
        priority: 'medium',
        completionPercent: 0,
        items: [
          {
            itemId: 'item-3',
            itemName: 'Electrical Wire',
            sku: 'ELC-220',
            quantity: 100,
            pickedQuantity: 0,
            binLocation: 'B-03-02-04',
            zone: 'Zone B',
            status: 'pending'
          }
        ]
      }
    ]

    // Mock packing slips
    const mockPackingSlips: PackingSlip[] = [
      {
        id: 'pack-1',
        slipNumber: 'PACK-2024-001',
        status: 'packing',
        orderId: 'ORD-2024-123',
        customerName: 'ABC Construction',
        shippingAddress: '123 Main St, New York, NY 10001',
        totalWeight: 1500,
        createdDate: new Date('2024-10-16T10:00:00'),
        items: [
          {
            itemName: 'Steel Beams',
            sku: 'STL-001',
            quantity: 10,
            weight: 1200,
            packed: true
          },
          {
            itemName: 'Concrete Blocks',
            sku: 'CNB-045',
            quantity: 50,
            weight: 300,
            packed: false
          }
        ]
      }
    ]

    // Mock shipments
    const mockShipments: Shipment[] = [
      {
        id: 'ship-1',
        trackingNumber: 'TRK-2024-001',
        status: 'in-transit',
        carrier: 'FedEx',
        origin: 'Warehouse A - New York',
        destination: 'Site B - Brooklyn',
        estimatedDelivery: new Date('2024-10-17T14:00:00'),
        items: 5,
        weight: 2500
      },
      {
        id: 'ship-2',
        trackingNumber: 'TRK-2024-002',
        status: 'delayed',
        carrier: 'UPS',
        origin: 'Warehouse A - New York',
        destination: 'Site C - Queens',
        estimatedDelivery: new Date('2024-10-16T16:00:00'),
        items: 3,
        weight: 800
      }
    ]

    // Mock bin locations
    const mockBinLocations: BinLocation[] = [
      {
        id: 'bin-1',
        binCode: 'A-01-02-03',
        zone: 'Zone A',
        aisle: 'A-01',
        bay: '02',
        level: '03',
        capacity: 1000,
        currentUtilization: 750,
        itemCount: 12,
        status: 'active'
      },
      {
        id: 'bin-2',
        binCode: 'A-02-01-01',
        zone: 'Zone A',
        aisle: 'A-02',
        bay: '01',
        level: '01',
        capacity: 2000,
        currentUtilization: 1800,
        itemCount: 25,
        status: 'active'
      },
      {
        id: 'bin-3',
        binCode: 'B-03-02-04',
        zone: 'Zone B',
        aisle: 'B-03',
        bay: '02',
        level: '04',
        capacity: 500,
        currentUtilization: 200,
        itemCount: 8,
        status: 'active'
      }
    ]

    // Mock metrics
    const mockMetrics: WarehouseMetrics = {
      pickAccuracy: 98.5,
      pickRate: 45,
      averagePickTime: 3.2,
      onTimeShipments: 94,
      utilizationRate: 78,
      ordersFulfilled: 156,
      pendingPicks: 8,
      delayedShipments: 2,
      zonePerformance: [
        { zone: 'Zone A', pickRate: 48, accuracy: 99, utilization: 82 },
        { zone: 'Zone B', pickRate: 42, accuracy: 98, utilization: 75 },
        { zone: 'Zone C', pickRate: 44, accuracy: 97, utilization: 70 }
      ],
      topPerformers: [
        { name: 'John Smith', picksCompleted: 245, accuracy: 99.5, avgTime: 2.8 },
        { name: 'Sarah Johnson', picksCompleted: 230, accuracy: 98.8, avgTime: 3.1 },
        { name: 'Mike Davis', picksCompleted: 210, accuracy: 98.2, avgTime: 3.4 }
      ]
    }

    setPickLists(mockPickLists)
    setPackingSlips(mockPackingSlips)
    setShipments(mockShipments)
    setBinLocations(mockBinLocations)
    setMetrics(mockMetrics)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />
      case 'assigned':
      case 'picking':
      case 'packing':
      case 'in-transit':
        return <Navigation size={16} />
      case 'completed':
      case 'picked':
      case 'delivered':
        return <CheckCircle size={16} />
      case 'delayed':
      case 'cancelled':
        return <AlertCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const handleViewDetails = (item: any) => {
    setSelectedItem(item)
    setShowDetailsModal(true)
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading warehouse operations...</p>
      </div>
    )
  }

  return (
    <div className="warehouse-operations">
      <div className="page-header">
        <div className="header-content">
          <button
            className="warehouse-operations__button warehouse-operations__button--back"
            onClick={() => navigate('/inventory')}
            title="Back to Inventory"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="header-icon">
            <Package size={32} />
          </div>
          <div>
            <h1>Warehouse Operations</h1>
            <p className="header-subtitle">
              Pick, pack, ship, and warehouse management
            </p>
          </div>
        </div>
        <button className="btn btn--primary">
          <Plus size={20} />
          New Pick List
        </button>
      </div>

      <div className="view-tabs">
        <button
          className={`view-tab ${view === 'picks' ? 'view-tab--active' : ''}`}
          onClick={() => setView('picks')}
        >
          <Layers size={18} />
          Pick Lists
        </button>
        <button
          className={`view-tab ${view === 'packing' ? 'view-tab--active' : ''}`}
          onClick={() => setView('packing')}
        >
          <Box size={18} />
          Packing Slips
        </button>
        <button
          className={`view-tab ${view === 'shipments' ? 'view-tab--active' : ''}`}
          onClick={() => setView('shipments')}
        >
          <Truck size={18} />
          Shipments
        </button>
        <button
          className={`view-tab ${view === 'bins' ? 'view-tab--active' : ''}`}
          onClick={() => setView('bins')}
        >
          <MapPin size={18} />
          Bin Locations
        </button>
        <button
          className={`view-tab ${view === 'metrics' ? 'view-tab--active' : ''}`}
          onClick={() => setView('metrics')}
        >
          <BarChart3 size={18} />
          Performance
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {view === 'picks' && (
              <>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picking">Picking</option>
                <option value="completed">Completed</option>
              </>
            )}
            {view === 'packing' && (
              <>
                <option value="draft">Draft</option>
                <option value="packing">Packing</option>
                <option value="completed">Completed</option>
              </>
            )}
            {view === 'shipments' && (
              <>
                <option value="pending">Pending</option>
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
              </>
            )}
          </select>
        </div>

        <button className="btn btn--secondary">
          <Download size={18} />
          Export
        </button>
      </div>

      {view === 'picks' && (
        <div className="pick-lists">
          <div className="cards-grid">
            {pickLists.map(pick => (
              <div key={pick.id} className="pick-card">
                <div className="pick-card__header">
                  <div>
                    <strong>{pick.pickListNumber}</strong>
                    <span className={`priority-badge priority-badge--${pick.priority}`}>
                      {pick.priority}
                    </span>
                  </div>
                  <span className={`status-badge status-badge--${pick.status}`}>
                    {getStatusIcon(pick.status)}
                    {pick.status}
                  </span>
                </div>

                <div className="pick-card__meta">
                  {pick.assignedTo && (
                    <div className="meta-item">
                      <User size={14} />
                      {pick.assignedTo}
                    </div>
                  )}
                  <div className="meta-item">
                    <Clock size={14} />
                    Due: {pick.dueDate.toLocaleTimeString()}
                  </div>
                </div>

                <div className="pick-card__progress">
                  <div className="progress-info">
                    <span className="label">Progress</span>
                    <span className="value">{pick.completionPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar__fill"
                      style={{ width: `${pick.completionPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pick-card__items">
                  <span className="items-count">{pick.items.length} items</span>
                  <div className="item-locations">
                    {pick.items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="location-badge">
                        <MapPin size={12} />
                        {item.binLocation}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pick-card__actions">
                  <button
                    className="btn btn--sm"
                    onClick={() => handleViewDetails(pick)}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button className="btn btn--sm btn--primary">
                    <Navigation size={16} />
                    Start Picking
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'packing' && (
        <div className="packing-slips">
          <table className="data-table">
            <thead>
              <tr>
                <th>Slip Number</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packingSlips.map(slip => (
                <tr key={slip.id}>
                  <td><strong>{slip.slipNumber}</strong></td>
                  <td>{slip.orderId}</td>
                  <td>{slip.customerName}</td>
                  <td>{slip.items.length} items</td>
                  <td>{slip.totalWeight} lbs</td>
                  <td>
                    <span className={`status-badge status-badge--${slip.status}`}>
                      {getStatusIcon(slip.status)}
                      {slip.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleViewDetails(slip)}
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="btn-icon" title="Print">
                        <Printer size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'shipments' && (
        <div className="shipments">
          <div className="cards-grid">
            {shipments.map(shipment => (
              <div key={shipment.id} className="shipment-card">
                <div className="shipment-card__header">
                  <div>
                    <strong>{shipment.trackingNumber}</strong>
                    <span className="carrier-badge">
                      <Truck size={12} />
                      {shipment.carrier}
                    </span>
                  </div>
                  <span className={`status-badge status-badge--${shipment.status}`}>
                    {getStatusIcon(shipment.status)}
                    {shipment.status}
                  </span>
                </div>

                <div className="shipment-card__route">
                  <div className="route-point">
                    <div className="route-icon">
                      <MapPin size={16} />
                    </div>
                    <div className="route-info">
                      <span className="route-label">Origin</span>
                      <span className="route-value">{shipment.origin}</span>
                    </div>
                  </div>
                  <div className="route-line"></div>
                  <div className="route-point">
                    <div className="route-icon">
                      <Navigation size={16} />
                    </div>
                    <div className="route-info">
                      <span className="route-label">Destination</span>
                      <span className="route-value">{shipment.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="shipment-card__details">
                  <div className="detail-item">
                    <span className="label">Items:</span>
                    <span className="value">{shipment.items}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Weight:</span>
                    <span className="value">{shipment.weight} lbs</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Est. Delivery:</span>
                    <span className="value">
                      {shipment.estimatedDelivery.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn--sm btn--full"
                  onClick={() => handleViewDetails(shipment)}
                >
                  <Eye size={16} />
                  Track Shipment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'bins' && (
        <div className="bin-locations">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bin Code</th>
                <th>Zone</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Utilization</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {binLocations.map(bin => (
                <tr key={bin.id}>
                  <td><strong>{bin.binCode}</strong></td>
                  <td>{bin.zone}</td>
                  <td>{bin.aisle} - {bin.bay} - {bin.level}</td>
                  <td>{bin.capacity} cu ft</td>
                  <td>
                    <div className="utilization-cell">
                      <div className="progress-bar progress-bar--sm">
                        <div
                          className={`progress-bar__fill ${
                            (bin.currentUtilization / bin.capacity) * 100 > 90
                              ? 'progress-bar__fill--danger'
                              : ''
                          }`}
                          style={{
                            width: `${(bin.currentUtilization / bin.capacity) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="utilization-value">
                        {Math.round((bin.currentUtilization / bin.capacity) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td>{bin.itemCount}</td>
                  <td>
                    <span className={`status-badge status-badge--${bin.status}`}>
                      {bin.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View">
                        <Eye size={18} />
                      </button>
                      <button className="btn-icon" title="Edit">
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'metrics' && metrics && (
        <div className="metrics-view">
          <div className="metrics-header">
            <h2>Warehouse Performance Metrics</h2>
          </div>

          <div className="metrics-cards">
            <div className="metric-card">
              <div className="metric-card__icon metric-card__icon--success">
                <CheckCircle size={28} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Pick Accuracy</span>
                <span className="metric-card__value">{metrics.pickAccuracy}%</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon metric-card__icon--primary">
                <TrendingUp size={28} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Pick Rate</span>
                <span className="metric-card__value">{metrics.pickRate}/hr</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon metric-card__icon--info">
                <Clock size={28} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Avg Pick Time</span>
                <span className="metric-card__value">{metrics.averagePickTime} min</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon metric-card__icon--success">
                <Truck size={28} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">On-Time Shipments</span>
                <span className="metric-card__value">{metrics.onTimeShipments}%</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon metric-card__icon--warning">
                <BarChart3 size={28} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Utilization Rate</span>
                <span className="metric-card__value">{metrics.utilizationRate}%</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon metric-card__icon--primary">
                <Package size={28} />
              </div>
              <div className="metric-card__content">
                <span className="metric-card__label">Orders Fulfilled</span>
                <span className="metric-card__value">{metrics.ordersFulfilled}</span>
              </div>
            </div>
          </div>

          <div className="metrics-tables">
            <div className="metrics-table-container">
              <h3>Zone Performance</h3>
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Pick Rate</th>
                    <th>Accuracy</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.zonePerformance.map((zone, idx) => (
                    <tr key={idx}>
                      <td><strong>{zone.zone}</strong></td>
                      <td>{zone.pickRate}/hr</td>
                      <td>
                        <span className="percentage percentage--good">
                          {zone.accuracy}%
                        </span>
                      </td>
                      <td>
                        <div className="utilization-cell">
                          <div className="progress-bar progress-bar--sm">
                            <div
                              className="progress-bar__fill"
                              style={{ width: `${zone.utilization}%` }}
                            ></div>
                          </div>
                          <span className="utilization-value">{zone.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="metrics-table-container">
              <h3>Top Performers</h3>
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Picks</th>
                    <th>Accuracy</th>
                    <th>Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topPerformers.map((performer, idx) => (
                    <tr key={idx}>
                      <td><strong>{performer.name}</strong></td>
                      <td>{performer.picksCompleted}</td>
                      <td>
                        <span className="percentage percentage--good">
                          {performer.accuracy}%
                        </span>
                      </td>
                      <td>{performer.avgTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
