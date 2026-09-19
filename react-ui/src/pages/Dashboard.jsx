import { useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { AlertCircle, Fuel, Route, Wallet, Droplet, Gauge } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import ExpensesChart from '../components/ExpensesChart.jsx'
import MonthlyChart from '../components/MonthlyChart.jsx'
import { supabase } from '../lib/supabase.js'
import useSWR, { mutate } from 'swr'

export default function Dashboard() {
  const { currencySymbol } = useAuth()
  const { activeVehicle } = useVehicle()

  const fetchDashboardData = async ([_key, vId]) => {
    const [fuelRes, serviceRes, upgradeRes, taxRes, remindersRes, odoRes] = await Promise.all([
      supabase.from('fuel_records').select('odometer, liters, cost, date').eq('vehicle_id', vId).order('odometer', { ascending: true }),
      supabase.from('service_records').select('cost, date').eq('vehicle_id', vId).order('date', { ascending: true }),
      supabase.from('upgrade_records').select('cost').eq('vehicle_id', vId),
      supabase.from('tax_records').select('cost').eq('vehicle_id', vId),
      supabase.from('reminders').select('*').eq('vehicle_id', vId),
      supabase.from('odometer_history').select('odometer, date').eq('vehicle_id', vId).order('odometer', { ascending: true })
    ])

    return {
      fuels: fuelRes.data || [],
      services: serviceRes.data || [],
      upgrades: upgradeRes.data || [],
      taxes: taxRes.data || [],
      reminders: remindersRes.data || [],
      odos: odoRes.data || []
    }
  }

  const { data, isLoading } = useSWR(
    activeVehicle?.id ? ['dashboard_stats', activeVehicle.id] : null,
    fetchDashboardData
  )

  useEffect(() => {
    if (!activeVehicle?.id) return

    const revalidate = () => mutate(['dashboard_stats', activeVehicle.id])

    const channel = supabase
      .channel('dashboard_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upgrade_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tax_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'odometer_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, revalidate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeVehicle?.id])

  // Derive all state during render based on `data`
  const stats = useMemo(() => {
    if (!data) {
      return { 
        mileage: '-', distance: 0, latestOdo: 0, totalCost: 0, 
        costs: { fuel: 0, service: 0, upgrades: 0, tax: 0 },
        monthly: [], recentServiceStr: '-', lastFillupStr: '-', reminders: [], loading: isLoading 
      }
    }

    const sumCost = (records) => records.reduce((acc, curr) => acc + (curr.cost || 0), 0)
    
    const fuelCost = sumCost(data.fuels)
    const serviceCost = sumCost(data.services)
    const upgradesCost = sumCost(data.upgrades)
    const taxCost = sumCost(data.taxes)
    const totalCost = fuelCost + serviceCost + upgradesCost + taxCost

    let distance = 0
    let latestOdo = 0
    if (data.odos.length > 0) {
      const firstOdo = data.odos[0].odometer || 0
      const lastOdo = data.odos[data.odos.length - 1].odometer || 0
      latestOdo = lastOdo
      distance = Math.max(0, lastOdo - firstOdo)
    }

    let mileage = 0
    let lastFillupStr = 'No data'
    if (data.fuels.length > 0) {
      const lastFuel = data.fuels[data.fuels.length - 1]
      if (data.fuels.length > 1) {
        const firstFuelOdo = data.fuels[0].odometer || 0
        const lastFuelOdo = lastFuel.odometer || 0
        const fuelDistance = Math.max(0, lastFuelOdo - firstFuelOdo)
        
        let totalLiters = 0
        for (let i = 1; i < data.fuels.length; i++) {
          totalLiters += data.fuels[i].liters || 0
        }
        if (totalLiters > 0 && fuelDistance > 0) {
          mileage = fuelDistance / totalLiters
        }
      }
      
      if (lastFuel.date) {
        const fillDate = new Date(lastFuel.date)
        const diffDays = Math.floor(Math.abs(new Date() - fillDate) / (1000 * 60 * 60 * 24))
        lastFillupStr = diffDays === 0 ? 'today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
      }
    }

    let recentServiceStr = 'No data'
    if (data.services.length > 0) {
      const lastService = data.services[data.services.length - 1]
      if (lastService.date) {
        const serviceDate = new Date(lastService.date)
        const diffDays = Math.floor(Math.abs(new Date() - serviceDate) / (1000 * 60 * 60 * 24))
        recentServiceStr = diffDays === 0 ? 'today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
      }
    }

    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(currentYear, i).toLocaleString('en-US', { month: 'long' }),
      expense: 0, minOdo: Infinity, maxOdo: -Infinity, distance: 0
    }))

    const currentYearStr = currentYear.toString();
    const processMonthly = (records) => {
      for (let i = 0; i < records.length; i++) {
        const r = records[i]
        if (!r.date || !r.date.startsWith(currentYearStr)) continue
        const m = parseInt(r.date.substring(5, 7), 10) - 1
        if (m >= 0 && m <= 11) monthlyData[m].expense += r.cost || 0
      }
    }

    processMonthly(data.fuels); processMonthly(data.services)
    processMonthly(data.upgrades); processMonthly(data.taxes)

    for (let i = 0; i < data.odos.length; i++) {
      const r = data.odos[i]
      if (!r.date || !r.odometer || !r.date.startsWith(currentYearStr)) continue
      const m = parseInt(r.date.substring(5, 7), 10) - 1
      if (m >= 0 && m <= 11) {
        if (r.odometer < monthlyData[m].minOdo) monthlyData[m].minOdo = r.odometer
        if (r.odometer > monthlyData[m].maxOdo) monthlyData[m].maxOdo = r.odometer
      }
    }

    monthlyData.forEach(m => {
      m.distance = (m.minOdo !== Infinity && m.maxOdo !== -Infinity) ? Math.max(0, m.maxOdo - m.minOdo) : 0
    })

    const dashReminders = [...data.reminders].sort((a, b) => (a.target_date || '9999-12-31').localeCompare(b.target_date || '9999-12-31'))

    return {
      mileage: mileage > 0 ? mileage.toFixed(1) : '-',
      distance,
      latestOdo,
      totalCost,
      costs: { fuel: fuelCost, service: serviceCost, upgrades: upgradesCost, tax: taxCost },
      monthly: monthlyData,
      recentServiceStr,
      lastFillupStr,
      reminders: dashReminders,
      loading: false
    }
  }, [data, isLoading])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        </div>
        <VehicleSwitcher />
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm mb-2">
        {/* Ambient Glow Decorator - keeping the amber accent glow */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-amberFlame/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Row: Label and Trend Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amberFlame"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">expenses<br/></span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Petrol: 200 Rs/L</span>
            </span>
          </div>

          {/* Big Metric Value Display */}
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl font-bold text-amberFlame">{currencySymbol}</span>
            <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 truncate max-w-full">
              {stats.loading ? '...' : new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.totalCost)}
            </span>
          </div>

          {/* Secondary Performance Badges Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {/* Mileage Badge */}
            <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-xl p-2.5 border border-zinc-100 dark:border-zinc-800/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amberFlame/15 flex items-center justify-center text-amberFlame shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4a1 1 0 011-1h6a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM15 5h3a2 2 0 012 2v6a2 2 0 002 2v0a2 2 0 002-2V7a4 4 0 00-4-4h-5v5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-tight">Mileage</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{stats.loading ? '...' : stats.mileage}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium shrink-0">km/L</span>
                </div>
              </div>
            </div>

            {/* Odometer Badge */}
            <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-xl p-2.5 border border-zinc-100 dark:border-zinc-800/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-marineBlue/15 flex items-center justify-center text-marineBlue shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="2"></circle>
                  <path d="M12 12l3-3" strokeLinecap="round" strokeWidth="2"></path>
                  <path d="M8 12h.01M16 12h.01M12 8h.01" strokeLinecap="round" strokeWidth="2"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-tight">Odometer</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{stats.loading ? '...' : stats.latestOdo.toLocaleString()}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium shrink-0">km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4">
        <ExpensesChart costs={stats.costs} />
      </div>

      <div className="mt-4">
        <MonthlyChart data={stats.monthly} />
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
