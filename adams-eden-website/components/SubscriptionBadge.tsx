"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

type ForecastPeriod = {
  name: string
  startTime: string
  endTime: string
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
          const errorText = await res.text()
          console.error('Forecast API error:', res.status, errorText)
          throw new Error(`Forecast ${res.status}: ${errorText}`)
        }

        const data = await res.json()
        const periods = (data.periods || []) as ForecastPeriod[]

        console.log('SubscriptionBadge: Received periods:', periods.length)

        if (periods.length > 0) {
          const now = new Date()
          
          // Filter to only future periods (where endTime is in the future)
          const futurePeriods = periods.filter((p) => {
            try {
              const end = new Date(p.endTime)
              return end > now
            } catch (e) {
              console.error('Error parsing period end date:', e, p)
              return false
            }
          })
          
          if (futurePeriods.length === 0) {
            console.warn('SubscriptionBadge: No future periods found, using first period')
            // Fallback to first period if all are in the past (shouldn't happen, but safety check)
            const firstPeriod = periods[0]
            if (firstPeriod && !cancelled) {
              setWeather({
                temp: firstPeriod.temperature,
                unit: firstPeriod.temperatureUnit,
                forecast: firstPeriod.shortForecast,
              })
            }
            return
          }
          
          // Find the current period (where now is between startTime and endTime)
          let current = futurePeriods.find((p) => {
            try {
              const start = new Date(p.startTime)
              const end = new Date(p.endTime)
              return start <= now && end > now
            } catch (e) {
              console.error('Error parsing period dates:', e, p)
              return false
            }
          })
          
          // If no current period found, use the first future period
          if (!current) {
            current = futurePeriods[0]
          }
          
          if (current && !cancelled) {
            console.log('SubscriptionBadge: Setting weather:', current.temperature, current.temperatureUnit, current.shortForecast)
            setWeather({
              temp: current.temperature,
              unit: current.temperatureUnit,
              forecast: current.shortForecast,
            })
          } else {
            console.warn('SubscriptionBadge: No valid period found after filtering')
          }
        } else {
          console.warn('SubscriptionBadge: No periods received from API')
        }
      } catch (error) {
        console.error('Error loading weather in SubscriptionBadge:', error)
        if (!cancelled) {
          setWeather(null)
          setLoading(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadWeather()

    // Refresh weather frequently (every 15 minutes) to keep it current with hour-by-hour updates
    const refreshInterval = setInterval(() => {
      if (!cancelled && user) {
        void loadWeather()
      }
    }, 15 * 60 * 1000) // 15 minutes - frequent updates for navigation badge

    // Refresh weather when page becomes visible or gains focus
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        void loadWeather()
      }
    }

    const handleFocus = () => {
      if (user) {
        void loadWeather()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
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
