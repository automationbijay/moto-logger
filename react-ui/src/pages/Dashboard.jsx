import { useAuth } from '../contexts/AuthContext.jsx'
import { Bike, AlertCircle, Wrench, Fuel } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.email}</p>
      </header>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Bike className="text-primary" size={24} />
          </div>
          <div className="stat-details">
            <h3>My Motorcycles</h3>
            <p className="stat-value">1 Active</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Wrench className="text-secondary" size={24} />
          </div>
          <div className="stat-details">
            <h3>Recent Service</h3>
            <p className="stat-value">2 days ago</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Fuel className="text-accent" size={24} />
          </div>
          <div className="stat-details">
            <h3>Last Fill-up</h3>
            <p className="stat-value">220 km ago</p>
          </div>
        </div>
      </div>

      <div className="section mt-6">
        <div className="section-header">
          <h2>Needs Attention</h2>
          <AlertCircle size={20} className="text-warning" />
        </div>
        <div className="card">
          <ul className="attention-list">
            <li>Oil change due in 300 km</li>
            <li>Chain lubrication needed</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
