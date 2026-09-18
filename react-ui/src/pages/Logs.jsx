import { useState } from 'react'
import { Wrench, Fuel } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'

export default function Logs() {
  const [activeTab, setActiveTab] = useState('all') // 'all', 'service', 'fuel'

  // Placeholder data
  const logs = [
    { id: 1, type: 'fuel', date: '2026-09-15', amount: '12L', cost: '$18', odometer: '15,200 km', note: 'Full tank' },
    { id: 2, type: 'service', date: '2026-09-10', title: 'Oil Change', cost: '$45', odometer: '15,000 km', note: 'Synthetic oil' },
    { id: 3, type: 'fuel', date: '2026-09-01', amount: '10L', cost: '$15', odometer: '14,900 km', note: '' },
    { id: 4, type: 'service', date: '2026-08-20', title: 'Chain Adjust', cost: '$0', odometer: '14,500 km', note: 'DIY' },
  ]

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
        {filteredLogs.map(log => (
          <div key={log.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer">
            <div className={`p-3 rounded-xl ${log.type === 'service' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600'}`}>
              {log.type === 'service' ? <Wrench size={20} /> : <Fuel size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {log.type === 'service' ? log.title : `Fuel: ${log.amount}`}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 truncate">{log.date} • {log.odometer}</p>
              {log.note && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate">{log.note}</p>}
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
              {log.cost}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
