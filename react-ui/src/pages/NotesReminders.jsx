import React, { useState } from 'react'
import { AlertCircle, FileText, Bell } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'

export default function NotesReminders() {
  const [activeTab, setActiveTab] = useState('notes') // 'notes', 'reminders'

  return (
    <div className="page-container fade-in">
      <header className="page-header flex-between">
        <div>
          <h1>Notes</h1>
          <p>Notes and Reminders</p>
        </div>
        <VehicleSwitcher />
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={16} className="mr-2 inline" />
          Notes
        </button>
        <button 
          className={`tab ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Bell size={16} className="mr-2 inline" />
          Reminders
        </button>
      </div>

      <div className="section mt-6">
        {activeTab === 'notes' ? (
          <div className="card fade-in">
            <p className="text-muted text-center py-4">No notes added yet.</p>
          </div>
        ) : (
          <div className="card fade-in">
            <ul className="attention-list">
              <li>
                <AlertCircle size={20} className="text-warning mr-2 inline" />
                Oil change due in 300 km
              </li>
              <li>
                <AlertCircle size={20} className="text-warning mr-2 inline" />
                Chain lubrication needed
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
