import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    country: '',
    date_of_birth: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name, email, phone_number, country, date_of_birth')
          .eq('id', user.id)
          .single()
          
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            email: data.email || user.email,
            phone_number: data.phone_number || '',
            country: data.country || '',
            date_of_birth: data.date_of_birth || ''
          })
        }
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(formData)
        .eq('id', user.id)
        
      if (updateError) throw updateError
      
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
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
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Edit Profile</h1>
          <p className="text-xs text-zinc-500">Update your personal information</p>
        </div>
      </header>
      
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
        
        {loading ? (
          <div className="py-12 flex justify-center">
            <p className="text-zinc-500 font-medium animate-pulse">Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Full Name</label>
              <input 
                type="text" 
                id="full_name" 
                value={formData.full_name} 
                onChange={handleChange} 
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex justify-between">
                <span>Email</span>
                <span className="text-xs font-normal text-zinc-400">Read-only</span>
              </label>
              <input 
                type="email" 
                id="email" 
                value={formData.email} 
                onChange={handleChange} 
                disabled 
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-80" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="phone_number" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Phone Number</label>
              <input 
                type="tel" 
                id="phone_number" 
                value={formData.phone_number} 
                onChange={handleChange} 
                placeholder="+977 98..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="date_of_birth" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Date of Birth</label>
              <input 
                type="date" 
                id="date_of_birth" 
                value={formData.date_of_birth} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all" 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="country" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Country</label>
              <input 
                type="text" 
                id="country" 
                value={formData.country} 
                onChange={handleChange} 
                placeholder="Nepal"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all placeholder:text-zinc-400" 
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-4 mt-4 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
