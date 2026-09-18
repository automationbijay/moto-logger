import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [currency, setCurrency] = useState('NPR')
  const [monthStartDay, setMonthStartDay] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) console.error("Error getting session:", error)
      setUser(session?.user ?? null)
      setLoading(false)
    }
    
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (isMounted) {
          if (data) {
            setProfile(data)
            if (data.currency) {
              setCurrency(data.currency)
              localStorage.setItem('preferredCurrency', data.currency)
            }
            if (data.month_start_day) {
              setMonthStartDay(data.month_start_day)
              localStorage.setItem('monthStartDay', data.month_start_day)
            }
          } else {
            const savedCurrency = localStorage.getItem('preferredCurrency')
            if (savedCurrency) {
              setCurrency(savedCurrency)
            }
            const savedMonthStartDay = localStorage.getItem('monthStartDay')
            if (savedMonthStartDay) {
              setMonthStartDay(parseInt(savedMonthStartDay, 10))
            }
          }
        }
      } else {
        if (isMounted) {
          setProfile(null)
          setCurrency('NPR')
          setMonthStartDay(1)
        }
      }
    }
    fetchProfile()
    return () => { isMounted = false }
  }, [user])

  const currencySymbol = useMemo(() => {
    const symbols = { NPR: 'रू', INR: '₹', USD: '$', EUR: '€' }
    return symbols[currency] || currency
  }, [currency])

  const value = useMemo(() => ({
    user,
    profile,
    currency,
    currencySymbol,
    setCurrency,
    monthStartDay,
    setMonthStartDay,
    loading
  }), [user, profile, currency, currencySymbol, monthStartDay, loading])

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
