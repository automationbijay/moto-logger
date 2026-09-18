import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { ChevronLeft, Fuel, Wrench, ArrowUpCircle, FileText, Receipt } from 'lucide-react'

export default function AddLog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Log types
  const logTypes = [
    { id: 'fuel', label: 'Fuel', icon: Fuel, color: 'var(--accent-primary)' },
    { id: 'service', label: 'Service', icon: Wrench, color: 'var(--accent-secondary)' },
    { id: 'upgrade', label: 'Upgrade', icon: ArrowUpCircle, color: '#8B5CF6' },
    { id: 'tax', label: 'Tax', icon: Receipt, color: '#F59E0B' },
    { id: 'note', label: 'Note', icon: FileText, color: '#64748B' },
  ]

  const initialType = searchParams.get('type') || 'fuel'
  const [activeType, setActiveType] = useState(initialType)
  
  // Common Form State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    description: '',
    cost: '',
    liters: '',
    is_fill_to_full: true,
    missed_previous_fill: false,
    notes: '',
  })

  const { activeVehicleId: vehicleId } = useVehicle()

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!vehicleId) {
      setError("No vehicle found. Please add a vehicle first.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let table = ''
      let payload = {
        vehicle_id: vehicleId,
        date: formData.date,
        notes: formData.notes
      }

      if (activeType === 'fuel') {
        table = 'fuel_records'
        payload = {
          ...payload,
          odometer: parseInt(formData.odometer, 10),
          liters: parseFloat(formData.liters),
          cost: parseFloat(formData.cost),
          is_fill_to_full: formData.is_fill_to_full,
          missed_previous_fill: formData.missed_previous_fill
        }
      } else if (activeType === 'service' || activeType === 'upgrade') {
        table = activeType === 'service' ? 'service_records' : 'upgrade_records'
        payload = {
          ...payload,
          odometer: parseInt(formData.odometer, 10),
          description: formData.description,
          cost: parseFloat(formData.cost) || 0,
        }
      } else if (activeType === 'tax') {
        table = 'tax_records'
        payload = {
          ...payload,
          description: formData.description,
          cost: parseFloat(formData.cost) || 0,
        }
      } else if (activeType === 'note') {
        table = 'notes'
        payload = {
          ...payload,
          description: formData.description,
          notes_content: formData.notes
        }
      }

      const { error: dbError } = await supabase.from(table).insert(payload)
      if (dbError) throw dbError
      
      navigate(-1) // Go back on success
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container fade-in">
      <header className="page-header flex-between" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="flex-center">
          <button className="icon-btn mr-4" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 style={{ margin: 0 }}>Add Log</h1>
            <p className="mt-1 text-muted text-sm">New entry for your vehicle</p>
          </div>
        </div>
        <VehicleSwitcher />
      </header>

      {/* Log Type Selector (Horizontal Scroll) */}
      <div className="type-selector" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {logTypes.map((type) => {
          const Icon = type.icon
          const isActive = activeType === type.id
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '16px',
                background: isActive ? type.color : 'var(--bg-secondary)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                minWidth: '80px',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <Icon size={24} />
              <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500 }}>{type.label}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="auth-form" style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '24px' }}>
        {error && <div className="error-alert">{error}</div>}

        <div className="form-group">
          <label>Date</label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleInputChange} 
            required 
            style={{ padding: '16px', borderRadius: '12px' }}
          />
        </div>

        {['fuel', 'service', 'upgrade'].includes(activeType) && (
          <div className="form-group">
            <label>Odometer (km)</label>
            <input 
              type="number" 
              name="odometer" 
              value={formData.odometer} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. 15200"
              style={{ padding: '16px', borderRadius: '12px' }}
            />
          </div>
        )}

        {['service', 'upgrade', 'tax', 'note'].includes(activeType) && (
          <div className="form-group">
            <label>{activeType === 'note' ? 'Title' : 'Description'}</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              required 
              placeholder="What was done?"
              style={{ padding: '16px', borderRadius: '12px' }}
            />
          </div>
        )}

        {activeType === 'fuel' && (
          <div className="dashboard-grid" style={{ gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Liters</label>
              <input 
                type="number" 
                step="0.01" 
                name="liters" 
                value={formData.liters} 
                onChange={handleInputChange} 
                required 
                placeholder="0.00"
                style={{ padding: '16px', borderRadius: '12px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Cost</label>
              <input 
                type="number" 
                step="0.01" 
                name="cost" 
                value={formData.cost} 
                onChange={handleInputChange} 
                required 
                placeholder="0.00"
                style={{ padding: '16px', borderRadius: '12px' }}
              />
            </div>
          </div>
        )}

        {['service', 'upgrade', 'tax'].includes(activeType) && (
          <div className="form-group">
            <label>Cost</label>
            <input 
              type="number" 
              step="0.01" 
              name="cost" 
              value={formData.cost} 
              onChange={handleInputChange} 
              placeholder="0.00 (Optional)"
              style={{ padding: '16px', borderRadius: '12px' }}
            />
          </div>
        )}

        {activeType === 'fuel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }} className="cursor-pointer">
              <input 
                type="checkbox" 
                name="is_fill_to_full" 
                checked={formData.is_fill_to_full} 
                onChange={handleInputChange}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
              />
              Filled to full tank
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }} className="cursor-pointer">
              <input 
                type="checkbox" 
                name="missed_previous_fill" 
                checked={formData.missed_previous_fill} 
                onChange={handleInputChange}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
              />
              Missed previous fill
            </label>
          </div>
        )}

        <div className="form-group">
          <label>Notes</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleInputChange} 
            placeholder="Any additional details..."
            style={{ padding: '16px', borderRadius: '12px', minHeight: '100px', resize: 'vertical' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="btn-primary w-full"
          style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            fontSize: '1.1rem', 
            fontWeight: 600,
            background: logTypes.find(t => t.id === activeType)?.color,
            marginTop: '8px'
          }}
        >
          {loading ? 'Saving...' : `Save ${logTypes.find(t => t.id === activeType)?.label}`}
        </button>
      </form>
      
      {/* Hide scrollbar for type-selector in Webkit */}
      <style>{`
        .type-selector::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
