import { useState } from 'react'
import { Wrench, Fuel } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'

export default function Logs() {
  const [activeTab, setActiveTab] = useState('all') // 'all', 'service', 'fuel'

  // Placeholder data
  const logs = [
    { id: 1, type: 'fuel', date: '2026-09-15', amount: '12L', cost: '$18', odometer: '15,200 km', note: 'Full tank' },
    { id: 2, type: 'service', date: '2026-09-10', title: 'Oil Change', cost: '$45', odometer: '15,000 km', note: 'Synthetic oil' },
    { id: 3, type: 'fuel', date: '2026-09-01', amount: '10L', cost: '$15', odometer: '14,900 km', note: '' },
    { id: 4, type: 'service', date: '2026-08-20', title: 'Chain Adjust', cost: '$0', odometer: '14,500 km', note: 'DIY' },
  ]

  const filteredLogs = logs.filter(log => activeTab === 'all' || log.type === activeTab)

  return (
    <div className="page-container fade-in">
      <header className="page-header flex-between">
        <div>
          <h1>Logs</h1>
          <p>Service and Fuel history</p>
        </div>
        <VehicleSwitcher />
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`tab ${activeTab === 'service' ? 'active' : ''}`}
          onClick={() => setActiveTab('service')}
        >
          Service
        </button>
        <button 
          className={`tab ${activeTab === 'fuel' ? 'active' : ''}`}
          onClick={() => setActiveTab('fuel')}
        >
          Fuel
        </button>
      </div>

      <div className="logs-list">
        {filteredLogs.map(log => (
          <div key={log.id} className="log-card">
            <div className={`log-icon ${log.type}`}>
              {log.type === 'service' ? <Wrench size={20} /> : <Fuel size={20} />}
            </div>
            <div className="log-content">
              <h4>{log.type === 'service' ? log.title : `Fuel: ${log.amount}`}</h4>
              <span className="log-meta">{log.date} • {log.odometer}</span>
              {log.note && <p className="log-note">{log.note}</p>}
            </div>
            <div className="log-cost">
              {log.cost}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
