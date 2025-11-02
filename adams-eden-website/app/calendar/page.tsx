'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, MapPin, Plus, X, Search, ChevronLeft, ChevronRight, Trash2, LayoutGrid, BarChart3 } from 'lucide-react'
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
}

type HardinessRange = {
  min?: number
  max?: number
}

type PlantCare = {
  hardiness?: HardinessRange
}

type PlantDatabaseEntry = {
  id: string
  commonName?: string
  name?: string
  category: string
  emoji?: string
  thumbnail?: string
  daysToMaturity?: number
  hardinessZone?: HardinessRange
  care?: PlantCare
}

type PlantDatabase = {
  plants: PlantDatabaseEntry[]
}

const isPlantDatabaseEntry = (plant: unknown): plant is PlantDatabaseEntry => {
  if (!plant || typeof plant !== 'object') {
    return false
  }

  const record = plant as Record<string, unknown>
  return typeof record.id === 'string' && typeof record.category === 'string'
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [zipCode, setZipCode] = useState('')
  const [location, setLocation] = useState<string | null>(null)
  const [climateData, setClimateData] = useState<NoaaClimateSummary | null>(null)
  const [isLoadingClimate, setIsLoadingClimate] = useState(false)
  const [plantingSchedule, setPlantingSchedule] = useState<PlantScheduleItem[]>([])
  const [showAddPlantModal, setShowAddPlantModal] = useState(false)
  const [plantDatabase, setPlantDatabase] = useState<PlantDatabase | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'month' | 'year'>('year')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

  const handleZipLookup = useCallback(async (zip?: string) => {
    const zipToLookup = (zip ?? zipCode).trim()
    if (!zipToLookup || zipToLookup.length < 5) {
      alert('Please enter a valid 5-digit ZIP code')
      return
    }

    setIsLoadingClimate(true)
    try {
      const zipRecord = await lookupZip(zipToLookup)
      if (!zipRecord) {
        alert(`ZIP code ${zipToLookup} not found in our database.`)
        return
      }

      setLocation(zipRecord.location)
      const climate = await getNoaaNormalsForZip(zipRecord)
      setClimateData(climate)
    } catch (error) {
      console.error('Error fetching climate data:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoadingClimate(false)
    }
  }, [zipCode])
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const getDaysInMonth = (month: number, year: number = new Date().getFullYear()) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Convert day of year (1-365) to readable date
  const dayOfYearToDate = (dayOfYear: number): string => {
    const year = new Date().getFullYear()
    const date = new Date(year, 0)
    date.setDate(dayOfYear)
    const month = months[date.getMonth()]
    const day = date.getDate()
    return `${month} ${day}`
  }

  // Get the starting day of year for a given month
  const getMonthStartDay = (month: number): number => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let day = 1
    for (let i = 0; i < month; i++) {
      day += daysInMonth[i]
    }
    return day
  }

  // Load plant database
  useEffect(() => {
    fetch('/plant-database.json')
      .then(res => res.json())
      .then((data: unknown) => {
        if (typeof data === 'object' && data !== null && Array.isArray((data as { plants?: unknown }).plants)) {
          const plants = (data as { plants: unknown[] }).plants.filter(isPlantDatabaseEntry) as PlantDatabaseEntry[]
          setPlantDatabase({ plants })
          return
        }

        if (Array.isArray(data)) {
          const plants = (data as unknown[]).filter(isPlantDatabaseEntry) as PlantDatabaseEntry[]
          setPlantDatabase({ plants })
          return
        }

        console.warn('Unexpected plant database format', data)
        setPlantDatabase({ plants: [] })
      })
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
              handleZipLookup(data.preferences.zipCode)
            }
          }
        } catch (error) {
          console.error('Error loading user ZIP code:', error)
        }
      }
    }
    loadUserZipCode()
  }, [user, handleZipLookup])

  // Load saved schedule from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('plantingSchedule')
    if (saved) setPlantingSchedule(JSON.parse(saved))
  }, [])

  // Calculate planting schedule with stages
  const calculatePlantSchedule = (plant: PlantDatabaseEntry): PlantScheduleItem | null => {
    if (!climateData || !climateData.springFrostDay) return null

    const springFrostDay = climateData.springFrostDay
    const daysToMaturity = plant.daysToMaturity ?? 60
    const stages: PlantStage[] = []
    const hardiness = plant.hardinessZone ?? plant.care?.hardiness
    
    // Plants that should be started indoors (frost-sensitive warm-season crops)
    const indoorStartPlants = [
      'tomato', 'pepper', 'eggplant', 'cucumber', 'melon', 'watermelon',
      'squash', 'pumpkin', 'basil', 'zinnia', 'marigold', 'petunia',
      'impatiens', 'coleus', 'begonia'
    ]
    
    // Check if this plant should be started indoors
    const plantName = (plant.commonName || plant.name || '').toLowerCase()
    const needsIndoorStart = indoorStartPlants.some(name => plantName.includes(name)) || daysToMaturity > 90
    
    if (needsIndoorStart) {
      // Sow Indoors: 6-8 weeks before last frost
      const sowIndoorStart = Math.max(1, springFrostDay - 56)
      const sowIndoorEnd = Math.max(1, springFrostDay - 42)
      stages.push({
        type: 'sow-indoors',
        startDay: sowIndoorStart,
        endDay: sowIndoorEnd,
        label: 'Sow Indoors',
        color: 'bg-blue-400'
      })
      
      // Transplant: 1-2 weeks after last frost
      const transplantStart = springFrostDay + 7
      const transplantEnd = springFrostDay + 14
      stages.push({
        type: 'transplant',
        startDay: transplantStart,
        endDay: transplantEnd,
        label: 'Transplant',
        color: 'bg-purple-400'
      })
      
      // Harvest
      const harvestStart = transplantEnd + daysToMaturity - 14
      const harvestEnd = Math.min(365, transplantEnd + daysToMaturity + 14)
      stages.push({
        type: 'harvest',
        startDay: harvestStart,
        endDay: harvestEnd,
        label: 'Harvest',
        color: 'bg-yellow-500'
      })
    } else {
      // Direct sow outdoors
      const sowOutdoorStart = hardiness?.min && hardiness.min >= 8 ? Math.max(1, springFrostDay - 14) : springFrostDay
      const sowOutdoorEnd = springFrostDay + 21
      stages.push({
        type: 'sow-outdoors',
        startDay: sowOutdoorStart,
        endDay: sowOutdoorEnd,
        label: 'Sow Outdoors',
        color: 'bg-green-500'
      })
      
      // Harvest
      const harvestStart = sowOutdoorEnd + daysToMaturity - 7
      const harvestEnd = Math.min(365, sowOutdoorEnd + daysToMaturity + 14)
      stages.push({
        type: 'harvest',
        startDay: harvestStart,
        endDay: harvestEnd,
        label: 'Harvest',
        color: 'bg-yellow-500'
      })
    }

    return {
      id: plant.id,
      name: plant.commonName || plant.name || 'Unknown Plant',
      emoji: plant.emoji && plant.emoji.trim() !== '' ? plant.emoji : '🌱',
      thumbnail: plant.thumbnail || '',
      category: plant.category,
      daysToMaturity,
      stages
    }
  }

  // Add plant to schedule
  const handleAddPlant = (plant: PlantDatabaseEntry) => {
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
  const plantRecords = plantDatabase?.plants ?? []
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredPlants: PlantDatabaseEntry[] = plantRecords.filter(plant => {
    const name = (plant.commonName || plant.name || '').toLowerCase()
    const matchesSearch = normalizedSearch.length === 0 || name.includes(normalizedSearch)
    const matchesCategory = selectedCategory === 'All' || plant.category === selectedCategory
    const notInSchedule = !plantingSchedule.some(p => p.id === plant.id)
    return matchesSearch && matchesCategory && notInSchedule
  })
  
  // Debug logging
  if (showAddPlantModal && plantDatabase) {
    console.log('Total plants in database:', plantDatabase?.plants?.length)
    console.log('Search query:', searchQuery)
    console.log('Selected category:', selectedCategory)
    console.log('Plants in schedule:', plantingSchedule.length)
    console.log('Filtered plants:', filteredPlants.length)
  }

  const categories: string[] = plantRecords.length > 0
    ? ['All', ...Array.from(new Set(plantRecords.map(plant => plant.category)))]
    : ['All']

  // Render timeline bar for a plant stage
  const renderStageBar = (stage: PlantStage, monthStartDay: number, daysInMonth: number): JSX.Element | null => {
    const monthEndDay = monthStartDay + daysInMonth - 1
    
    // Check if stage overlaps with this month
    if (stage.endDay < monthStartDay || stage.startDay > monthEndDay) {
      return null
    }
    
    // Calculate position and width within the month
    const stageStart = Math.max(stage.startDay, monthStartDay)
    const stageEnd = Math.min(stage.endDay, monthEndDay)
    
    const startOffset = ((stageStart - monthStartDay) / daysInMonth) * 100
    const width = ((stageEnd - stageStart + 1) / daysInMonth) * 100
    
    return (
      <div
        key={stage.type}
        className={`absolute h-6 ${stage.color} rounded opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-xs text-white font-medium`}
        style={{
          left: `${startOffset}%`,
          width: `${width}%`,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        title={`${stage.label}: ${dayOfYearToDate(stage.startDay)} - ${dayOfYearToDate(stage.endDay)}`}
      >
        {width > 15 && <span className="truncate px-1">{stage.label}</span>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <CalendarIcon className="w-10 h-10 mr-3 text-green-600" />
            Garden Calendar
          </h1>
          <p className="text-lg text-gray-600">Visualize your planting timeline throughout the year</p>
        </div>

        {/* Location and Controls */}
        {location && climateData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-gray-900 font-semibold">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  {location}
                </div>
                <Link 
                  href="/profile"
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  Change ZIP Code
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('year')}
                    className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition ${
                      viewMode === 'year' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    Year View
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition ${
                      viewMode === 'month' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-1.5" />
                    Month View
                  </button>
                </div>

                <button
                  onClick={() => setShowAddPlantModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Plant
                </button>
              </div>
            </div>

            {/* Frost Date Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-900 font-medium mb-1">Last Spring Frost</div>
                <div className="text-green-700">{climateData.springFrostDay ? dayOfYearToDate(climateData.springFrostDay) : 'N/A'}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-orange-900 font-medium mb-1">First Fall Frost</div>
                <div className="text-orange-700">{climateData.winterFrostDay ? dayOfYearToDate(climateData.winterFrostDay) : 'N/A'}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg col-span-2">
                <div className="text-blue-900 font-medium mb-1">Color Legend</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-400 text-white text-xs rounded">Sow Indoors</span>
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Sow Outdoors</span>
                  <span className="px-2 py-1 bg-purple-400 text-white text-xs rounded">Transplant</span>
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">Harvest</span>
                </div>
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
                Add your ZIP code in your profile to see personalized planting dates.
              </p>
              <Link 
                href="/profile"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        )}

        {/* Timeline Calendar */}
        {location && climateData && plantingSchedule.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {viewMode === 'year' ? (
              // Year Overview - All 12 months
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  {/* Timeline Header */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <div className="w-48 flex-shrink-0 p-4 font-semibold text-gray-700 border-r border-gray-200">
                      Plants
                    </div>
                    <div className="flex-1 flex">
                      {monthsShort.map(month => (
                        <div
                          key={month}
                          className="flex-1 p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                        >
                          {month}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plant Rows */}
                  {plantingSchedule.map((plant, plantIndex) => (
                    <div
                      key={plant.id}
                      className={`flex border-b border-gray-100 hover:bg-gray-50 transition ${
                        plantIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* Plant Info */}
                      <div className="w-48 flex-shrink-0 p-4 border-r border-gray-200 flex items-center justify-between group">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">{plant.emoji}</span>
                          <span className="font-medium text-gray-900 truncate text-sm">{plant.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePlant(plant.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition flex-shrink-0 ml-1"
                          title="Remove plant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Timeline Grid */}
                      <div className="flex-1 flex relative">
                        {months.map((month, monthIndex) => {
                          const monthStartDay = getMonthStartDay(monthIndex)
                          const daysInMonth = getDaysInMonth(monthIndex)
                          
                          return (
                            <div
                              key={month}
                              className="flex-1 border-r border-gray-200 last:border-r-0 relative min-h-[60px]"
                            >
                              {plant.stages.map(stage => renderStageBar(stage, monthStartDay, daysInMonth))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Month Detail View - Single month with all days
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <button
                      onClick={() => setSelectedMonth(prev => (prev === 0 ? 11 : prev - 1))}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-500 rounded-lg transition shadow-sm group"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">
                        {months[selectedMonth === 0 ? 11 : selectedMonth - 1]}
                      </span>
                    </button>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900">{months[selectedMonth]}</h3>
                      <p className="text-sm text-gray-600 mt-1">{getDaysInMonth(selectedMonth)} days</p>
                    </div>
                    <button
                      onClick={() => setSelectedMonth(prev => (prev === 11 ? 0 : prev + 1))}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-500 rounded-lg transition shadow-sm group"
                      title="Next month"
                    >
                      <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">
                        {months[selectedMonth === 11 ? 0 : selectedMonth + 1]}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <div className="w-48 flex-shrink-0 p-4 font-semibold text-gray-700 border-r border-gray-200">
                      Plants
                    </div>
                    <div className="flex-1 flex">
                      {Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => i + 1).map(day => (
                        <div
                          key={day}
                          className="flex-1 min-w-[30px] p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plant Rows with Daily Detail */}
                  {plantingSchedule.map((plant, plantIndex) => {
                    const monthStartDay = getMonthStartDay(selectedMonth)
                    const daysInMonth = getDaysInMonth(selectedMonth)
                    
                    return (
                      <div
                        key={plant.id}
                        className={`flex border-b border-gray-100 hover:bg-gray-50 transition ${
                          plantIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <div className="w-48 flex-shrink-0 p-4 border-r border-gray-200 flex items-center justify-between group">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-2xl flex-shrink-0">{plant.emoji}</span>
                            <span className="font-medium text-gray-900 truncate text-sm">{plant.name}</span>
                          </div>
                          <button
                            onClick={() => handleRemovePlant(plant.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition flex-shrink-0 ml-1"
                            title="Remove plant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 flex relative min-h-[60px]">
                          {plant.stages.map(stage => renderStageBar(stage, monthStartDay, daysInMonth))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {location && climateData && plantingSchedule.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Plants Added Yet</h3>
            <p className="text-gray-600 mb-6">Start adding plants to see your personalized planting timeline</p>
            <button
              onClick={() => setShowAddPlantModal(true)}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Plant
            </button>
          </div>
        )}
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-4xl">{plant.emoji || '🌱'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{plant.commonName}</div>
                          <div className="text-sm text-gray-600">{plant.category}</div>
                          <div className="text-xs text-green-600 mt-1 group-hover:text-green-700">
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
