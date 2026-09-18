import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
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
        const { data } = await supabase
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
      navigate(-1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col pb-8">
      <header className="flex items-center gap-3 mb-6">
        <button 
          className="p-2 -ml-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{vehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
          <p className="text-xs text-zinc-500">{vehicleId ? 'Update' : 'Add'} your motorcycle information</p>
        </div>
      </header>
      
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label htmlFor="vehicle-make" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Make</label>
            <input 
              type="text" 
              id="vehicle-make" 
              required 
              value={formData.make} 
              onChange={handleChange} 
              placeholder="e.g. Royal Enfield" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="vehicle-model" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Model</label>
            <input 
              type="text" 
              id="vehicle-model" 
              required 
              value={formData.model} 
              onChange={handleChange} 
              placeholder="e.g. Classic 350" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="vehicle-year" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Year</label>
            <input 
              type="number" 
              id="vehicle-year" 
              required 
              value={formData.year} 
              onChange={handleChange} 
              placeholder="e.g. 2022" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="vehicle-license_plate" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Plate No.</label>
            <input 
              type="text" 
              id="vehicle-license_plate" 
              value={formData.license_plate} 
              onChange={handleChange} 
              placeholder="License Plate Number" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400 uppercase"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-4 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center"
          >
            {loading ? 'Saving...' : 'Save Vehicle Details'}
          </button>
        </form>
      </div>
    </div>
  )
}
