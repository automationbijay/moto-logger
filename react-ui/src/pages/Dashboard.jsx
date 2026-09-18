import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Wrench, Fuel, Route, Wallet, Droplet } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { supabase } from '../lib/supabase.js'

export default function Dashboard() {
  const { user, currency, currencySymbol } = useAuth()
  const { activeVehicle } = useVehicle()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ 
    mileage: 0, 
    distance: 0, 
    totalCost: 0, 
    recentServiceStr: '-', 
    lastFillupStr: '-',
    reminders: [],
    loading: true 
  })

  useEffect(() => {
    let isMounted = true

    const fetchStats = async () => {
      if (!activeVehicle?.id) {
        if (isMounted) setStats({ mileage: 0, distance: 0, totalCost: 0, recentServiceStr: '-', lastFillupStr: '-', reminders: [], loading: false })
        return
      }

      if (isMounted) setStats(prev => ({ ...prev, loading: true }))
      
      const vId = activeVehicle.id
      
      const [fuelRes, serviceRes, upgradeRes, taxRes, remindersRes] = await Promise.all([
        supabase.from('fuel_records').select('odometer, liters, cost, date').eq('vehicle_id', vId).order('odometer', { ascending: true }),
        supabase.from('service_records').select('cost, date').eq('vehicle_id', vId).order('date', { ascending: true }),
        supabase.from('upgrade_records').select('cost').eq('vehicle_id', vId),
        supabase.from('tax_records').select('cost').eq('vehicle_id', vId),
        supabase.from('reminders').select('*').eq('vehicle_id', vId)
      ])

      let totalCost = 0
      let distance = 0
      let mileage = 0
      let lastFillupStr = 'No data'
      let recentServiceStr = 'No data'

      const sumCost = (res) => res.data?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0
      totalCost += sumCost(fuelRes)
      totalCost += sumCost(serviceRes)
      totalCost += sumCost(upgradeRes)
      totalCost += sumCost(taxRes)

      const fuels = fuelRes.data || []
      if (fuels.length > 0) {
        const firstOdo = fuels[0].odometer || 0
        const lastFuel = fuels[fuels.length - 1]
        const lastOdo = lastFuel.odometer || 0
        distance = Math.max(0, lastOdo - firstOdo)
        
        if (fuels.length > 1) {
          let totalLiters = 0
          for (let i = 1; i < fuels.length; i++) {
            totalLiters += fuels[i].liters || 0
          }
          if (totalLiters > 0) {
            mileage = distance / totalLiters
          }
        }
        
        // Calculate last fill up string
        if (lastFuel.date) {
          const fillDate = new Date(lastFuel.date)
          const today = new Date()
          const diffTime = Math.abs(today - fillDate)
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          lastFillupStr = diffDays === 0 ? 'today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
        }
      }

      const services = serviceRes.data || []
      if (services.length > 0) {
        const lastService = services[services.length - 1]
        if (lastService.date) {
          const serviceDate = new Date(lastService.date)
          const today = new Date()
          const diffTime = Math.abs(today - serviceDate)
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          recentServiceStr = diffDays === 0 ? 'today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
        }
      }

      let dashReminders = []
      if (remindersRes.data) {
        // Parse time if needed, although simple display is fine for dashboard
        dashReminders = remindersRes.data.map(r => ({
           ...r,
           // format the output string slightly differently if needed
        }))
        // sort by target_date
        dashReminders.sort((a, b) => {
          const dateA = a.target_date || '9999-12-31'
          const dateB = b.target_date || '9999-12-31'
          return dateA.localeCompare(dateB)
        })
      }

      if (isMounted) {
        setStats({
          mileage: mileage > 0 ? mileage.toFixed(1) : '-',
          distance: distance,
          totalCost: totalCost,
          recentServiceStr,
          lastFillupStr,
          reminders: dashReminders,
          loading: false
        })
      }
    }

    fetchStats()

    if (!activeVehicle?.id) return

    const channel = supabase
      .channel('dashboard_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upgrade_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tax_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, () => fetchStats())
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [activeVehicle?.id])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        </div>
        <VehicleSwitcher />
      </header>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 mb-2 shadow-sm">
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
                <Fuel size={24} />
              </div>
              <p className="font-medium text-zinc-600 dark:text-zinc-300">Mileage</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {stats.loading ? '...' : stats.mileage} <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">km/L</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <Route size={24} />
              </div>
              <p className="font-medium text-zinc-600 dark:text-zinc-300">Distance</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {stats.loading ? '...' : stats.distance.toLocaleString()} <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">km</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400">
                <Wallet size={24} />
              </div>
              <p className="font-medium text-zinc-600 dark:text-zinc-300">Total Cost</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate max-w-[160px]">
                {(() => {
                  if (stats.loading) return '...'
                  const amount = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.totalCost)
                  return `${currencySymbol} ${amount}`
                })()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
                <Droplet size={24} />
              </div>
              <p className="font-medium text-zinc-600 dark:text-zinc-300">Petrol Price</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                200 <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">rs/L</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform">
          <div className="bg-orange-100 dark:bg-orange-500/10 p-3 rounded-xl text-orange-600">
            <Wrench size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent Service</h3>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{stats.loading ? '...' : stats.recentServiceStr}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform">
          <div className="bg-blue-100 dark:bg-blue-500/10 p-3 rounded-xl text-blue-600">
            <Fuel size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Last Fill-up</h3>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{stats.loading ? '...' : stats.lastFillupStr}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Needs Attention</h2>
          <AlertCircle size={20} className="text-amber-500" />
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {stats.loading ? (
              <li className="py-3 text-sm text-zinc-700 dark:text-zinc-300">Loading...</li>
            ) : stats.reminders.length > 0 ? (
              stats.reminders.map(reminder => (
                <li key={reminder.id} className="py-3 text-sm text-zinc-700 dark:text-zinc-300 first:pt-0 last:pb-0">
                  {reminder.description}
                </li>
              ))
            ) : (
              <li className="py-3 text-sm text-zinc-700 dark:text-zinc-300 first:pt-0 last:pb-0">
                All good!
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
