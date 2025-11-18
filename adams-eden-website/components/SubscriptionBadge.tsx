"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

type ForecastPeriod = {
  name: string
  startTime: string
  isDaytime: boolean
  temperature: number
  temperatureUnit: string
  shortForecast: string
}

export default function SubscriptionBadge() {
  const { user, loading: authLoading } = useAuth()
  const [weather, setWeather] = useState<{ temp: number; unit: string; forecast: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false)
      return
    }

    let cancelled = false

    const loadWeather = async () => {
      try {
        // Get user's zip code from profile
        const profileSnap = await getDoc(doc(db, 'users', user.uid))
        const prof = profileSnap.exists() ? profileSnap.data() : null
        const userZip = prof?.preferences?.zipCode || ''

        if (!userZip) {
          if (!cancelled) {
            setWeather(null)
            setLoading(false)
          }
          return
        }

        // Fetch forecast
        const res = await fetch(`/api/forecast?zip=${userZip}&t=${Date.now()}`, {
          cache: 'no-store',
        })

        if (!res.ok) {
          throw new Error(`Forecast ${res.status}`)
        }

        const data = await res.json()
        const periods = (data.periods || []) as ForecastPeriod[]

        if (periods.length > 0) {
          // Get the first (current/next) period
          const current = periods[0]
          if (!cancelled) {
            setWeather({
              temp: current.temperature,
              unit: current.temperatureUnit,
              forecast: current.shortForecast,
            })
          }
        }
      } catch (error) {
        console.error('Error loading weather:', error)
        if (!cancelled) {
          setWeather(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadWeather()

    // Refresh weather when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        void loadWeather()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, authLoading])

  // Hide while loading or if no user
  if (loading || authLoading || !user) return null

  // Hide if no weather data
  if (!weather) return null

  const color = 'bg-blue-100 text-blue-700 border-blue-300'
  return (
    <span className={`ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {weather.temp}°{weather.unit}
    </span>
  )
}
