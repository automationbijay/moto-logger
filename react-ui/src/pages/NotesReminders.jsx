import React, { useState } from 'react'
import { AlertCircle, FileText, Bell } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'

export default function NotesReminders() {
  const [activeTab, setActiveTab] = useState('notes') // 'notes', 'reminders'

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Notes</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Notes and Reminders</p>
        </div>
        <VehicleSwitcher />
      </header>

      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <button 
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={16} />
          Notes
        </button>
        <button 
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'reminders' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Bell size={16} />
          Reminders
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'notes' ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
              <FileText size={32} className="text-zinc-400" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">No notes added yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <li className="py-3 flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 first:pt-0 last:pb-0">
                <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                <span>Oil change due in 300 km</span>
              </li>
              <li className="py-3 flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 first:pt-0 last:pb-0">
                <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                <span>Chain lubrication needed</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
