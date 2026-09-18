import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function CurrencySettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [currency, setCurrency] = useState('NPR')
  const [saving, setSaving] = useState(false)

  const currencies = [
    { code: 'NPR', label: 'Nepali Rupee (NPR)' },
    { code: 'USD', label: 'US Dollar (USD)' },
    { code: 'EUR', label: 'Euro (EUR)' },
    { code: 'INR', label: 'Indian Rupee (INR)' }
  ]

  useEffect(() => {
    const fetchCurrency = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('currency')
          .eq('id', user.id)
          .single()
          
        if (data?.currency) {
          setCurrency(data.currency)
        } else {
          const saved = localStorage.getItem('preferredCurrency')
          if (saved) setCurrency(saved)
        }
      }
    }
    fetchCurrency()
  }, [user])

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
    <div className="page-container fade-in">
      <header className="page-header flex items-center" style={{ display: 'flex', alignItems: 'center' }}>
        <button className="icon-btn mr-4" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>Currency</h1>
          <p className="mt-1 text-muted text-sm">Select your preferred currency</p>
        </div>
      </header>
      
      <div className="section mt-6">
        <div className="settings-list">
          {currencies.map(c => (
            <div 
              key={c.code} 
              className="setting-item"
              onClick={() => handleSelect(c.code)}
              style={{ 
                borderColor: currency === c.code ? 'var(--accent-primary)' : 'var(--border-color)',
                borderWidth: currency === c.code ? '2px' : '1px'
              }}
            >
              <div className="setting-content">
                <h4 style={{ fontWeight: currency === c.code ? 600 : 500 }}>{c.label}</h4>
              </div>
              {currency === c.code && <Check size={20} className="text-primary" />}
            </div>
          ))}
        </div>
        {saving && <p className="text-center text-muted mt-4 text-sm">Saving...</p>}
      </div>
    </div>
  )
}
