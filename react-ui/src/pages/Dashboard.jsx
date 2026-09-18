import { useAuth } from '../contexts/AuthContext.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Wrench, Fuel } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const { activeVehicle } = useVehicle()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back, {user?.email}</p>
        </div>
        <VehicleSwitcher />
      </header>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform">
          <div className="bg-orange-100 dark:bg-orange-500/10 p-3 rounded-xl text-orange-600">
            <Wrench size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent Service</h3>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">2 days ago</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform">
          <div className="bg-blue-100 dark:bg-blue-500/10 p-3 rounded-xl text-blue-600">
            <Fuel size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Last Fill-up</h3>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">220 km ago</p>
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
            <li className="py-3 text-sm text-zinc-700 dark:text-zinc-300 first:pt-0 last:pb-0">
              Oil change due in 300 km
            </li>
            <li className="py-3 text-sm text-zinc-700 dark:text-zinc-300 first:pt-0 last:pb-0">
              Chain lubrication needed
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
