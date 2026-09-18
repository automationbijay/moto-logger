import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Fuel } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function Logs() {
  const navigate = useNavigate()
  const { activeVehicle } = useVehicle()
  const { currencySymbol } = useAuth()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'service', 'fuel'
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchLogs = async () => {
      if (!activeVehicle?.id) {
        if (isMounted) {
          setLogs([])
          setLoading(false)
        }
        return
      }

      if (isMounted) setLoading(true)

      const [fuelRes, serviceRes] = await Promise.all([
        supabase.from('fuel_records').select('*').eq('vehicle_id', activeVehicle.id),
        supabase.from('service_records').select('*').eq('vehicle_id', activeVehicle.id)
      ])

      if (isMounted) {
        const fuels = (fuelRes.data || []).map(f => ({
          ...f,
          type: 'fuel',
          title: `Fuel: ${f.liters}L`,
          amount: `${f.liters}L`,
          costStr: `${currencySymbol}${f.cost}`,
          odometerStr: `${f.odometer} km`
        }))

        const services = (serviceRes.data || []).map(s => ({
          ...s,
          type: 'service',
          title: s.description || 'Service',
          costStr: `${currencySymbol}${s.cost}`,
          odometerStr: `${s.odometer} km`
        }))

        const combined = [...fuels, ...services].sort((a, b) => new Date(b.date) - new Date(a.date))
        setLogs(combined)
        setLoading(false)
      }
    }

    fetchLogs()
  }, [activeVehicle?.id])

  const filteredLogs = logs.filter(log => activeTab === 'all' || log.type === activeTab)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Logs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Service and Fuel history</p>
        </div>
        <VehicleSwitcher />
      </header>

      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <button 
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'all' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'service' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setActiveTab('service')}
        >
          Service
        </button>
        <button 
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'fuel' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setActiveTab('fuel')}
        >
          Fuel
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-zinc-500 text-center py-4">Loading logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-zinc-500 text-center py-4">No logs found.</p>
        ) : (
          filteredLogs.map(log => (
            <div 
              key={log.id} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => navigate(`/log-details?type=${log.type}&id=${log.id}`)}
            >
              <div className={`p-3 rounded-xl ${log.type === 'service' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600'}`}>
                {log.type === 'service' ? <Wrench size={20} /> : <Fuel size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  {log.title}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 truncate">{log.date} • {log.odometerStr}</p>
                {log.note && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate">{log.note}</p>}
              </div>
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                {log.costStr}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
