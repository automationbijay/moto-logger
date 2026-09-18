import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bell, Receipt, ShieldCheck } from 'lucide-react'

export default function Reminders() {
  const navigate = useNavigate()
  
  const [taxReminder, setTaxReminder] = useState(true)
  const [insuranceReminder, setInsuranceReminder] = useState(true)

  return (
    <div className="flex flex-col pb-8 fade-in">
      <header className="flex items-center gap-3 mb-6">
        <button 
          className="p-2 -ml-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reminders</h1>
          <p className="text-xs text-zinc-500">Manage your notifications</p>
        </div>
      </header>
      
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl">
              <Receipt size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Tax Reminder</h4>
              <p className="text-sm text-zinc-500">Get notified when tax is due</p>
            </div>
          </div>
          <button 
            type="button" 
            role="switch" 
            aria-checked={taxReminder}
            onClick={() => setTaxReminder(!taxReminder)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${taxReminder ? 'bg-orange-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
          >
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${taxReminder ? 'translate-x-5' : 'translate-x-0'}`}></span>
          </button>
        </div>
        
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Insurance Reminder</h4>
              <p className="text-sm text-zinc-500">Get notified when insurance expires</p>
            </div>
          </div>
          <button 
            type="button" 
            role="switch" 
            aria-checked={insuranceReminder}
            onClick={() => setInsuranceReminder(!insuranceReminder)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${insuranceReminder ? 'bg-orange-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
          >
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${insuranceReminder ? 'translate-x-5' : 'translate-x-0'}`}></span>
          </button>
        </div>

      </div>
    </div>
  )
}
