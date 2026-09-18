import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { LogOut, User, Settings, Bell, ChevronRight, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [currency, setCurrency] = useState('NPR')

  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency')
    if (savedCurrency) {
      setCurrency(savedCurrency)
    } else {
      localStorage.setItem('preferredCurrency', 'NPR')
    }
  }, [])

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value
    setCurrency(newCurrency)
    localStorage.setItem('preferredCurrency', newCurrency)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h1>Profile</h1>
      </header>

      <div className="profile-card">
        <div className="avatar-placeholder">
          <User size={40} className="text-secondary" />
        </div>
        <div className="profile-info">
          <h2>{user?.email?.split('@')[0] || 'User'}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="section mt-6">
        <div className="section-header">
          <h2>Settings</h2>
        </div>
        
        <div className="card mt-2">
          <div className="flex-between">
            <div className="flex-center">
              <Globe size={20} className="text-primary mr-2" />
              <label htmlFor="currency-select" style={{ fontWeight: 500 }}>Currency</label>
            </div>
          </div>
          <select 
            id="currency-select"
            value={currency} 
            onChange={handleCurrencyChange}
          >
            <option value="NPR">Nepali Rupee (NPR)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="INR">Indian Rupee (INR)</option>
          </select>
        </div>
      </div>

      <div className="settings-list mt-6">
        <div className="setting-item">
          <div className="setting-icon bg-primary-light">
            <Settings size={20} className="text-primary" />
          </div>
          <div className="setting-content">
            <h4>Account Settings</h4>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </div>

        <div className="setting-item">
          <div className="setting-icon bg-secondary-light">
            <Bell size={20} className="text-secondary" />
          </div>
          <div className="setting-content">
            <h4>Notifications</h4>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </div>
      </div>

      <button className="btn-outline w-full mt-8 flex-center" onClick={handleLogout}>
        <LogOut size={20} className="mr-2" />
        Logout
      </button>
    </div>
  )
}
