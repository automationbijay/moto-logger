import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'

export default function VehicleForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const vehicleId = searchParams.get('id')
  
  const { user } = useAuth()
  const { refreshVehicles } = useVehicle()

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (vehicleId) {
      const fetchVehicle = async () => {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single()
          
        if (data) {
          setFormData({
            make: data.make,
            model: data.model,
            year: data.year,
            license_plate: data.license_plate || ''
          })
        }
      }
      fetchVehicle()
    }
  }, [vehicleId])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id.replace('vehicle-', '')]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (vehicleId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(formData)
          .eq('id', vehicleId)
          
        if (updateError) throw updateError
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert([{ ...formData, user_id: user.id }])
          
        if (insertError) throw insertError
      }
      
      await refreshVehicles()
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container fade-in">
      <header className="page-header flex items-center" style={{ display: 'flex', alignItems: 'center' }}>
        <button className="icon-btn mr-4" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>{vehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
          <p className="mt-1 text-muted text-sm">{vehicleId ? 'Update' : 'Add'} your motorcycle information</p>
        </div>
      </header>
      
      <div className="section mt-6">
        <div className="card">
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="vehicle-make">Make</label>
              <input type="text" id="vehicle-make" required value={formData.make} onChange={handleChange} placeholder="e.g. Royal Enfield" />
            </div>
            <div className="form-group">
              <label htmlFor="vehicle-model">Model</label>
              <input type="text" id="vehicle-model" required value={formData.model} onChange={handleChange} placeholder="e.g. Classic 350" />
            </div>
            <div className="form-group">
              <label htmlFor="vehicle-year">Year</label>
              <input type="number" id="vehicle-year" required value={formData.year} onChange={handleChange} placeholder="e.g. 2022" />
            </div>
            <div className="form-group">
              <label htmlFor="vehicle-license_plate">Plate No.</label>
              <input type="text" id="vehicle-license_plate" value={formData.license_plate} onChange={handleChange} placeholder="License Plate Number" />
            </div>

            <button type="submit" className="btn-primary w-full mt-6" disabled={loading}>
              {loading ? 'Saving...' : 'Save Vehicle Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
