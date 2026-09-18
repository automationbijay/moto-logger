import React, { useState } from 'react'
import { Bike, X, Check, ChevronDown } from 'lucide-react'
import { useVehicle } from '../contexts/VehicleContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function VehicleSwitcher() {
  const { vehicles, activeVehicle, activeVehicleId, changeActiveVehicle } = useVehicle()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  if (vehicles.length === 0) return null

  const handleSelect = (id) => {
    changeActiveVehicle(id)
    setIsOpen(false)
  }

  return (
    <>
      <button 
        className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full py-1.5 pl-4 pr-1.5 shadow-sm active:scale-95 transition-transform" 
        onClick={() => setIsOpen(true)}
      >
        <div className="text-right flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Vehicle</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-none">{activeVehicle?.make || 'Select'}</span>
        </div>
        <div className="bg-orange-100 dark:bg-orange-500/10 p-2 rounded-full text-orange-600 flex items-center justify-center">
          <Bike size={18} />
        </div>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 transform transition-transform" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Select Vehicle</h2>
              <button 
                className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pb-4">
              {vehicles.map(v => (
                <div 
                  key={v.id} 
                  className={`cursor-pointer rounded-2xl p-4 flex items-center justify-between border-2 transition-all active:scale-[0.98] ${
                    activeVehicleId === v.id 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' 
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-200'
                  }`}
                  onClick={() => handleSelect(v.id)}
                >
                  <div>
                    <h4 className={`font-semibold m-0 ${activeVehicleId === v.id ? 'text-orange-900 dark:text-orange-100' : 'text-zinc-900 dark:text-zinc-50'}`}>
                      {v.year} {v.make} {v.model}
                    </h4>
                    <p className={`text-sm mt-0.5 ${activeVehicleId === v.id ? 'text-orange-700/80 dark:text-orange-200/60' : 'text-zinc-500'}`}>
                      {v.license_plate || 'No Plate'}
                    </p>
                  </div>
                  {activeVehicleId === v.id && (
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
              
              <button 
                className="w-full mt-2 py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 font-semibold hover:border-orange-500 hover:text-orange-600 transition-colors active:scale-[0.98] flex items-center justify-center gap-2" 
                onClick={() => {
                  setIsOpen(false)
                  navigate('/vehicle')
                }}
              >
                <Bike size={18} />
                Add New Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
