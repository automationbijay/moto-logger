import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { supabase } from '../lib/supabase.js'
import { LogOut, User, Settings, Bell, ChevronRight, Globe, Plus, Bike, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user } = useAuth()
  const { vehicles, activeVehicleId, changeActiveVehicle } = useVehicle()
  const navigate = useNavigate()
  
  const [currency, setCurrency] = useState('NPR')
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setProfile(data)
          if (data.currency) {
            setCurrency(data.currency)
            localStorage.setItem('preferredCurrency', data.currency)
          }
        } else {
          const savedCurrency = localStorage.getItem('preferredCurrency')
          if (savedCurrency) {
            setCurrency(savedCurrency)
          } else {
            localStorage.setItem('preferredCurrency', 'NPR')
          }
        }
      }
    }
    fetchProfile()
  }, [user])



  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h1>Profile</h1>
      </header>

      <div className="profile-card flex-between">
        <div className="flex-center" style={{ gap: '1.25rem' }}>
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-16 h-16 rounded-full object-cover" 
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar-placeholder">
              <User size={40} className="text-secondary" />
            </div>
          )}
          <div className="profile-info">
            <h2>{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</h2>
            <p>{profile?.email || user?.email}</p>
          </div>
        </div>
      </div>

      <div className="section mt-6">
        <div className="section-header flex-between">
          <h2>My Vehicles</h2>
          <button className="btn-icon" onClick={() => navigate('/vehicle')}>
            <Plus size={20} />
          </button>
        </div>
        
        <div className="settings-list mt-2">
          {vehicles.length === 0 ? (
            <div className="card text-center" style={{ padding: '2rem' }}>
              <Bike size={32} className="text-muted mx-auto mb-2" style={{ display: 'block', margin: '0 auto 8px auto' }} />
              <p className="text-muted">No vehicles added yet</p>
              <button className="btn-primary mt-4 w-full" onClick={() => navigate('/vehicle')}>Add Your First Vehicle</button>
            </div>
          ) : (
            vehicles.map(v => (
              <div key={v.id} className="card mt-2 cursor-pointer flex-between" onClick={() => changeActiveVehicle(v.id)} style={{ borderColor: activeVehicleId === v.id ? 'var(--accent-primary)' : 'var(--border-color)', borderWidth: activeVehicleId === v.id ? '2px' : '1px' }}>
                <div className="flex-center">
                  <div className="setting-icon bg-primary-light mr-2">
                    <Bike size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{v.year} {v.make} {v.model}</h4>
                    <p className="text-muted text-sm mt-1">{v.license_plate || 'No Plate'}</p>
                  </div>
                </div>
                <div className="flex-center">
                  {activeVehicleId === v.id && (
                    <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-full mr-2" style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Active</span>
                  )}
                  <button className="btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/vehicle?id=${v.id}`); }} style={{ width: '32px', height: '32px' }}>
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section mt-6">
        <div className="section-header">
          <h2>Settings</h2>
        </div>
        
        <div className="settings-list mt-2">
          <div className="setting-item" onClick={() => navigate('/currency')}>
            <div className="setting-icon bg-primary-light">
              <Globe size={20} className="text-primary" />
            </div>
            <div className="setting-content">
              <h4>Currency</h4>
              <p className="text-muted text-sm">{currency}</p>
            </div>
            <ChevronRight size={20} className="text-muted" />
          </div>

          <div className="setting-item" onClick={() => navigate('/edit-profile')}>
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
      </div>

      <button className="btn-outline w-full mt-8 flex-center" onClick={handleLogout}>
        <LogOut size={20} className="mr-2" />
        Logout
      </button>
    </div>
  )
}
