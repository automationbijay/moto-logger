import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function Reminders() {
  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h1>Reminders</h1>
        <p>Upcoming service and maintenance reminders.</p>
      </header>
      
      <div className="section mt-6">
        <div className="card">
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
      </div>
    </div>
  )
}
