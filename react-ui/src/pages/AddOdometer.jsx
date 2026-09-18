import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { ChevronLeft } from 'lucide-react'

export default function AddOdometer() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('editId')
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!editId)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    notes: ''
  })

  const { activeVehicleId: vehicleId } = useVehicle()

  useEffect(() => {
    if (!editId) return
    const fetchRecord = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('odometer_records')
          .select('*')
          .eq('id', editId)
          .single()

        if (dbError) throw dbError
        if (data) {
          setFormData({
            date: data.date || '',
            odometer: data.odometer || '',
            notes: data.notes || ''
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }
    fetchRecord()
  }, [editId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      const payload = {
        vehicle_id: vehicleId,
        date: formData.date,
        odometer: parseInt(formData.odometer, 10),
        notes: formData.notes
      }

      if (editId) {
        const { error: dbError } = await supabase.from('odometer_records').update(payload).eq('id', editId)
        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase.from('odometer_records').insert(payload)
        if (dbError) throw dbError
      }
      
      navigate(-1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col pb-8 fade-in">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 -ml-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {editId ? 'Edit Odometer Reading' : 'Add Odometer Reading'}
            </h1>
            <p className="text-xs text-zinc-500">
              {editId ? 'Update odometer' : 'New odometer record'}
            </p>
          </div>
        </div>
        <VehicleSwitcher />
      </header>

      {fetching ? (
        <div className="flex justify-center py-12"><p className="text-zinc-500 animate-pulse">Loading data...</p></div>
      ) : (
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

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Odometer</label>
            <input 
              type="number" 
              name="odometer" 
              value={formData.odometer} 
              onChange={handleInputChange} 
              required 
              min="0"
              placeholder="e.g. 15000"
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Notes (Optional)</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange} 
              rows="3"
              placeholder="Additional information..."
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400 resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? 'Saving...' : 'Save Odometer'}
          </button>
        </form>
      )}
    </div>
  )
}
