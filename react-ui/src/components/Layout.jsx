import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, ClipboardList, User, Plus, FileText } from 'lucide-react'

export const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const hideFab = ['/add-log', '/add-note', '/profile'].some(path => location.pathname.includes(path))

  return (
    <div className="relative flex flex-col min-h-[100dvh] max-w-md mx-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-2xl overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-24 p-6">
        <Outlet />
      </main>

      <div className={`fixed bottom-[80px] right-4 sm:right-[calc(50%-224px+16px)] z-50 ${hideFab ? 'hidden' : ''}`}>
        <button 
          className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg active:scale-95 transition-transform" 
          onClick={() => navigate(location.pathname === '/notes' ? '/add-note' : '/add-log')}
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
