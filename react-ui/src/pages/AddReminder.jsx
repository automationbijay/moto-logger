import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { ChevronLeft } from 'lucide-react'

export default function AddReminder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('editId')
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!editId)
  const [error, setError] = useState(null)
  
  // Format current date and time for datetime-local input
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0,16)

  const [formData, setFormData] = useState({
    target_datetime: localISOTime,
    description: '',
    notes: ''
  })

  const { activeVehicleId: vehicleId } = useVehicle()

  useEffect(() => {
    if (!editId) return
    const fetchReminder = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('reminders')
          .select('*')
          .eq('id', editId)
          .single()

        if (dbError) throw dbError
        if (data) {
          // Extract time from notes if it exists in the format "[TIME] HH:MM"
          let extractedTime = '00:00'
          let actualNotes = data.notes || ''
          
          if (actualNotes.startsWith('[TIME] ')) {
            const newlineIndex = actualNotes.indexOf('\n')
            if (newlineIndex !== -1) {
              extractedTime = actualNotes.substring(7, newlineIndex)
              actualNotes = actualNotes.substring(newlineIndex).trim()
            } else {
              extractedTime = actualNotes.substring(7)
              actualNotes = ''
            }
          }

          const datePart = data.target_date || new Date().toISOString().split('T')[0]
          
          setFormData({
            target_datetime: `${datePart}T${extractedTime}`,
            description: data.description || '',
            notes: actualNotes
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }
    fetchReminder()
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
      const [datePart, timePart] = formData.target_datetime.split('T')
      
      const payload = {
        vehicle_id: vehicleId,
        metric: 'Date',
        target_date: datePart,
        description: formData.description,
        notes: `[TIME] ${timePart}\n${formData.notes}`.trim()
      }

      if (editId) {
        const { error: dbError } = await supabase.from('reminders').update(payload).eq('id', editId)
        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase.from('reminders').insert(payload)
        if (dbError) throw dbError
      }
      
      navigate(-1) // Go back on success
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
              {editId ? 'Edit Reminder' : 'Add Reminder'}
            </h1>
            <p className="text-xs text-zinc-500">
              {editId ? 'Update your reminder' : 'Set a new notification'}
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
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Date & Time</label>
            <input 
              type="datetime-local" 
              name="target_datetime" 
              value={formData.target_datetime} 
              onChange={handleInputChange} 
              required 
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Title</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              required 
              placeholder="E.g. Renew Insurance"
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Details (Optional)</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange} 
              rows="4"
              placeholder="Additional information..."
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400 resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? 'Saving...' : 'Save Reminder'}
          </button>
        </form>
      )}
    </div>
  )
}
