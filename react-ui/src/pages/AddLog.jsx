import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { ChevronLeft, Fuel, Wrench, ArrowUpCircle, FileText, Receipt } from 'lucide-react'

export default function AddLog() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currencySymbol } = useAuth()
  
  // Log types
  const logTypes = [
    { id: 'fuel', label: 'Fuel', icon: Fuel, activeBg: 'bg-orange-500', activeText: 'text-white' },
    { id: 'service', label: 'Service', icon: Wrench, activeBg: 'bg-blue-500', activeText: 'text-white' },
    { id: 'upgrade', label: 'Upgrade', icon: ArrowUpCircle, activeBg: 'bg-purple-500', activeText: 'text-white' },
    { id: 'tax', label: 'Tax', icon: Receipt, activeBg: 'bg-amber-500', activeText: 'text-white' },
    { id: 'note', label: 'Note', icon: FileText, activeBg: 'bg-zinc-600', activeText: 'text-white' },
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
    <div className="flex flex-col pb-8">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 -ml-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Add Log</h1>
            <p className="text-xs text-zinc-500">New entry for your vehicle</p>
          </div>
        </div>
        <VehicleSwitcher />
      </header>

      {/* Log Type Selector (Horizontal Scroll) */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-4 -mx-5 px-5 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {logTypes.map((type) => {
          const Icon = type.icon
          const isActive = activeType === type.id
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl min-w-[80px] flex-shrink-0 transition-all ${
                isActive 
                  ? `${type.activeBg} ${type.activeText} shadow-md` 
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs ${isActive ? 'font-bold' : 'font-semibold'}`}>{type.label}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-5">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Date</label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleInputChange} 
            required 
            className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all"
          />
        </div>

        {['fuel', 'service', 'upgrade'].includes(activeType) && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Odometer (km)</label>
            <input 
              type="number" 
              name="odometer" 
              value={formData.odometer} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. 15200"
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>
        )}

        {['service', 'upgrade', 'tax', 'note'].includes(activeType) && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{activeType === 'note' ? 'Title' : 'Description'}</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              required 
              placeholder="What was done?"
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>
        )}

        {activeType === 'fuel' && (
          <div className="flex gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Liters</label>
              <input 
                type="number" 
                step="0.01" 
                name="liters" 
                value={formData.liters} 
                onChange={handleInputChange} 
                required 
                placeholder="0.00"
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cost ({currencySymbol})</label>
              <input 
                type="number" 
                step="0.01" 
                name="cost" 
                value={formData.cost} 
                onChange={handleInputChange} 
                required 
                placeholder="0.00"
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>
        )}

        {['service', 'upgrade', 'tax'].includes(activeType) && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cost ({currencySymbol})</label>
            <input 
              type="number" 
              step="0.01" 
              name="cost" 
              value={formData.cost} 
              onChange={handleInputChange} 
              placeholder="0.00 (Optional)"
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>
        )}

        {activeType === 'fuel' && (
          <div className="flex flex-col gap-4 p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="is_fill_to_full" 
                checked={formData.is_fill_to_full} 
                onChange={handleInputChange}
                className="w-5 h-5 accent-orange-600 rounded bg-zinc-100 border-zinc-300"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filled to full tank</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="missed_previous_fill" 
                checked={formData.missed_previous_fill} 
                onChange={handleInputChange}
                className="w-5 h-5 accent-orange-600 rounded bg-zinc-100 border-zinc-300"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Missed previous fill</span>
            </label>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Notes</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleInputChange} 
            placeholder="Any additional details..."
            className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400 min-h-[100px] resize-y"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-4 mt-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center"
        >
          {loading ? 'Saving...' : `Save ${logTypes.find(t => t.id === activeType)?.label}`}
        </button>
      </form>
    </div>
  )
}
