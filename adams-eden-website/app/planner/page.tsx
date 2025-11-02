'use client'

import { useState, useEffect } from 'react'
import { Save, Download, ShoppingCart, Grid3x3, Trash2, Plus, Sparkles, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getErrorMessage } from '@/lib/errors'

interface Plant {
  id: string
  commonName: string
  category: string
  emoji?: string
  scientificName?: string
  daysToMaturity?: number
  care?: {
    sunlight?: string
    watering?: string
  }
  companionPlants?: string[]
  avoidPlants?: string[]
}

interface GardenBed {
  id: string
  name: string
  rows: number
  cols: number
  grid: (string | null)[][]
}

interface PlantRecord {
  id: string
  commonName: string
  category: string
  emoji?: string
  scientificName?: string
  daysToMaturity?: number
  care?: {
    sunlight?: string
    watering?: string
  }
  companionPlants?: string[]
  avoidPlants?: string[]
}

interface StoredBed {
  id: string
  name: string
  rows: number
  cols: number
  grid: Array<string | null>
}

const isPlantRecord = (value: unknown): value is PlantRecord => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.commonName === 'string' &&
    typeof record.category === 'string'
  )
}

const isStoredBed = (value: unknown): value is StoredBed => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.rows !== 'number' ||
    typeof record.cols !== 'number' ||
    !Array.isArray(record.grid)
  ) {
    return false
  }

  return (record.grid as unknown[]).every(
    cell => cell === null || typeof cell === 'string'
  )
}

const getDefaultEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    Vegetables: '🥬',
    Herbs: '🌿',
    Flowers: '🌸',
    Fruits: '🍓'
  }

  return emojiMap[category] || '🌱'
}

const toPlant = (record: PlantRecord): Plant => ({
  id: record.id,
  commonName: record.commonName,
  category: record.category,
  emoji:
    record.emoji && record.emoji !== '�' && record.emoji !== '?' && record.emoji.trim().length > 0
      ? record.emoji
      : getDefaultEmoji(record.category),
  scientificName: record.scientificName,
  daysToMaturity: record.daysToMaturity,
  care: record.care,
  companionPlants: record.companionPlants,
  avoidPlants: record.avoidPlants,
})

export default function GardenPlannerPage() {
  const { user } = useAuth()
  const [beds, setBeds] = useState<GardenBed[]>([
    {
      id: 'bed-1',
      name: 'Garden Bed 1',
      rows: 8,
      cols: 8,
      grid: Array(8).fill(null).map(() => Array(8).fill(null))
    }
  ])
  const [activeBedId, setActiveBedId] = useState('bed-1')
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)
  const [plantLibrary, setPlantLibrary] = useState<Plant[]>([])
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingBedName, setEditingBedName] = useState<string | null>(null)
  const [customDimensions, setCustomDimensions] = useState({ length: 8, width: 8 })
  const [showCustomDimensions, setShowCustomDimensions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const activeBed = beds.find(bed => bed.id === activeBedId) || beds[0]

  // Load plant database
  useEffect(() => {
    fetch('/plant-database.json')
      .then(res => res.json())
      .then((data: unknown) => {
        let records: PlantRecord[] = []

        if (Array.isArray(data)) {
          records = data.filter(isPlantRecord)
        } else if (data && typeof data === 'object' && Array.isArray((data as { plants?: unknown }).plants)) {
          records = (data as { plants: unknown[] }).plants.filter(isPlantRecord)
        } else {
          console.warn('Unexpected plant database format', data)
        }

        const plants = records.map(toPlant)
        setPlantLibrary(plants)
        setFilteredPlants(plants)
      })
      .catch(err => console.error('Error loading plant database:', err))
  }, [])

  // Filter plants based on search and category
  useEffect(() => {
    let filtered = plantLibrary

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.scientificName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPlants(filtered)
  }, [searchTerm, selectedCategory, plantLibrary])

  useEffect(() => {
    if (!user) {
      return
    }

    const fetchGarden = async () => {
      try {
        const gardenDoc = await getDoc(doc(db, 'users', user.uid, 'gardens', 'default'))
        if (gardenDoc.exists()) {
          const data = gardenDoc.data()
          const rawBeds = Array.isArray((data as { beds?: unknown }).beds)
            ? (data as { beds: unknown[] }).beds.filter(isStoredBed)
            : []

          if (rawBeds.length > 0) {
            const loadedBeds: GardenBed[] = rawBeds.map(bed => {
              const grid: (string | null)[][] = []
              for (let row = 0; row < bed.rows; row++) {
                const rowSlice = bed.grid.slice(row * bed.cols, (row + 1) * bed.cols)
                grid.push(
                  rowSlice.map(cell => (typeof cell === 'string' || cell === null ? cell : null))
                )
              }

              return {
                id: bed.id,
                name: bed.name,
                rows: bed.rows,
                cols: bed.cols,
                grid,
              }
            })

            setBeds(loadedBeds)
            if (loadedBeds.length > 0) {
              setActiveBedId(loadedBeds[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Error loading garden:', error)
      }
    }

    void fetchGarden()
  }, [user])

  const saveGarden = async () => {
    if (!user) {
      setSaveMessage('Please sign in to save your garden')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    setSaving(true)
    setSaveMessage('')

    try {
      // Convert 2D grid arrays to flat arrays for Firestore
      const bedsToSave = beds.map(bed => ({
        ...bed,
        grid: bed.grid.flat() // Flatten 2D array to 1D
      }))

      await setDoc(doc(db, 'users', user.uid, 'gardens', 'default'), {
        beds: bedsToSave,
        updatedAt: new Date().toISOString(),
      }, { merge: true })

      setSaveMessage('✓ Garden saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error: unknown) {
      console.error('Error saving garden:', error)
      setSaveMessage(`Error: ${getErrorMessage(error)}`)
    } finally {
      setSaving(false)
    }
  }

  // Create default milestones based on plant data
  const createDefaultMilestones = (plantId: string) => {
    const plantInfo = plantLibrary.find(p => p.id === plantId)
    const daysToMaturity = plantInfo?.daysToMaturity || 70
    
    // Use daysToMaturity to estimate other milestones
    const daysToGermination = Math.round(daysToMaturity * 0.1) || 7 // ~10% of maturity time
    const daysToHarvest = daysToMaturity
    
    return [
      {
        name: 'Germination',
        reached: false,
        estimatedDays: daysToGermination
      },
      {
        name: 'Seedling',
        reached: false,
        estimatedDays: daysToGermination + 14
      },
      {
  name: 'vegetative growth/flowering',
        reached: false,
        estimatedDays: Math.round(daysToMaturity * 0.8) // ~80% of maturity time
      },
      {
        name: 'Ready to Harvest',
        reached: false,
        estimatedDays: daysToHarvest
      }
    ]
  }

  // Auto-add plant to tracker when placed in garden
  const autoAddToTracker = async (plantId: string) => {
    if (!user) return

    try {
      const plantInfo = plantLibrary.find(p => p.id === plantId)
      if (!plantInfo) return

      // Check if this plant type already exists in tracker
      const trackerQuery = query(
        collection(db, 'users', user.uid, 'tracker'),
        where('plantId', '==', plantId)
      )
      const existingPlants = await getDocs(trackerQuery)
      
      if (!existingPlants.empty) {
        console.log(`${plantInfo.commonName} already exists in tracker, skipping auto-add`)
        return 'exists' // Return special value to indicate plant already tracked
      }

      const trackerData = {
        plantId: plantInfo.id,
        plantName: plantInfo.commonName,
        variety: '',
        emoji: plantInfo.emoji || getDefaultEmoji(plantInfo.category),
        plantedDate: '', // Will be set when user marks as planted
        quantity: 1,
        location: activeBed.name,
        milestones: createDefaultMilestones(plantId),
        currentStage: 'Planned',
        status: 'planned', // Mark as planned, not planted yet
        notes: 'Auto-added from garden planner',
        userId: user.uid,
        createdAt: serverTimestamp()
      }

      const trackerRef = await addDoc(collection(db, 'users', user.uid, 'tracker'), trackerData)
      return trackerRef.id
    } catch (error) {
      console.error('Error auto-adding to tracker:', error)
      return null
    }
  }

  const handleCellClick = async (row: number, col: number) => {
    if (selectedPlant) {
      const newBeds = beds.map(bed => {
        if (bed.id === activeBedId) {
          const newGrid = [...bed.grid]
          newGrid[row][col] = selectedPlant
          return { ...bed, grid: newGrid }
        }
        return bed
      })
      setBeds(newBeds)

      // Auto-add to tracker as 'planned' (non-blocking)
      const plantInfo = plantLibrary.find(p => p.id === selectedPlant)
      if (plantInfo && user) {
        autoAddToTracker(selectedPlant).then(trackerId => {
          if (trackerId === 'exists') {
            // Plant already in tracker
            setSaveMessage(`✓ ${plantInfo.commonName} already in your tracker`)
            setTimeout(() => setSaveMessage(''), 3000)
          } else if (trackerId) {
            // New plant added
            setSaveMessage(`📝 ${plantInfo.commonName} added to tracker as planned. Mark as planted to start milestone tracking!`)
            setTimeout(() => setSaveMessage(''), 5000)
          }
        }).catch(err => {
          console.error('Error in auto-add:', err)
        })
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, plantId: string) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('plantId', plantId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleCellDragStart = (e: React.DragEvent, row: number, col: number) => {
    const plantId = activeBed.grid[row][col]
    if (plantId) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('plantId', plantId)
      e.dataTransfer.setData('sourceRow', row.toString())
      e.dataTransfer.setData('sourceCol', col.toString())
    }
  }

  const handleCellDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    e.preventDefault()
    e.stopPropagation()
    const plantId = e.dataTransfer.getData('plantId')
    const sourceRow = e.dataTransfer.getData('sourceRow')
    const sourceCol = e.dataTransfer.getData('sourceCol')

    if (plantId) {
      const newBeds = beds.map(bed => {
        if (bed.id === activeBedId) {
          const newGrid = bed.grid.map(row => [...row])
          
          // If moving from another cell, clear the source
          if (sourceRow !== '' && sourceCol !== '') {
            const srcRow = parseInt(sourceRow)
            const srcCol = parseInt(sourceCol)
            newGrid[srcRow][srcCol] = null
          }
          
          // Place in target cell
          newGrid[targetRow][targetCol] = plantId
          return { ...bed, grid: newGrid }
        }
        return bed
      })
      setBeds(newBeds)
    }
  }

  const handleClearCell = (row: number, col: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newBeds = beds.map(bed => {
      if (bed.id === activeBedId) {
        const newGrid = [...bed.grid]
        newGrid[row][col] = null
        return { ...bed, grid: newGrid }
      }
      return bed
    })
    setBeds(newBeds)
  }

  const clearGarden = () => {
    const newBeds = beds.map(bed => {
      if (bed.id === activeBedId) {
        return {
          ...bed,
          grid: Array(bed.rows).fill(null).map(() => Array(bed.cols).fill(null))
        }
      }
      return bed
    })
    setBeds(newBeds)
  }

  const addNewBed = () => {
    const newBedNumber = beds.length + 1
    const newBed: GardenBed = {
      id: `bed-${Date.now()}`,
      name: `Garden Bed ${newBedNumber}`,
      rows: 8,
      cols: 8,
      grid: Array(8).fill(null).map(() => Array(8).fill(null))
    }
    setBeds([...beds, newBed])
    setActiveBedId(newBed.id)
  }

  const deleteBed = (bedId: string) => {
    if (beds.length === 1) {
      alert('You must have at least one garden bed')
      return
    }
    const newBeds = beds.filter(bed => bed.id !== bedId)
    setBeds(newBeds)
    if (activeBedId === bedId) {
      setActiveBedId(newBeds[0].id)
    }
  }

  const renameBed = (bedId: string, newName: string) => {
    const newBeds = beds.map(bed => 
      bed.id === bedId ? { ...bed, name: newName } : bed
    )
    setBeds(newBeds)
    setEditingBedName(null)
  }

  const applyCustomDimensions = () => {
    const rows = customDimensions.length
    const cols = customDimensions.width
    const newBeds = beds.map(bed => {
      if (bed.id === activeBedId) {
        return {
          ...bed,
          rows,
          cols,
          grid: Array(rows).fill(null).map(() => Array(cols).fill(null))
        }
      }
      return bed
    })
    setBeds(newBeds)
    setShowCustomDimensions(false)
  }

  const getAdjacentPlants = (row: number, col: number): string[] => {
    const adjacent: string[] = []
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal directions
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
    ]
    
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr
      const newCol = col + dc
      if (
        newRow >= 0 && newRow < activeBed.rows &&
        newCol >= 0 && newCol < activeBed.cols &&
        activeBed.grid[newRow][newCol]
      ) {
        adjacent.push(activeBed.grid[newRow][newCol] as string)
      }
    })
    
    return adjacent
  }

  const checkCompanionPlanting = (row: number, col: number): { 
    hasWarning: boolean
    hasBonus: boolean
    warnings: string[]
    bonuses: string[]
  } => {
    const plantId = activeBed.grid[row][col]
    if (!plantId) return { hasWarning: false, hasBonus: false, warnings: [], bonuses: [] }
    
    const plant = plantLibrary.find(p => p.id === plantId)
    if (!plant) return { hasWarning: false, hasBonus: false, warnings: [], bonuses: [] }
    
    const adjacentPlantIds = getAdjacentPlants(row, col)
    const warnings: string[] = []
    const bonuses: string[] = []
    
    adjacentPlantIds.forEach(adjId => {
      const adjPlant = plantLibrary.find(p => p.id === adjId)
      if (adjPlant) {
        // Helper function to match plant names (handles plurals)
        const matchesPlantName = (nameInList: string, plantName: string): boolean => {
          const listNameLower = nameInList.toLowerCase()
          const plantNameLower = plantName.toLowerCase()
          
          // Exact match
          if (listNameLower === plantNameLower) return true
          
          // One contains the other
          if (listNameLower.includes(plantNameLower) || plantNameLower.includes(listNameLower)) return true
          
          // Handle plurals: remove 's' or 'es' from end
          const listNameSingular = listNameLower.replace(/e?s$/, '')
          const plantNameSingular = plantNameLower.replace(/e?s$/, '')
          
          return listNameSingular === plantNameSingular || 
                 listNameLower.includes(plantNameSingular) ||
                 plantNameSingular.includes(listNameSingular)
        }
        
        // Check if this adjacent plant should be avoided
        if (plant.avoidPlants?.some(avoid => matchesPlantName(avoid, adjPlant.commonName))) {
          warnings.push(`⚠️ ${adjPlant.commonName}`)
        }
        
        // Check if this adjacent plant is a companion
        if (plant.companionPlants?.some(companion => matchesPlantName(companion, adjPlant.commonName))) {
          bonuses.push(`✓ ${adjPlant.commonName}`)
        }
      }
    })
    
    return {
      hasWarning: warnings.length > 0,
      hasBonus: bonuses.length > 0,
      warnings,
      bonuses
    }
  }

  const getPlantEmoji = (plantId: string | null) => {
    if (!plantId) return null
    return plantLibrary.find(p => p.id === plantId)?.emoji
  }

  const getPlantName = (plantId: string | null) => {
    if (!plantId) return null
    return plantLibrary.find(p => p.id === plantId)?.commonName
  }

  const categories = ['all', 'Vegetables', 'Herbs', 'Flowers']

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Garden Planner</h1>
          <p className="text-lg text-gray-600">Design your perfect garden layout with drag-and-drop simplicity</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {/* Bed Tabs */}
          <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200 overflow-x-auto">
            {beds.map((bed) => (
              <div
                key={bed.id}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition ${
                  activeBedId === bed.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {editingBedName === bed.id ? (
                  <input
                    type="text"
                    defaultValue={bed.name}
                    onBlur={(e) => renameBed(bed.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameBed(bed.id, e.currentTarget.value)
                      }
                    }}
                    autoFocus
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <>
                    <button
                      onClick={() => setActiveBedId(bed.id)}
                      className="font-medium text-gray-900"
                    >
                      {bed.name}
                    </button>
                    <button
                      onClick={() => setEditingBedName(bed.id)}
                      className="text-xs text-gray-500 hover:text-primary-600"
                    >
                      ✏️
                    </button>
                    {beds.length > 1 && (
                      <button
                        onClick={() => deleteBed(bed.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            <button
              onClick={addNewBed}
              className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bed</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={saveGarden}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Garden'}</span>
              </button>
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {saveMessage}
                </span>
              )}
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <ShoppingCart className="w-4 h-4" />
                <span>Shop This Garden</span>
              </button>
            </div>
            <button 
              onClick={clearGarden}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear This Bed</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Plant Library Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                Plant Library
              </h2>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4 flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-500 mb-2">
                {filteredPlants.length} plants
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredPlants.map((plant) => (
                  <button
                    key={plant.id}
                    onClick={() => setSelectedPlant(plant.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, plant.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition cursor-grab active:cursor-grabbing ${
                      selectedPlant === plant.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{plant.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{plant.commonName}</div>
                        <div className="text-xs text-gray-500 capitalize">{plant.category}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPlant && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-sm text-primary-800">
                    <strong>Selected:</strong> {getPlantName(selectedPlant)}
                  </p>
                  <p className="text-xs text-primary-600 mt-1">
                    Click on the grid or drag this plant to place it
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Garden Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Grid3x3 className="w-5 h-5 mr-2 text-primary-600" />
                  {activeBed.name} ({activeBed.rows} × {activeBed.cols} ft)
                </h2>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Bed Size:</label>
                  <select 
                    className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-900 bg-white"
                    value={showCustomDimensions ? 'custom' : `${activeBed.rows}x${activeBed.cols}`}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomDimensions(true)
                        setCustomDimensions({ length: activeBed.rows, width: activeBed.cols })
                      } else {
                        setShowCustomDimensions(false)
                        const [rows, cols] = e.target.value.split('x').map(Number)
                        const newBeds = beds.map(bed => {
                          if (bed.id === activeBedId) {
                            return {
                              ...bed,
                              rows,
                              cols,
                              grid: Array(rows).fill(null).map(() => Array(cols).fill(null))
                            }
                          }
                          return bed
                        })
                        setBeds(newBeds)
                      }
                    }}
                  >
                    <option value="4x4">4 × 4 ft (Small)</option>
                    <option value="4x8">4 × 8 ft (Standard)</option>
                    <option value="6x6">6 × 6 ft (Medium)</option>
                    <option value="8x8">8 × 8 ft (Large)</option>
                    <option value="10x10">10 × 10 ft (X-Large)</option>
                    <option value="12x8">12 × 8 ft (Wide)</option>
                    <option value="custom">Custom Size...</option>
                  </select>
                </div>
              </div>

              {/* Custom Dimensions Input */}
              {showCustomDimensions && (
                <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-primary-900 mb-3">Custom Bed Dimensions</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Length:</label>
                      <input
                        type="number"
                        min="1"
                        value={customDimensions.length}
                        onChange={(e) => setCustomDimensions({ ...customDimensions, length: parseInt(e.target.value) || 1 })}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      />
                      <span className="text-sm text-gray-600">ft</span>
                    </div>
                    <span className="text-gray-400">×</span>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Width:</label>
                      <input
                        type="number"
                        min="1"
                        value={customDimensions.width}
                        onChange={(e) => setCustomDimensions({ ...customDimensions, width: parseInt(e.target.value) || 1 })}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      />
                      <span className="text-sm text-gray-600">ft</span>
                    </div>
                    <button
                      onClick={applyCustomDimensions}
                      className="px-4 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setShowCustomDimensions(false)}
                      className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Grid */}
              <div 
                className="inline-block border-4 border-soil-dark rounded-lg p-4 bg-soil-light"
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${activeBed.cols}, minmax(0, 1fr))` }}>
                  {activeBed.grid.map((row, rowIndex) => (
                    row.map((cell, colIndex) => {
                      const companionCheck = checkCompanionPlanting(rowIndex, colIndex)
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleCellDrop(e, rowIndex, colIndex)}
                          draggable={cell !== null}
                          onDragStart={(e) => handleCellDragStart(e, rowIndex, colIndex)}
                          className={`relative w-16 h-16 border-2 rounded-lg flex items-center justify-center cursor-pointer transition group ${
                            cell
                              ? companionCheck.hasWarning
                                ? 'bg-red-50 border-red-400 hover:border-red-500 cursor-grab active:cursor-grabbing'
                                : companionCheck.hasBonus
                                ? 'bg-emerald-50 border-emerald-400 hover:border-emerald-500 cursor-grab active:cursor-grabbing'
                                : 'bg-green-50 border-green-300 hover:border-green-400 cursor-grab active:cursor-grabbing'
                              : 'bg-white border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                          }`}
                        >
                          {cell ? (
                            <>
                              <span className="text-4xl pointer-events-none">{getPlantEmoji(cell)}</span>
                              
                              {/* Warning/Bonus Indicator */}
                              {companionCheck.hasWarning && (
                                <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  !
                                </div>
                              )}
                              {!companionCheck.hasWarning && companionCheck.hasBonus && (
                                <div className="absolute -top-1 -left-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  ✓
                                </div>
                              )}
                              
                              {/* Tooltip */}
                              {(companionCheck.hasWarning || companionCheck.hasBonus) && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                    <div className="font-semibold mb-1">{getPlantName(cell)}</div>
                                    {companionCheck.warnings.length > 0 && (
                                      <div className="text-red-300 mb-1">
                                        <div className="font-semibold">Avoid:</div>
                                        {companionCheck.warnings.map((w, i) => (
                                          <div key={i}>{w}</div>
                                        ))}
                                      </div>
                                    )}
                                    {companionCheck.bonuses.length > 0 && (
                                      <div className="text-emerald-300">
                                        <div className="font-semibold">Good with:</div>
                                        {companionCheck.bonuses.map((b, i) => (
                                          <div key={i}>{b}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <button
                                onClick={(e) => handleClearCell(rowIndex, colIndex, e)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition text-xs z-10"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <Plus className="w-6 h-6 text-gray-300 pointer-events-none" />
                          )}
                        </div>
                      )
                    })
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Cells</div>
                  <div className="text-2xl font-bold text-gray-900">{activeBed.rows * activeBed.cols}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600">Plants Placed</div>
                  <div className="text-2xl font-bold text-green-700">
                    {activeBed.grid.flat().filter(cell => cell !== null).length}
                  </div>
                </div>
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="text-sm text-primary-600">Empty Spaces</div>
                  <div className="text-2xl font-bold text-primary-700">
                    {activeBed.grid.flat().filter(cell => cell === null).length}
                  </div>
                </div>
              </div>

              {/* Companion Planting Guide */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">🌱 Companion Planting Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-red-400 border-2 border-red-500 rounded mt-0.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-red-800">Poor Companions</div>
                      <div className="text-red-700">Red border with ! - These plants should not be planted together</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-emerald-400 border-2 border-emerald-500 rounded mt-0.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-emerald-800">Good Companions</div>
                      <div className="text-emerald-700">Green border with ✓ - These plants benefit each other</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-green-200 border-2 border-green-300 rounded mt-0.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-green-800">Neutral</div>
                      <div className="text-green-700">Light green - No known issues or benefits</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  💡 <strong>Tip:</strong> Hover over any planted cell to see detailed companion planting information for that plant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
