import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function CurrencySettings() {
  const navigate = useNavigate()
  const { user, currency, setCurrency } = useAuth()
  const [saving, setSaving] = useState(false)

  const currencies = [
    { code: 'NPR', label: 'Nepali Rupee (NPR)', symbol: 'रू' },
    { code: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { code: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' }
  ]

  const handleSelect = async (code) => {
    setCurrency(code)
    localStorage.setItem('preferredCurrency', code)
    
    if (user) {
      setSaving(true)
      await supabase
        .from('user_profiles')
        .update({ currency: code })
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
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Currency</h1>
          <p className="text-xs text-zinc-500">Select your preferred currency</p>
        </div>
      </header>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {currencies.map(c => {
          const isActive = currency === c.code;
          return (
            <div 
              key={c.code} 
              className={`p-5 flex items-center justify-between cursor-pointer transition-colors active:bg-zinc-100 dark:active:bg-zinc-800 ${
                isActive ? 'bg-orange-50/50 dark:bg-orange-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
              onClick={() => handleSelect(c.code)}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-serif text-lg ${isActive ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  {c.symbol}
                </div>
                <h4 className={`text-base ${isActive ? 'font-bold text-orange-700 dark:text-orange-400' : 'font-semibold text-zinc-700 dark:text-zinc-300'}`}>
                  {c.label}
                </h4>
              </div>
              {isActive && (
                <div className="text-orange-600 bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-full">
                  <Check size={18} strokeWidth={3} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {saving && (
        <div className="mt-6 flex justify-center">
          <p className="text-sm font-semibold text-zinc-500 animate-pulse">Saving preference...</p>
        </div>
      )}
    </div>
  )
}
