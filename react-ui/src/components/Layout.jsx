import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, ClipboardList, User, Plus, FileText, Fuel, Wrench, Receipt, Bell } from 'lucide-react'

export const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const hideFab = ['/add-log', '/add-note', '/add-reminder', '/add-odometer', '/profile'].some(path => location.pathname.includes(path))
  
  const [isFabOpen, setIsFabOpen] = useState(false)

  const handleAction = (path) => {
    setIsFabOpen(false)
    navigate(path)
  }

  return (
    <div className="relative flex flex-col min-h-[100dvh] max-w-md mx-auto bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-2xl overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-24 p-6" onClick={() => isFabOpen && setIsFabOpen(false)}>
        <Outlet />
      </main>

      {/* FAB Backdrop */}
      {isFabOpen && !hideFab && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsFabOpen(false)}
        />
      )}

      {/* FAB Menu */}
      <div className={`fixed bottom-[80px] right-4 sm:right-[calc(50%-224px+16px)] z-50 flex flex-col items-end gap-3 ${hideFab ? 'hidden' : ''}`}>
        
        {isFabOpen && (
          <div className="flex flex-col gap-3 mb-2 items-end fade-in">
            <button onClick={() => handleAction('/add-reminder')} className="flex items-center gap-3 active:scale-95 transition-transform group">
              <span className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm border border-zinc-200 dark:border-zinc-700">Reminder</span>
              <div className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg">
                <Bell size={20} />
              </div>
            </button>
            <button onClick={() => handleAction('/add-note')} className="flex items-center gap-3 active:scale-95 transition-transform group">
              <span className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm border border-zinc-200 dark:border-zinc-700">Note</span>
              <div className="h-12 w-12 rounded-full bg-zinc-600 text-white flex items-center justify-center shadow-lg">
                <FileText size={20} />
              </div>
            </button>
            <button onClick={() => handleAction('/add-log?type=tax')} className="flex items-center gap-3 active:scale-95 transition-transform group">
              <span className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm border border-zinc-200 dark:border-zinc-700">Tax & Insurance</span>
              <div className="h-12 w-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                <Receipt size={20} />
              </div>
            </button>
            <button onClick={() => handleAction('/add-log?type=service')} className="flex items-center gap-3 active:scale-95 transition-transform group">
              <span className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm border border-zinc-200 dark:border-zinc-700">Service</span>
              <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                <Wrench size={20} />
              </div>
            </button>
            <button onClick={() => handleAction('/add-odometer')} className="flex items-center gap-3 active:scale-95 transition-transform group">
              <span className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm border border-zinc-200 dark:border-zinc-700">Odometer</span>
              <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <ClipboardList size={20} />
              </div>
            </button>
            <button onClick={() => handleAction('/add-log?type=fuel')} className="flex items-center gap-3 active:scale-95 transition-transform group">
              <span className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm border border-zinc-200 dark:border-zinc-700">Fuel</span>
              <div className="h-12 w-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg">
                <Fuel size={20} />
              </div>
            </button>
          </div>
        )}

        <button 
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform duration-300 ${isFabOpen ? 'rotate-45 bg-zinc-800 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900' : 'bg-orange-600 text-white'}`} 
          onClick={() => setIsFabOpen(!isFabOpen)}
        >
          <Plus size={28} />
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center pb-safe z-50">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-16 gap-1 transition-colors ${isActive ? 'text-orange-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
          {({ isActive }) => (
            <>
              <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>Dashboard</span>
            </>
          )}
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `flex flex-col items-center justify-center w-16 gap-1 transition-colors ${isActive ? 'text-orange-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
          {({ isActive }) => (
            <>
              <ClipboardList size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>Logs</span>
            </>
          )}
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `flex flex-col items-center justify-center w-16 gap-1 transition-colors ${isActive ? 'text-orange-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
          {({ isActive }) => (
            <>
              <FileText size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>Notes</span>
            </>
          )}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center justify-center w-16 gap-1 transition-colors ${isActive ? 'text-orange-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
          {({ isActive }) => (
            <>
              <User size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>Profile</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
