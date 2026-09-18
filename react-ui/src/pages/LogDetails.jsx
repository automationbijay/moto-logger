import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Trash2, Edit3, Fuel, Wrench, Calendar, MapPin, DollarSign, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LogDetails() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')
  const id = searchParams.get('id')
  
  const { currencySymbol } = useAuth()
  
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLog = async () => {
      if (!id || !type) {
        navigate('/logs')
        return
      }

      try {
        let table = ''
        if (type === 'fuel') table = 'fuel_records'
        else if (type === 'service') table = 'service_records'
        else {
          navigate('/logs')
          return
        }

        const { data, error: dbError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single()

        if (dbError) throw dbError
        setLog(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLog()
  }, [id, type, navigate])

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this log?")) return
    
    setDeleting(true)
    try {
      const table = type === 'fuel' ? 'fuel_records' : 'service_records'
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        
      if (dbError) throw dbError
      navigate('/logs', { replace: true })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col pb-8">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Log Details</h1>
        </header>
        <div className="flex justify-center py-12"><p className="text-zinc-500 animate-pulse">Loading...</p></div>
      </div>
    )
  }

  if (!log) return null

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
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Log Details</h1>
            <p className="text-xs text-zinc-500 capitalize">{type} Record</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/add-log?type=${type}&editId=${id}`)}
            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
            aria-label="Edit log"
          >
            <Edit3 size={20} />
          </button>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
            aria-label="Delete log"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6">
        
        <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <div className={`p-4 rounded-2xl ${type === 'service' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600'}`}>
            {type === 'service' ? <Wrench size={32} /> : <Fuel size={32} />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {type === 'service' ? log.description || 'Service' : `${log.liters}L Fuel`}
            </h2>
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mt-1">
              {currencySymbol}{log.cost}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 flex justify-center text-zinc-400">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Date</p>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{log.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 flex justify-center text-zinc-400">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Odometer</p>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{log.odometer} km</p>
            </div>
          </div>

          {type === 'fuel' && (
            <>
              {log.is_fill_to_full && (
                <div className="ml-14 -mt-2">
                  <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-md font-medium">Filled to full tank</span>
                </div>
              )}
              {log.missed_previous_fill && (
                <div className="ml-14 -mt-2">
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md font-medium">Missed previous fill</span>
                </div>
              )}
            </>
          )}

          {log.notes && (
            <div className="flex gap-4 mt-2">
              <div className="w-10 flex justify-center text-zinc-400 pt-0.5">
                <FileText size={20} />
              </div>
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{log.notes}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
