import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogIn,
  LogOut,
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle,
  User,
  Fuel,
  Gauge,
  FileText,
  X,
  Check,
  ChevronLeft,
  ArrowLeft,
} from 'lucide-react'
import './check-in-out-form.css'

/**
 * Equipment Check-In/Out Form Component
 * Mobile-optimized form for field equipment tracking
 */

// ============================================================================
// Type Definitions
// ============================================================================

type CheckInOutType = 'CHECK_IN' | 'CHECK_OUT'

type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'

type FormData = {
  equipmentId: string
  equipmentName: string
  type: CheckInOutType
  operatorName: string
  operatorCertifications: string[]
  condition: EquipmentCondition
  meterReading: string
  fuelLevel: number
  damageReported: boolean
  damageDescription: string
  photos: string[]
  notes: string
  digitalSignature: string
  location: {
    latitude: number
    longitude: number
    address?: string
  } | null
}

type Equipment = {
  id: string
  name: string
  assetNumber: string
  category: string
  currentLocation?: string
  lastCheckOut?: Date
  assignedTo?: string
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_EQUIPMENT: Equipment[] = [
  { id: 'EQ-001', name: 'Excavator CAT 320', assetNumber: 'EXC-001', category: 'Excavator' },
  { id: 'EQ-002', name: 'Crane Liebherr LTM', assetNumber: 'CRN-002', category: 'Crane' },
  { id: 'EQ-003', name: 'Bulldozer D8T', assetNumber: 'BUL-003', category: 'Bulldozer' },
  { id: 'EQ-004', name: 'Dump Truck Volvo', assetNumber: 'DMP-004', category: 'Dump Truck' },
]

const MOCK_CERTIFICATIONS = [
  'Heavy Equipment Operation',
  'Safety Training',
  'Crane Operation',
  'Forklift Certified',
]

const CONDITIONS: Array<{ value: EquipmentCondition; label: string; color: string }> = [
  { value: 'EXCELLENT', label: 'Excellent', color: '#10b981' },
  { value: 'GOOD', label: 'Good', color: '#3b82f6' },
  { value: 'FAIR', label: 'Fair', color: '#f59e0b' },
  { value: 'POOR', label: 'Poor', color: '#ef4444' },
  { value: 'DAMAGED', label: 'Damaged', color: '#991b1b' },
]

// ============================================================================
// Helper Functions
// ============================================================================

const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; address?: string }> => {
  return new Promise((resolve) => {
    // Mock GPS location (San Francisco)
    setTimeout(() => {
      resolve({
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        address: 'Construction Site, San Francisco, CA',
      })
    }, 1000)
  })
}

// ============================================================================
// Main Component
// ============================================================================

export const CheckInOutForm = () => {
  const navigate = useNavigate()
  
  // State
  const [step, setStep] = useState<'select' | 'form' | 'signature' | 'success'>('select')
  const [formData, setFormData] = useState<FormData>({
    equipmentId: '',
    equipmentName: '',
    type: 'CHECK_OUT',
    operatorName: '',
    operatorCertifications: [],
    condition: 'GOOD',
    meterReading: '',
    fuelLevel: 75,
    damageReported: false,
    damageDescription: '',
    photos: [],
    notes: '',
    digitalSignature: '',
    location: null,
  })
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  
  // Signature canvas ref
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureEmpty, setSignatureEmpty] = useState(true)
  
  // Load GPS location on mount
  useEffect(() => {
    loadLocation()
  }, [])
  
  const loadLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const location = await getCurrentLocation()
      setFormData((prev) => ({ ...prev, location }))
    } catch (error) {
      console.error('Failed to get location:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }
  
  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setSignatureEmpty(false)
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  
  const stopDrawing = () => {
    setIsDrawing(false)
  }
  
  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureEmpty(true)
  }
  
  const saveSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas || signatureEmpty) return
    
    const signatureData = canvas.toDataURL('image/png')
    setFormData((prev) => ({ ...prev, digitalSignature: signatureData }))
    setStep('success')
  }
  
  // Form handlers
  const handleEquipmentSelect = (equipment: Equipment, type: CheckInOutType) => {
    setFormData((prev) => ({
      ...prev,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      type,
    }))
    setStep('form')
  }
  
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const photoData = event.target?.result as string
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, photoData],
      }))
    }
    reader.readAsDataURL(file)
  }
  
  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
    setPhotoPreview(null)
  }
  
  const handleCertificationToggle = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      operatorCertifications: prev.operatorCertifications.includes(cert)
        ? prev.operatorCertifications.filter((c) => c !== cert)
        : [...prev.operatorCertifications, cert],
    }))
  }
  
  const handleSubmitForm = () => {
    // Validate required fields
    if (!formData.operatorName.trim()) {
      alert('Please enter operator name')
      return
    }
    
    if (formData.operatorCertifications.length === 0) {
      alert('Please select at least one certification')
      return
    }
    
    if (formData.damageReported && !formData.damageDescription.trim()) {
      alert('Please describe the damage')
      return
    }
    
    // Move to signature step
    setStep('signature')
  }
  
  // TODO: Use this when implementing actual submission
  // const handleFinalSubmit = async () => {
  //   setIsSubmitting(true)
  //   await new Promise((resolve) => setTimeout(resolve, 1500))
  //   console.log('Submitting check-in/out:', formData)
  //   setIsSubmitting(false)
  // }
  
  const handleReset = () => {
    setFormData({
      equipmentId: '',
      equipmentName: '',
      type: 'CHECK_OUT',
      operatorName: '',
      operatorCertifications: [],
      condition: 'GOOD',
      meterReading: '',
      fuelLevel: 75,
      damageReported: false,
      damageDescription: '',
      photos: [],
      notes: '',
      digitalSignature: '',
      location: formData.location, // Keep location
    })
    setStep('select')
    setSignatureEmpty(true)
  }
  
  // Render steps
  const renderSelectStep = () => (
    <div className="select-step">
      <div className="step-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/equipment')}
          title="Back to Equipment"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2>Select Equipment</h2>
          <p>Choose equipment and action</p>
        </div>
      </div>
      
      <div className="equipment-grid">
        {MOCK_EQUIPMENT.map((equipment) => (
          <div key={equipment.id} className="equipment-card">
            <div className="equipment-info">
              <h3>{equipment.name}</h3>
              <div className="equipment-meta">
                <span>{equipment.assetNumber}</span>
                <span>{equipment.category}</span>
              </div>
            </div>
            <div className="equipment-actions">
              <button
                className="btn btn--success"
                onClick={() => handleEquipmentSelect(equipment, 'CHECK_OUT')}
              >
                <LogOut />
                Check Out
              </button>
              <button
                className="btn btn--primary"
                onClick={() => handleEquipmentSelect(equipment, 'CHECK_IN')}
              >
                <LogIn />
                Check In
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  
  const renderFormStep = () => (
    <div className="form-step">
      <div className="step-header">
        <button className="btn-back" onClick={() => setStep('select')}>
          <ChevronLeft />
        </button>
        <div>
          <h2>
            {formData.type === 'CHECK_OUT' ? (
              <>
                <LogOut className="header-icon" /> Check Out
              </>
            ) : (
              <>
                <LogIn className="header-icon" /> Check In
              </>
            )}
          </h2>
          <p>{formData.equipmentName}</p>
        </div>
      </div>
      
      <div className="form-content">
        {/* Location Info */}
        <div className="info-card">
          <div className="info-card-header">
            <MapPin className="info-icon" />
            <h3>Location</h3>
          </div>
          {isLoadingLocation ? (
            <p className="loading-text">Getting location...</p>
          ) : formData.location ? (
            <div className="location-info">
              <p className="location-address">{formData.location.address || 'Location captured'}</p>
              <p className="location-coords">
                {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
              </p>
            </div>
          ) : (
            <button className="btn btn--secondary" onClick={loadLocation}>
              Get Current Location
            </button>
          )}
        </div>
        
        {/* Operator Information */}
        <div className="form-section">
          <h3>
            <User className="section-icon" />
            Operator Information
          </h3>
          
          <div className="form-group">
            <label>Operator Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={formData.operatorName}
              onChange={(e) => setFormData((prev) => ({ ...prev, operatorName: e.target.value }))}
            />
          </div>
          
          <div className="form-group">
            <label>Certifications *</label>
            <div className="certifications-grid">
              {MOCK_CERTIFICATIONS.map((cert) => (
                <button
                  key={cert}
                  className={`cert-button ${formData.operatorCertifications.includes(cert) ? 'active' : ''}`}
                  onClick={() => handleCertificationToggle(cert)}
                >
                  {formData.operatorCertifications.includes(cert) ? <Check /> : <X />}
                  {cert}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Equipment Condition */}
        <div className="form-section">
          <h3>
            <CheckCircle className="section-icon" />
            Equipment Condition
          </h3>
          
          <div className="condition-grid">
            {CONDITIONS.map((condition) => (
              <button
                key={condition.value}
                className={`condition-button ${formData.condition === condition.value ? 'active' : ''}`}
                style={{
                  '--condition-color': condition.color,
                } as React.CSSProperties}
                onClick={() => setFormData((prev) => ({ ...prev, condition: condition.value }))}
              >
                {condition.label}
              </button>
            ))}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                <Gauge className="label-icon" />
                Meter Reading
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="Hours/Miles"
                value={formData.meterReading}
                onChange={(e) => setFormData((prev) => ({ ...prev, meterReading: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label>
                <Fuel className="label-icon" />
                Fuel Level: {formData.fuelLevel}%
              </label>
              <input
                type="range"
                className="form-slider"
                min="0"
                max="100"
                step="5"
                value={formData.fuelLevel}
                onChange={(e) => setFormData((prev) => ({ ...prev, fuelLevel: parseInt(e.target.value) }))}
              />
              <div className="fuel-gauge">
                <div className="fuel-fill" style={{ width: `${formData.fuelLevel}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Damage Reporting */}
        <div className="form-section">
          <h3>
            <AlertTriangle className="section-icon" />
            Damage Reporting
          </h3>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.damageReported}
              onChange={(e) => setFormData((prev) => ({ ...prev, damageReported: e.target.checked }))}
            />
            <span>Report damage or issues</span>
          </label>
          
          {formData.damageReported && (
            <>
              <div className="form-group">
                <label>Damage Description *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the damage or issue..."
                  rows={4}
                  value={formData.damageDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, damageDescription: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <Camera className="label-icon" />
                  Photos
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="file-input"
                  id="photo-input"
                  onChange={handlePhotoCapture}
                />
                <label htmlFor="photo-input" className="btn btn--secondary btn-file">
                  <Camera />
                  Take Photo
                </label>
                
                {formData.photos.length > 0 && (
                  <div className="photos-grid">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="photo-item">
                        <img
                          src={photo}
                          alt={`Damage ${index + 1}`}
                          onClick={() => setPhotoPreview(photo)}
                        />
                        <button className="photo-remove" onClick={() => removePhoto(index)}>
                          <X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Notes */}
        <div className="form-section">
          <h3>
            <FileText className="section-icon" />
            Additional Notes
          </h3>
          
          <textarea
            className="form-textarea"
            placeholder="Any additional notes or observations..."
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
        
        <button className="btn btn--primary btn-block" onClick={handleSubmitForm}>
          Continue to Signature
        </button>
      </div>
    </div>
  )
  
  const renderSignatureStep = () => (
    <div className="signature-step">
      <div className="step-header">
        <button className="btn-back" onClick={() => setStep('form')}>
          <ChevronLeft />
        </button>
        <div>
          <h2>Digital Signature</h2>
          <p>Sign to confirm {formData.type === 'CHECK_OUT' ? 'check-out' : 'check-in'}</p>
        </div>
      </div>
      
      <div className="signature-content">
        <div className="signature-instructions">
          <p>Please sign in the box below using your finger or stylus</p>
        </div>
        
        <div className="signature-pad">
          <canvas
            ref={signatureCanvasRef}
            width={600}
            height={300}
            className="signature-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {signatureEmpty && (
            <div className="signature-placeholder">Sign here</div>
          )}
        </div>
        
        <div className="signature-actions">
          <button className="btn btn--secondary" onClick={clearSignature}>
            Clear
          </button>
          <button
            className="btn btn--primary"
            onClick={saveSignature}
            disabled={signatureEmpty}
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  )
  
  const renderSuccessStep = () => (
    <div className="success-step">
      <div className="success-icon-wrapper">
        <CheckCircle className="success-icon" />
      </div>
      <h2>
        {formData.type === 'CHECK_OUT' ? 'Checked Out Successfully!' : 'Checked In Successfully!'}
      </h2>
      <p className="success-message">
        {formData.equipmentName} has been {formData.type === 'CHECK_OUT' ? 'checked out' : 'checked in'}{' '}
        by {formData.operatorName}
      </p>
      
      <div className="success-details">
        <div className="detail-item">
          <span className="detail-label">Equipment:</span>
          <span className="detail-value">{formData.equipmentName}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Operator:</span>
          <span className="detail-value">{formData.operatorName}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Condition:</span>
          <span className="detail-value">{formData.condition}</span>
        </div>
        {formData.location && (
          <div className="detail-item">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{formData.location.address || 'GPS Location Captured'}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Time:</span>
          <span className="detail-value">{new Date().toLocaleString()}</span>
        </div>
      </div>
      
      <button className="btn btn--primary btn-block" onClick={handleReset}>
        {formData.type === 'CHECK_OUT' ? 'Check Out Another' : 'Check In Another'}
      </button>
    </div>
  )
  
  // Photo preview modal
  const renderPhotoPreview = () => {
    if (!photoPreview) return null
    
    return (
      <div className="photo-preview-modal" onClick={() => setPhotoPreview(null)}>
        <div className="photo-preview-content">
          <button className="photo-preview-close" onClick={() => setPhotoPreview(null)}>
            <X />
          </button>
          <img src={photoPreview} alt="Preview" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="check-in-out-form">
      <div className="form-container">
        {step === 'select' && renderSelectStep()}
        {step === 'form' && renderFormStep()}
        {step === 'signature' && renderSignatureStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
      
      {renderPhotoPreview()}
      
      {isSubmitting && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Submitting...</p>
        </div>
      )}
    </div>
  )
}
