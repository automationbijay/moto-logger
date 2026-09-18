import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const VehicleContext = createContext({})

export const useVehicle = () => useContext(VehicleContext)

export const VehicleProvider = ({ children }) => {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [activeVehicleId, setActiveVehicleId] = useState(() => localStorage.getItem('activeVehicleId'))
  const [loading, setLoading] = useState(true)

  const fetchVehicles = async () => {
    if (!user) {
      setVehicles([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vehicles:', error)
    } else {
      setVehicles(data || [])
      
      // If we have vehicles but no active one (or active one is invalid), select the first one
      if (data && data.length > 0) {
        if (!activeVehicleId || !data.find(v => v.id === activeVehicleId)) {
          setActiveVehicleId(data[0].id)
          localStorage.setItem('activeVehicleId', data[0].id)
        }
      } else {
        setActiveVehicleId(null)
        localStorage.removeItem('activeVehicleId')
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
  }, [user])

  const changeActiveVehicle = (vehicleId) => {
    setActiveVehicleId(vehicleId)
    localStorage.setItem('activeVehicleId', vehicleId)
  }

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || null

  const value = useMemo(() => ({
    vehicles,
    activeVehicle,
    activeVehicleId,
    changeActiveVehicle,
    refreshVehicles: fetchVehicles,
    loading
  }), [vehicles, activeVehicle, activeVehicleId, loading])

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  )
}
