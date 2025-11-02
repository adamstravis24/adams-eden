/* eslint-disable */
// @ts-nocheck
'use client'

import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, MapPin, Plus, X, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { lookupZip } from '@/lib/zipStationLookup'
import { getNoaaNormalsForZip, NoaaClimateSummary } from '@/lib/noaaClimateService'
import { useAuth } from '@/contexts/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type PlantStage = {
  type: 'sow-indoors' | 'sow-outdoors' | 'transplant' | 'harvest'
  startDay: number
  endDay: number
  label: string
  color: string
}

type PlantScheduleItem = {
  id: string
  name: string
  emoji: string
  thumbnail: string
  category: string
  daysToMaturity: number
  stages: PlantStage[]
  plantMonth: number
  harvestMonth: number
  startIndoorMonth?: number
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [zipCode, setZipCode] = useState('')
  const [location, setLocation] = useState<string | null>(null)
  const [climateData, setClimateData] = useState<NoaaClimateSummary | null>(null)
  const [isLoadingClimate, setIsLoadingClimate] = useState(false)
  const [plantingSchedule, setPlantingSchedule] = useState<PlantScheduleItem[]>([])
  const [showAddPlantModal, setShowAddPlantModal] = useState(false)
  const [plantDatabase, setPlantDatabase] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'month' | 'year'>('year') // New: toggle between month detail and year overview
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const getDaysInMonth = (month: number, year: number = new Date().getFullYear()) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Convert day of year (1-365) to readable date (e.g., "April 15")
  const dayOfYearToDate = (dayOfYear: number): string => {
    const year = new Date().getFullYear()
    const date = new Date(year, 0) // January 1st
    date.setDate(dayOfYear)
    const month = months[date.getMonth()]
    const day = date.getDate()
    return `${month} ${day}`
  }

  // Load plant database on mount
  useEffect(() => {
    fetch('/plant-database.json')
      .then(res => res.json())
      .then(data => setPlantDatabase(data))
      .catch(err => console.error('Error loading plant database:', err))
  }, [])

  // Load ZIP code from user profile
  useEffect(() => {
    const loadUserZipCode = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            if (data.preferences?.zipCode) {
              setZipCode(data.preferences.zipCode)
              if (data.preferences?.location) {
                setLocation(data.preferences.location)
              }
              // Automatically fetch climate data if ZIP code is set
              handleZipLookup(data.preferences.zipCode)
            }
          }
        } catch (error) {
          console.error('Error loading user ZIP code:', error)
        }
      }
    }

    loadUserZipCode()
  }, [user])

  // Load saved data from localStorage
  useEffect(() => {
    const savedSchedule = localStorage.getItem('plantingSchedule')
    if (savedSchedule) setPlantingSchedule(JSON.parse(savedSchedule))
  }, [])

  // Convert day of year to month index (0-11)
  const dayOfYearToMonth = (day: number): number => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let cumulative = 0
    for (let i = 0; i < daysInMonth.length; i++) {
      cumulative += daysInMonth[i]
      if (day <= cumulative) return i
    }
    return 11 // December
  }

  // Calculate planting schedule for a plant based on climate data
  const calculatePlantSchedule = (plant: any): PlantScheduleItem | null => {
    if (!climateData || !climateData.springFrostDay) return null

    const springFrostDay = climateData.springFrostDay
    const fallFrostDay = climateData.winterFrostDay || 280 // Default to early October

    // Calculate planting time based on plant requirements
    let plantDay = springFrostDay
    let startIndoorDay: number | undefined

    // For plants that need indoor start
    if (plant.daysToMaturity && plant.daysToMaturity > 90) {
      startIndoorDay = Math.max(1, springFrostDay - 60) // 60 days before last frost
    }

    // Adjust planting day based on hardiness
    if (plant.hardinessZone && plant.hardinessZone.min >= 8) {
      plantDay = Math.max(1, springFrostDay - 14) // Can plant 2 weeks before frost
    }

    // Calculate harvest time
    const harvestDay = Math.min(365, plantDay + (plant.daysToMaturity || 60))

    // Make sure harvest is before fall frost for frost-sensitive plants
    if (plant.hardinessZone && plant.hardinessZone.min >= 7 && harvestDay > fallFrostDay) {
      // Adjust planting earlier
      plantDay = Math.max(1, fallFrostDay - (plant.daysToMaturity || 60))
    }

    return {
      id: plant.id,
      name: plant.name,
      emoji: plant.emoji || '�',
      category: plant.category,
      thumbnail: plant.thumbnail || '',
      stages: [],
      plantMonth: dayOfYearToMonth(plantDay),
      harvestMonth: dayOfYearToMonth(harvestDay),
      daysToMaturity: plant.daysToMaturity || 60,
      startIndoorMonth: startIndoorDay ? dayOfYearToMonth(startIndoorDay) : undefined
    }
  }

  // Handle ZIP code lookup
  const handleZipLookup = async (zip?: string) => {
    const zipToLookup = zip || zipCode
    if (!zipToLookup || zipToLookup.length < 5) {
      alert('Please enter a valid 5-digit ZIP code')
      return
    }

    setIsLoadingClimate(true)
    try {
      console.log('Looking up ZIP:', zipToLookup)
      const zipRecord = await lookupZip(zipToLookup)
      console.log('ZIP record found:', zipRecord)
      
      if (!zipRecord) {
        alert(`ZIP code ${zipToLookup} not found in our database. Please try a different ZIP code.`)
        setIsLoadingClimate(false)
        return
      }

      setLocation(zipRecord.location)

      console.log('Fetching NOAA data for stations:', zipRecord.primaryStation.id)
      const climate = await getNoaaNormalsForZip(zipRecord)
      console.log('Climate data received:', climate)
      setClimateData(climate)
    } catch (error) {
      console.error('Error fetching climate data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsLoadingClimate(false)
    }
  }

  // Add plant to schedule
  const handleAddPlant = (plant: any) => {
    const scheduleItem = calculatePlantSchedule(plant)
    if (!scheduleItem) {
      alert('Please set your location first to calculate planting dates')
      return
    }

    setPlantingSchedule(prev => {
      const updated = [...prev, scheduleItem]
      localStorage.setItem('plantingSchedule', JSON.stringify(updated))
      return updated
    })
    setShowAddPlantModal(false)
    setSearchQuery('')
  }

  // Remove plant from schedule
  const handleRemovePlant = (plantId: string) => {
    setPlantingSchedule(prev => {
      const updated = prev.filter(p => p.id !== plantId)
      localStorage.setItem('plantingSchedule', JSON.stringify(updated))
      return updated
    })
  }

  // Filter plants for modal
  const filteredPlants = Array.isArray(plantDatabase) ? plantDatabase.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || plant.category === selectedCategory
    const notInSchedule = !plantingSchedule.find(p => p.id === plant.id)
    return matchesSearch && matchesCategory && notInSchedule
  }) : []

  const categories = Array.isArray(plantDatabase) && plantDatabase.length > 0 
    ? ['All', ...new Set(plantDatabase.map(p => p.category))]
    : ['All']

  const getMonthActivities = (monthIndex: number) => {
    const planting = plantingSchedule.filter(p => p.plantMonth === monthIndex)
    const harvesting = plantingSchedule.filter(p => p.harvestMonth === monthIndex)
    const growing = plantingSchedule.filter(p => {
      return monthIndex > p.plantMonth && monthIndex < p.harvestMonth
    })
    
    return { planting, harvesting, growing }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <CalendarIcon className="w-10 h-10 mr-3 text-primary-600" />
            Garden Calendar
          </h1>
          <p className="text-lg text-gray-600">Track your planting and harvest schedule throughout the year</p>
        </div>

        {/* Location and Climate Data */}
        {location && climateData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                Your Location
              </h2>
              <button
                onClick={() => setShowAddPlantModal(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Plant
              </button>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-green-900">📍 {location}</div>
                <Link 
                  href="/profile"
                  className="text-xs text-primary-600 hover:text-primary-700 underline"
                >
                  Change ZIP Code
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                <div>
                  <div className="font-medium">Last Spring Frost:</div>
                  <div>{climateData.springFrostDay ? dayOfYearToDate(climateData.springFrostDay) : 'N/A'}</div>
                </div>
                <div>
                  <div className="font-medium">First Fall Frost:</div>
                  <div>{climateData.winterFrostDay ? dayOfYearToDate(climateData.winterFrostDay) : 'N/A'}</div>
                </div>
              </div>
              {climateData.avgWinterTempF && (
                <div className="mt-2 text-xs text-green-700">
                  Average Winter Low: {climateData.avgWinterTempF.toFixed(1)}°F
                </div>
              )}
              <div className="mt-2 text-xs text-green-600 italic">
                * Frost dates are a 30-year average for planning purposes only
              </div>
            </div>
          </div>
        )}

        {!location && !isLoadingClimate && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Your Location</h3>
              <p className="text-gray-600 mb-4">
                Add your ZIP code in your profile to see personalized planting dates based on your local climate.
              </p>
              <Link 
                href="/profile"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        )}

        {/* Year Timeline View */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Year at a Glance</h2>
          
          <div className="grid grid-cols-12 gap-2">
            {months.map((month, index) => {
              const { planting, harvesting, growing } = getMonthActivities(index)
              const hasActivity = planting.length > 0 || harvesting.length > 0 || growing.length > 0
              
              return (
                <div
                  key={month}
                  onClick={() => setSelectedMonth(index)}
                  className={`cursor-pointer p-3 rounded-lg border-2 transition ${
                    selectedMonth === index
                      ? 'border-primary-600 bg-primary-50'
                      : hasActivity
                      ? 'border-green-300 bg-green-50 hover:border-green-400'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-700 mb-2">{month.slice(0, 3)}</div>
                  <div className="space-y-1">
                    {planting.length > 0 && (
                      <div className="flex items-center text-xs text-green-700">
                        <Sprout className="w-3 h-3 mr-1" />
                        {planting.length}
                      </div>
                    )}
                    {harvesting.length > 0 && (
                      <div className="flex items-center text-xs text-orange-700">
                        <Sun className="w-3 h-3 mr-1" />
                        {harvesting.length}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Month Detail */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{months[selectedMonth]} Details</h2>
          
          {(() => {
            const { planting, harvesting, growing } = getMonthActivities(selectedMonth)
            const hasActivity = planting.length > 0 || harvesting.length > 0 || growing.length > 0
            
            if (!hasActivity) {
              return (
                <div className="text-center py-12">
                  <CloudRain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No plants scheduled for {months[selectedMonth]}</p>
                  {climateData ? (
                    <button
                      onClick={() => setShowAddPlantModal(true)}
                      className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Plants
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Set your location above to add plants</p>
                  )}
                </div>
              )
            }
            
            return (
              <div className="space-y-6">
                {/* Planting */}
                {planting.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      <Sprout className="w-5 h-5 mr-2" />
                      Plant This Month ({planting.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {planting.map(plant => (
                        <div key={plant.id} className="bg-green-50 border-2 border-green-300 rounded-lg p-4 relative group">
                          <button
                            onClick={() => handleRemovePlant(plant.id)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                            title="Remove plant"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center space-x-3">
                            <span className="text-4xl">{plant.emoji}</span>
                            <div>
                              <div className="font-semibold text-gray-900">{plant.name}</div>
                              <div className="text-sm text-gray-600">{plant.category}</div>
                              <div className="text-xs text-green-700 mt-1">
                                Harvest in {months[plant.harvestMonth]}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Harvesting */}
                {harvesting.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                      <Sun className="w-5 h-5 mr-2" />
                      Harvest This Month ({harvesting.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {harvesting.map(plant => (
                        <div key={plant.id} className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 relative group">
                          <button
                            onClick={() => handleRemovePlant(plant.id)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                            title="Remove plant"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center space-x-3">
                            <span className="text-4xl">{plant.emoji}</span>
                            <div>
                              <div className="font-semibold text-gray-900">{plant.name}</div>
                              <div className="text-sm text-gray-600">{plant.category}</div>
                              <div className="text-xs text-orange-700 mt-1">
                                {plant.daysToMaturity} days to maturity
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Growing */}
                {growing.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      <CloudRain className="w-5 h-5 mr-2" />
                      Currently Growing ({growing.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {growing.map(plant => (
                        <div key={plant.id} className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 relative group">
                          <button
                            onClick={() => handleRemovePlant(plant.id)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                            title="Remove plant"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center space-x-3">
                            <span className="text-4xl">{plant.emoji}</span>
                            <div>
                              <div className="font-semibold text-gray-900">{plant.name}</div>
                              <div className="text-sm text-gray-600">{plant.category}</div>
                              <div className="text-xs text-blue-700 mt-1">
                                Planted in {months[plant.plantMonth]}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 How it works</h3>
          <p className="text-sm text-blue-800">
            Set your location above to get accurate planting dates based on your climate. Add plants to your calendar and track their growing season.
            Everything can sync with the mobile app for tracking on the go!
          </p>
        </div>
      </div>

      {/* Add Plant Modal */}
      {showAddPlantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Plant to Calendar</h2>
              <button
                onClick={() => {
                  setShowAddPlantModal(false)
                  setSearchQuery('')
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search plants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {filteredPlants.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No plants found. Try a different search or category.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlants.map(plant => (
                    <button
                      key={plant.id}
                      onClick={() => handleAddPlant(plant)}
                      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-4xl">{plant.emoji || '🌱'}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{plant.name}</div>
                          <div className="text-sm text-gray-600">{plant.category}</div>
                          <div className="text-xs text-primary-600 mt-1">
                            {plant.daysToMaturity || 60} days to harvest
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
