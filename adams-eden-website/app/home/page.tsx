"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Leaf, NotebookPen, Pickaxe, Settings, Sprout, Thermometer, ShoppingBag, Wind } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { lookupZip } from '@/lib/zipStationLookup'
import { getNoaaNormalsForZip, NoaaClimateSummary } from '@/lib/noaaClimateService'

export default function HomeDashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [zip, setZip] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  // Types
  type ForecastPeriod = {
    name: string
    startTime: string
    endTime: string
    isDaytime: boolean
    temperature: number
    temperatureUnit: string
    windSpeed: string
    windDirection: string
    shortForecast: string
    detailedForecast?: string
  }
  type TrackedPlant = {
    id: string
    emoji?: string
    plantName?: string
    currentStage?: string
    status?: string
    plantedDate?: string | number | Date
    plannedDate?: string | number | Date
  }
  type GardenBed = { id: string; name?: string; rows?: number; cols?: number }
  type OrderSummary = {
    id: string
    name?: string
    orderNumber?: string
    createdAt?: string | number | Date | { toDate: () => Date }
    total?: string | number
  }

  type UserDoc = { preferences?: { zipCode?: string; location?: string } }

  const hasToDate = (v: unknown): v is { toDate: () => Date } => {
    return typeof (v as { toDate?: unknown })?.toDate === 'function'
  }

  const [forecast, setForecast] = useState<ForecastPeriod[] | null>(null)
  const [forecastError, setForecastError] = useState<string | null>(null)
  const [climate, setClimate] = useState<NoaaClimateSummary | null>(null)
  const [tracked, setTracked] = useState<TrackedPlant[]>([])
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [garden, setGarden] = useState<{ beds: GardenBed[] } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  const displayName = useMemo(() => (
    userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Gardener'
  ), [user, userProfile])

  const freezeWarning = useMemo(() => {
    if (!forecast) return null
    const now = new Date()
    // Filter to only future periods, then look at the next 5 nights
    const futureNights = forecast
      .filter((p) => {
        try {
          // Include current night period (where endTime is in future) and future nights
          const endTime = new Date(p.endTime || p.startTime)
          return !p.isDaytime && endTime > now
        } catch {
          return false
        }
      })
      .slice(0, 5)
    const risky = futureNights.find((n) => typeof n.temperature === 'number' && n.temperature <= 36)
    return risky ? `Freeze risk soon: ${risky.name} ${risky.temperature}°${risky.temperatureUnit}` : null
  }, [forecast])

  // Load essentials for personalization
  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      try {
        // Profile for ZIP
        const profileSnap = await getDoc(doc(db, 'users', user.uid))
        const prof = profileSnap.exists() ? (profileSnap.data() as UserDoc) : null
        const userZip = prof?.preferences?.zipCode || ''
        const userLoc = prof?.preferences?.location || ''
        if (!cancelled) {
          setZip(userZip)
          setLocation(userLoc)
        }

        // Tracked plants (latest 6)
        const trackedQ = query(collection(db, 'users', user.uid, 'tracker'), orderBy('createdAt', 'desc'), limit(6))
        const trackedSnap = await getDocs(trackedQ)
  const trackedRows: TrackedPlant[] = trackedSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as TrackedPlant[]
        if (!cancelled) setTracked(trackedRows)

        // Recent orders (latest 3) — optional
        try {
          const ordersQ = query(collection(db, 'users', user.uid, 'orders'), orderBy('createdAt', 'desc'), limit(3))
          const ordersSnap = await getDocs(ordersQ)
          const orderRows: OrderSummary[] = ordersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as OrderSummary[]
          if (!cancelled) setOrders(orderRows)
        } catch {
          // orders may not exist; ignore
        }

        // Garden snapshot
        const gardenSnap = await getDoc(doc(db, 'users', user.uid, 'gardens', 'default'))
        if (gardenSnap.exists()) {
          const g = gardenSnap.data() as { beds?: GardenBed[] }
          if (!cancelled) setGarden({ beds: Array.isArray(g.beds) ? g.beds : [] })
        }

        // Climate normals and forecast if ZIP exists
        if (userZip) {
          console.log('Home page: Loading forecast for ZIP:', userZip)
          try {
            const rec = await lookupZip(userZip)
            if (rec) {
              const clim = await getNoaaNormalsForZip(rec)
              if (!cancelled) setClimate(clim)
              // fetch forecast via our API
              try {
                console.log('Home page: Fetching forecast API for ZIP:', userZip)
                const res = await fetch(`/api/forecast?zip=${userZip}&t=${Date.now()}`, {
                  cache: 'no-store',
                })
                console.log('Home page: Forecast API response status:', res.status)
                if (res.ok) {
                  const data = await res.json()
                  console.log('Home page: Received forecast data:', data.periods?.length || 0, 'periods')
                  const now = new Date()
                  // Filter out past periods - only keep future ones
                  const futurePeriods = (data.periods || []).filter((p: ForecastPeriod) => {
                    try {
                      // Include current period (where endTime is in future) and future periods
                      const endTime = new Date(p.endTime || p.startTime)
                      return endTime > now
                    } catch (e) {
                      console.error('Error parsing period date:', e, p)
                      return false
                    }
                  })
                  console.log('Home page: Filtered to', futurePeriods.length, 'future periods')
                  if (!cancelled) {
                    setForecast(futurePeriods.slice(0, 7))
                    setForecastError(null)
                  }
                } else {
                  const errorText = await res.text()
                  console.error('Forecast API error:', res.status, errorText)
                  throw new Error(`Forecast ${res.status}: ${errorText}`)
                }
              } catch (error) {
                console.error('Error fetching forecast on home page:', error)
                if (!cancelled) setForecastError('Forecast unavailable')
              }
            }
          } catch { /* ignore */ }
        }
      } finally {
        // no-op
      }
    }

    void load()
    
    // Refresh forecast periodically (every 15 minutes) to keep it current
    const refreshForecast = () => {
      if (cancelled || !user || !zip) return
      
      fetch(`/api/forecast?zip=${zip}&t=${Date.now()}`, {
        cache: 'no-store',
      })
        .then((res) => {
          if (res.ok) {
            return res.json()
          }
          throw new Error(`Forecast ${res.status}`)
        })
        .then((data) => {
          if (cancelled) return
          const now = new Date()
          const futurePeriods = (data.periods || []).filter((p: ForecastPeriod) => {
            try {
              // Include current period (where endTime is in future) and future periods
              const endTime = new Date(p.endTime || p.startTime)
              return endTime > now
            } catch {
              return false
            }
          })
          setForecast(futurePeriods.slice(0, 7))
          setForecastError(null)
        })
        .catch(() => {
          // Silently fail on refresh - don't overwrite existing forecast with error
        })
    }

    const refreshInterval = setInterval(refreshForecast, 15 * 60 * 1000) // 15 minutes
    
    // Refresh forecast when page becomes visible or gains focus
    const handleVisibilityChange = () => {
      if (!document.hidden && user && zip) {
        refreshForecast()
      }
    }

    const handleFocus = () => {
      if (user && zip) {
        refreshForecast()
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
  }, [user, zip])

  if (!user) {
    // Avoid layout shift while we decide
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const Card = ({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: JSX.Element }) => (
    <Link
      href={href}
      className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition transform duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-green-50 p-3 text-green-600">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm mt-1">{desc}</p>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-3">
            <Sprout className="w-8 h-8 text-green-600" />
            Welcome, {displayName}
          </h1>
          <p className="mt-2 text-gray-600">What would you like to work on today?</p>
          {freezeWarning && (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 text-orange-900 px-4 py-2 text-sm">
              {freezeWarning}
            </div>
          )}
        </header>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <Card
            href="/planner"
            title="Garden Planner"
            desc="Design and organize your garden layout"
            icon={<Pickaxe className="w-6 h-6" />}
          />
          <Card
            href="/tracker"
            title="Plant Tracker"
            desc="Add plants, track progress, and log milestones"
            icon={<Leaf className="w-6 h-6" />}
          />
          <Card
            href="/calendar"
            title="Calendar"
            desc="See your sowing, transplant, and harvest timeline"
            icon={<Calendar className="w-6 h-6" />}
          />
          <Card
            href="/journal"
            title="Garden Journal"
            desc="Capture notes, photos, and observations"
            icon={<NotebookPen className="w-6 h-6" />}
          />
          <Card
            href="/settings/profile"
            title="Profile & Location"
            desc="Set your ZIP for local frost dates and recommendations"
            icon={<Settings className="w-6 h-6" />}
          />
          <Card
            href="/app"
            title="Get the Mobile App"
            desc="Track on the go and get timely reminders"
            icon={<Sprout className="w-6 h-6" />}
          />
        </div>

        {/* Personalized widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Local Weather</h2>
              </div>
              {location && <span className="text-sm text-gray-500">{location}</span>}
            </div>
            {zip ? (
              forecast && forecast.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {forecast.slice(0, 6).map((p, idx) => (
                    <div key={idx} className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-medium text-gray-700">{p.name}</div>
                      <div className="text-2xl font-bold text-gray-900">{p.temperature}°{p.temperatureUnit}</div>
                      <div className="text-xs text-gray-600">{p.shortForecast}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Wind className="w-3.5 h-3.5" /> {p.windSpeed} {p.windDirection}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">{forecastError || 'Loading forecast...'}</div>
              )
            ) : (
              <div className="text-sm text-gray-600">
                Add your ZIP in Settings → Profile to see your local forecast.
              </div>
            )}
            {climate && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-green-50 p-3">
                  <div className="text-green-900 font-medium">Last Spring Frost</div>
                  <div className="text-green-700">
                    {climate.springFrostDay ? new Date(new Date().getFullYear(),0,climate.springFrostDay).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 p-3">
                  <div className="text-orange-900 font-medium">First Fall Frost</div>
                  <div className="text-orange-700">
                    {climate.winterFrostDay ? new Date(new Date().getFullYear(),0,climate.winterFrostDay).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tracked plants */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Your Tracked Plants</h2>
              </div>
              <Link href="/tracker" className="text-sm text-green-700 hover:underline">Open tracker</Link>
            </div>
            {tracked.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tracked.map((t) => (
                  <div key={t.id} className="rounded-xl border border-gray-200 p-4 hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{t.emoji || '🌱'}</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{t.plantName || 'Plant'}</div>
                        <div className="text-xs text-gray-600">{(t.currentStage || t.status || '').toString()}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {t.plantedDate ? `Planted ${new Date(t.plantedDate).toLocaleDateString()}` : t.plannedDate ? `Planned ${new Date(t.plannedDate).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No plants tracked yet. Add one from the Tracker.</div>
            )}
          </div>
        </div>

        {/* Garden + Orders */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Pickaxe className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Garden Snapshot</h2>
              </div>
              <Link href="/planner" className="text-sm text-green-700 hover:underline">Open planner</Link>
            </div>
            {garden?.beds?.length ? (
              <div className="text-sm text-gray-700">
                <div className="mb-2">Beds: {garden.beds.length}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {garden.beds.slice(0, 3).map((bed: GardenBed) => (
                    <div key={bed.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="font-medium text-gray-900 truncate">{bed.name || 'Bed'}</div>
                      <div className="text-xs text-gray-600">{bed.rows}×{bed.cols}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Start laying out your beds in the Planner.</div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <Link href="/shop" className="text-sm text-green-700 hover:underline">Shop plants</Link>
            </div>
            {orders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {orders.map((o) => (
                  <li key={o.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{o.name || o.orderNumber || 'Order'}</div>
                        <div className="text-xs text-gray-600">{o.createdAt ? (hasToDate(o.createdAt) ? o.createdAt.toDate().toLocaleDateString() : new Date(o.createdAt as string | number | Date).toLocaleDateString()) : ''}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{o.total || ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">No orders yet.</div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Tips</h2>
          <ul className="mt-3 list-disc list-inside text-gray-600 text-sm space-y-1">
            <li>Set your ZIP in Settings → Profile to personalize your forecast and frost dates.</li>
            <li>Add a few plants in Tracker to build your calendar automatically.</li>
            <li>Use the Planner to visualize your beds before planting season.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
