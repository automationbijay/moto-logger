import React, { useState, useEffect } from 'react'
import { FileText, Calendar, Pin } from 'lucide-react'
import VehicleSwitcher from '../components/VehicleSwitcher.jsx'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function NotesReminders() {
  const { activeVehicle } = useVehicle()
  const [futureNotes, setFutureNotes] = useState([])
  const [pastNotes, setPastNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!activeVehicle?.id) {
        if (isMounted) {
          setFutureNotes([])
          setPastNotes([])
          setLoading(false)
        }
        return
      }

      if (isMounted) setLoading(true)

      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('vehicle_id', activeVehicle.id)
        .order('date', { ascending: false })

      if (isMounted) {
        if (data) {
          const todayStr = new Date().toISOString().split('T')[0]
          
          const future = data.filter(n => n.date > todayStr)
          const past = data.filter(n => n.date <= todayStr)
          
          // Future notes (reminders) should ideally be sorted ascending by date (closest first)
          future.sort((a, b) => a.date.localeCompare(b.date))
          
          setFutureNotes(future)
          setPastNotes(past)
        } else {
          setFutureNotes([])
          setPastNotes([])
        }
        setLoading(false)
      }
    }

    fetchData()
  }, [activeVehicle?.id])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Notes & Reminders</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Future dates are pinned as reminders</p>
        </div>
        <VehicleSwitcher />
      </header>

      <div className="mt-2">
        {loading ? (
          <p className="text-zinc-500 text-center py-4">Loading...</p>
        ) : futureNotes.length === 0 && pastNotes.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
              <FileText size={32} className="text-zinc-400" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No notes added yet.</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Add a note with a future date to set a reminder.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Reminders Section */}
            {futureNotes.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 px-1">
                  <Pin size={14} className="text-orange-500" />
                  Upcoming Reminders
                </h2>
                {futureNotes.map(note => (
                  <div key={note.id} className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-orange-900 dark:text-orange-100">{note.description}</h3>
                      <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 text-xs px-2.5 py-1 rounded-full font-medium border border-orange-100 dark:border-orange-900/30 shadow-sm">
                        <Calendar size={12} />
                        {note.date}
                      </span>
                    </div>
                    {note.notes_content && <p className="text-sm text-orange-800/80 dark:text-orange-200/80 mt-2">{note.notes_content}</p>}
                  </div>
                ))}
              </div>
            )}
            
            {/* Notes Section */}
            {pastNotes.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                {futureNotes.length > 0 && (
                  <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 px-1 mt-2">
                    <FileText size={14} />
                    Past Notes
                  </h2>
                )}
                {pastNotes.map(note => (
                  <div key={note.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{note.description}</h3>
                      <span className="text-xs text-zinc-500 font-medium">{note.date}</span>
                    </div>
                    {note.notes_content && <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">{note.notes_content}</p>}
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  )
}
