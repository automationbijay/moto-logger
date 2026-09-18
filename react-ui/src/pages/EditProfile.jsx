import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
        const { data, error } = await supabase
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
      
      // Also update Auth email if changed, but Supabase auth email updates require verification. 
      // It's safer to only update the profile table for now, or just show it as disabled.
      
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
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
          <h1 style={{ margin: 0 }}>Edit Profile</h1>
          <p className="mt-1 text-muted text-sm">Update your personal information</p>
        </div>
      </header>
      
      <div className="section mt-6">
        <div className="card">
          {error && <div className="error-alert">{error}</div>}
          
          {loading ? (
            <p className="text-center text-muted">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input type="text" id="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" value={formData.email} onChange={handleChange} disabled title="Email cannot be changed here" style={{ opacity: 0.7 }} />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input type="tel" id="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+977 98..." />
              </div>
              
              <div className="form-group">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input type="date" id="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input type="text" id="country" value={formData.country} onChange={handleChange} placeholder="Nepal" />
              </div>

              <button type="submit" className="btn-primary w-full mt-6" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
