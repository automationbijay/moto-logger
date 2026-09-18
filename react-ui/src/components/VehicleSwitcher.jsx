import React, { useState } from 'react'
import { Bike, X, Check } from 'lucide-react'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function VehicleSwitcher() {
  const { vehicles, activeVehicle, activeVehicleId, changeActiveVehicle } = useVehicle()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  if (vehicles.length === 0) return null

  const handleSelect = (id) => {
    changeActiveVehicle(id)
    setIsOpen(false)
  }

  return (
    <>
      <button 
        className="icon-btn" 
        onClick={() => setIsOpen(true)} 
        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehicle</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeVehicle?.make || 'Select'}</div>
        </div>
        <div className="bg-primary-light" style={{ padding: '8px', borderRadius: '50%' }}>
          <Bike size={20} className="text-primary" />
        </div>
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Select Vehicle</h2>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vehicles.map(v => (
                <div 
                  key={v.id} 
                  className="card cursor-pointer flex-between" 
                  onClick={() => handleSelect(v.id)}
                  style={{ 
                    borderColor: activeVehicleId === v.id ? 'var(--accent-primary)' : 'var(--border-color)',
                    borderWidth: activeVehicleId === v.id ? '2px' : '1px'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0 }}>{v.year} {v.make} {v.model}</h4>
                    <p className="text-muted text-sm mt-1">{v.license_plate || 'No Plate'}</p>
                  </div>
                  {activeVehicleId === v.id && <Check size={20} className="text-primary" />}
                </div>
              ))}
              
              <button 
                className="btn-outline w-full mt-2" 
                onClick={() => {
                  setIsOpen(false)
                  navigate('/vehicle')
                }}
              >
                + Add New Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
