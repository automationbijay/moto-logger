import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { supabase } from '../lib/supabase.js'
import { LogOut, User, Settings, Bell, ChevronRight, Globe, Plus, Bike, Edit2, Clock, CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'

export default function Profile() {
  const { user, profile, currency, monthStartDay } = useAuth()
  const { vehicles, activeVehicleId, changeActiveVehicle } = useVehicle()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profile</h1>
        <VehicleSwitcher />
      </header>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
        {user?.user_metadata?.avatar_url ? (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="Profile" 
            className="w-16 h-16 rounded-full object-cover border border-zinc-100 dark:border-zinc-800 shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
            <User size={32} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate">
            {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </h2>
          <p className="text-sm text-zinc-500 truncate">{profile?.email || user?.email}</p>
        </div>
        <button 
          onClick={() => navigate('/edit-profile')}
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <Edit2 size={20} />
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">My Vehicles</h2>
          <button 
            className="p-2 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-full hover:bg-orange-200 dark:hover:bg-orange-500/20 transition-colors" 
            onClick={() => navigate('/vehicle')}
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {vehicles.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-sm">
              <div className="mx-auto bg-zinc-100 dark:bg-zinc-800 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Bike size={28} className="text-zinc-400" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-5">No vehicles added yet</p>
              <button 
                className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl shadow-md active:scale-[0.98] transition-all" 
                onClick={() => navigate('/vehicle')}
              >
                Add Your First Vehicle
              </button>
            </div>
          ) : (
            vehicles.map(v => (
              <div 
                key={v.id} 
                className={`bg-white dark:bg-zinc-900 border-2 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                  activeVehicleId === v.id 
                    ? 'border-orange-500 shadow-sm' 
                    : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`} 
                onClick={() => changeActiveVehicle(v.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${activeVehicleId === v.id ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    <Bike size={20} />
                  </div>
                  <div>
                    <h4 className={`font-bold m-0 ${activeVehicleId === v.id ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {v.year} {v.make} {v.model}
                    </h4>
                    <p className="text-zinc-500 text-sm mt-0.5">{v.license_plate || 'No Plate'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activeVehicleId === v.id && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-500/10 text-orange-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                      Active
                    </span>
                  )}
                  <button 
                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" 
                    onClick={(e) => { e.stopPropagation(); navigate(`/vehicle?id=${v.id}`); }}
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Settings</h2>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800" onClick={() => navigate('/currency')}>
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                <Globe size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Currency</h4>
                <p className="text-zinc-500 text-sm">{currency}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-400" />
          </div>

          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800" onClick={() => navigate('/analytics-settings')}>
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-xl">
                <CalendarDays size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Analytics Settings</h4>
                <p className="text-zinc-500 text-sm">Month starts on day {monthStartDay || 1}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-400" />
          </div>

          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800" onClick={() => navigate('/reminders')}>
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 rounded-xl">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Reminders</h4>
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-400" />
          </div>

          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-green-100 dark:bg-green-500/10 text-green-600 rounded-xl">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h4>
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-400" />
          </div>
        </div>
      </section>

      <button 
        className="w-full py-3.5 px-4 bg-white dark:bg-zinc-900 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-500 font-bold rounded-2xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4" 
        onClick={handleLogout}
      >
        <LogOut size={20} />
        Log Out
      </button>
    </div>
  )
}
