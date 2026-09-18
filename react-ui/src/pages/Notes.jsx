import React from 'react'

export default function Notes() {
  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h1>Notes</h1>
        <p>Keep track of maintenance notes and observations.</p>
      </header>
      
      <div className="section mt-6">
        <div className="card">
          <p className="text-muted text-center py-4">No notes added yet.</p>
        </div>
      </div>
    </div>
  )
}
