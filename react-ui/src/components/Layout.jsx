import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, User, Plus, FileText, Bell } from 'lucide-react'

export const Layout = () => {
  const navigate = useNavigate()

  return (
    <div className="app-container">
      <main className="main-content">
        <Outlet />
      </main>

      <div className="fab-container">
        <button className="fab" onClick={() => navigate('/add-log')}>
          <Plus size={28} />
        </button>
      </div>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList size={24} />
          <span>Logs</span>
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={24} />
          <span>Notes</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
