import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Fuel, Receipt } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import useSWR, { mutate } from 'swr'

export default function Logs() {
  const navigate = useNavigate()
  const { activeVehicle } = useVehicle()
  const { currencySymbol } = useAuth()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'service', 'fuel', 'tax'

  const fetchLogsData = async ([_key, vId]) => {
    const [fuelRes, serviceRes, taxRes] = await Promise.all([
      supabase.from('fuel_records').select('*').eq('vehicle_id', vId),
      supabase.from('service_records').select('*').eq('vehicle_id', vId),
      supabase.from('tax_records').select('*').eq('vehicle_id', vId)
    ])
    return {
      fuels: fuelRes.data || [],
      services: serviceRes.data || [],
      taxes: taxRes.data || []
    }
  }

  const { data, isLoading: loading } = useSWR(
    activeVehicle?.id ? ['logs_data', activeVehicle.id] : null,
    fetchLogsData
  )

  useEffect(() => {
    if (!activeVehicle?.id) return

    const revalidate = () => mutate(['logs_data', activeVehicle.id])

    const channel = supabase
      .channel('logs_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tax_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeVehicle?.id])

  const { logs, stats } = useMemo(() => {
    if (!data) return { logs: [], stats: { recentServiceStr: 'No data', lastFillupStr: 'No data' } }

    const fuels = data.fuels.map(f => ({
      ...f,
      type: 'fuel',
      title: `Fuel: ${f.liters}L`,
      amount: `${f.liters}L`,
      costStr: `${currencySymbol}${f.cost}`,
      odometerStr: `${f.odometer} km`
    }))

    const services = data.services.map(s => ({
      ...s,
      type: 'service',
      title: s.description || 'Service',
      costStr: `${currencySymbol}${s.cost}`,
      odometerStr: `${s.odometer} km`
    }))

    const taxes = data.taxes.map(t => ({
      ...t,
      type: 'tax',
      title: t.description || 'Tax',
      costStr: `${currencySymbol}${t.cost}`,
      odometerStr: ''
    }))

    // Sort combined logs descending by date
    const combined = [...fuels, ...services, ...taxes].sort((a, b) => new Date(b.date) - new Date(a.date))

    let recentServiceStr = 'No data'
    let lastFillupStr = 'No data'

    if (fuels.length > 0) {
      const lastFuel = fuels.reduce((max, f) => (f.odometer > max.odometer ? f : max), fuels[0])
      if (lastFuel.date) {
        const fillDate = new Date(lastFuel.date)
        const diffDays = Math.floor(Math.abs(new Date() - fillDate) / (1000 * 60 * 60 * 24))
        lastFillupStr = diffDays === 0 ? 'today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
      }
    }

    if (services.length > 0) {
      const lastService = services.reduce((max, s) => (new Date(s.date) > new Date(max.date) ? s : max), services[0])
      if (lastService.date) {
        const serviceDate = new Date(lastService.date)
        const diffDays = Math.floor(Math.abs(new Date() - serviceDate) / (1000 * 60 * 60 * 24))
        recentServiceStr = diffDays === 0 ? 'today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
      }
    }

    return { logs: combined, stats: { recentServiceStr, lastFillupStr } }
  }, [data, currencySymbol])

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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <div className="bg-orange-100 dark:bg-orange-500/10 p-2.5 rounded-full text-orange-600 mb-2">
            <Wrench size={20} />
          </div>
          <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Recent Service</h3>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{loading ? '...' : stats.recentServiceStr}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 dark:bg-blue-500/10 p-2.5 rounded-full text-blue-600 mb-2">
            <Fuel size={20} />
          </div>
          <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Last Fill-up</h3>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{loading ? '...' : stats.lastFillupStr}</p>
        </div>
      </div>

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
        <button 
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'tax' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setActiveTab('tax')}
        >
          Tax
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
              <div className={`p-3 rounded-xl ${
                log.type === 'service' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600' : 
                log.type === 'tax' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' :
                'bg-blue-100 dark:bg-blue-500/10 text-blue-600'
              }`}>
                {log.type === 'service' ? <Wrench size={20} /> : log.type === 'tax' ? <Receipt size={20} /> : <Fuel size={20} />}
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
