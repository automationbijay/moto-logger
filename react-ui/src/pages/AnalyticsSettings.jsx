import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, CalendarDays } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function AnalyticsSettings() {
  const navigate = useNavigate()
  const { user, monthStartDay, setMonthStartDay } = useAuth()
  const [saving, setSaving] = useState(false)

  // Generate days 1 to 31
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const handleSelect = async (day) => {
    setMonthStartDay(day)
    localStorage.setItem('monthStartDay', day)
    
    if (user) {
      setSaving(true)
      await supabase
        .from('user_profiles')
        .update({ month_start_day: day })
        .eq('id', user.id)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col pb-8">
      <header className="flex items-center gap-3 mb-6">
        <button 
          className="p-2 -ml-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Monthly Analytics</h1>
          <p className="text-xs text-zinc-500">Set the start day of the month</p>
        </div>
      </header>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Month Starts On</h4>
          <p className="text-sm text-zinc-500 mb-4">Select the day your monthly analytics (like total spent) should reset.</p>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const isActive = monthStartDay === day;
              return (
                <button
                  key={day}
                  onClick={() => handleSelect(day)}
                  className={`p-2 rounded-xl flex items-center justify-center font-medium transition-colors ${
                    isActive 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {saving && (
        <div className="mt-6 flex justify-center">
          <p className="text-sm font-semibold text-zinc-500 animate-pulse">Saving preference...</p>
        </div>
      )}
    </div>
  )
}
