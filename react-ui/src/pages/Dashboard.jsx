import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Wrench, Fuel, Route, Wallet, Droplet, Gauge } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import ExpensesChart from '../components/ExpensesChart.jsx'
import MonthlyChart from '../components/MonthlyChart.jsx'
import { supabase } from '../lib/supabase.js'

export default function Dashboard() {
  const { user, currency, currencySymbol } = useAuth()
  const { activeVehicle } = useVehicle()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ 
    mileage: 0, 
    distance: 0, 
    latestOdo: 0,
    totalCost: 0, 
    costs: { fuel: 0, service: 0, upgrades: 0, tax: 0 },
    monthly: [],
    recentServiceStr: '-', 
    lastFillupStr: '-',
    reminders: [],
    loading: true 
  })

  useEffect(() => {
    let isMounted = true

    const fetchStats = async () => {
      if (!activeVehicle?.id) {
        if (isMounted) setStats({ mileage: 0, distance: 0, latestOdo: 0, totalCost: 0, costs: { fuel: 0, service: 0, upgrades: 0, tax: 0 }, monthly: [], recentServiceStr: '-', lastFillupStr: '-', reminders: [], loading: false })
        return
      }

      if (isMounted) setStats(prev => ({ ...prev, loading: true }))
      
      const vId = activeVehicle.id
      
      const [fuelRes, serviceRes, upgradeRes, taxRes, remindersRes, odoRes] = await Promise.all([
        supabase.from('fuel_records').select('odometer, liters, cost, date').eq('vehicle_id', vId).order('odometer', { ascending: true }),
        supabase.from('service_records').select('cost, date').eq('vehicle_id', vId).order('date', { ascending: true }),
        supabase.from('upgrade_records').select('cost').eq('vehicle_id', vId),
        supabase.from('tax_records').select('cost').eq('vehicle_id', vId),
        supabase.from('reminders').select('*').eq('vehicle_id', vId),
        supabase.from('odometer_history').select('odometer, date').eq('vehicle_id', vId).order('odometer', { ascending: true })
      ])

      let totalCost = 0
      let distance = 0
      let mileage = 0
      let latestOdo = 0
      let lastFillupStr = 'No data'
      let recentServiceStr = 'No data'

      const sumCost = (res) => res.data?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0
      const fuelCost = sumCost(fuelRes)
      const serviceCost = sumCost(serviceRes)
      const upgradesCost = sumCost(upgradeRes)
      const taxCost = sumCost(taxRes)
      
      totalCost = fuelCost + serviceCost + upgradesCost + taxCost
      const costsBreakdown = { fuel: fuelCost, service: serviceCost, upgrades: upgradesCost, tax: taxCost }

      const odoRecords = odoRes.data || []
      if (odoRecords.length > 0) {
        const firstOdo = odoRecords[0].odometer || 0
        const lastOdo = odoRecords[odoRecords.length - 1].odometer || 0
        latestOdo = lastOdo
        distance = Math.max(0, lastOdo - firstOdo)
      }

      const fuels = fuelRes.data || []
      if (fuels.length > 0) {
        const lastFuel = fuels[fuels.length - 1]
        
        if (fuels.length > 1) {
          // Mileage is (last fuel odo - first fuel odo) / sum of liters of all but first fillup
          const firstFuelOdo = fuels[0].odometer || 0
          const lastFuelOdo = lastFuel.odometer || 0
          const fuelDistance = Math.max(0, lastFuelOdo - firstFuelOdo)
          
          let totalLiters = 0
          for (let i = 1; i < fuels.length; i++) {
            totalLiters += fuels[i].liters || 0
          }
          if (totalLiters > 0 && fuelDistance > 0) {
            mileage = fuelDistance / totalLiters
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

      const currentYear = new Date().getFullYear();
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(currentYear, i).toLocaleString('en-US', { month: 'long' }),
        expense: 0,
        minOdo: Infinity,
        maxOdo: -Infinity,
        distance: 0
      }));

      const processRecordsForMonthly = (records) => {
        if (!records) return;
        records.forEach(r => {
          if (!r.date) return;
          const d = new Date(r.date);
          if (d.getFullYear() === currentYear) {
            const m = d.getMonth();
            monthlyData[m].expense += r.cost || 0;
          }
        });
      };

      processRecordsForMonthly(fuelRes.data);
      processRecordsForMonthly(serviceRes.data);
      processRecordsForMonthly(upgradeRes.data);
      processRecordsForMonthly(taxRes.data);

      if (odoRecords.length > 0) {
        odoRecords.forEach(r => {
          if (!r.date) return;
          const d = new Date(r.date);
          if (d.getFullYear() === currentYear && r.odometer) {
            const m = d.getMonth();
            if (r.odometer < monthlyData[m].minOdo) monthlyData[m].minOdo = r.odometer;
            if (r.odometer > monthlyData[m].maxOdo) monthlyData[m].maxOdo = r.odometer;
          }
        });
      }

      monthlyData.forEach(m => {
        if (m.minOdo !== Infinity && m.maxOdo !== -Infinity) {
          m.distance = Math.max(0, m.maxOdo - m.minOdo);
        } else {
          m.distance = 0;
        }
      });

      if (isMounted) {
        setStats({
          mileage: mileage > 0 ? mileage.toFixed(1) : '-',
          distance: distance,
          latestOdo: latestOdo,
          totalCost: totalCost,
          costs: costsBreakdown,
          monthly: monthlyData,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'odometer_records', filter: `vehicle_id=eq.${activeVehicle.id}` }, () => fetchStats())
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
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Gauge size={24} />
              </div>
              <p className="font-medium text-zinc-600 dark:text-zinc-300">Odometer</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {stats.loading ? '...' : stats.latestOdo.toLocaleString()} <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">km</span>
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
