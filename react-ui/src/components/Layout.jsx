import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Home, ClipboardList, User, Plus, X, Wrench, Fuel } from 'lucide-react'

export const Layout = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="app-container">
      <main className="main-content">
        <Outlet />
      </main>

      <div className="fab-container">
        <button className="fab" onClick={() => setIsModalOpen(true)}>
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
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Log</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="dashboard-grid">
              <button className="stat-card w-full" style={{ border: 'none', background: 'var(--bg-secondary-light)', color: 'var(--accent-secondary)' }} onClick={() => setIsModalOpen(false)}>
                <Wrench size={24} className="mr-2" />
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Service Log</span>
              </button>
              <button className="stat-card w-full mt-2" style={{ border: 'none', background: 'var(--bg-primary-light)', color: 'var(--accent-primary)' }} onClick={() => setIsModalOpen(false)}>
                <Fuel size={24} className="mr-2" />
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Fuel Log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
