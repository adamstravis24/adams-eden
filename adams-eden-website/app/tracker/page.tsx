'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import PremiumFeatureWrapper from '@/components/PremiumFeatureWrapper'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Plus,
  Calendar,
  Sprout,
  Flower2,
  Apple,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react'

interface Milestone {
  name: string
  reached: boolean
  reachedDate?: string
  estimatedDays?: number
}

interface TrackedPlant {
  id: string
  plantId: string
  plantName: string
  variety?: string
  emoji?: string
  plantedDate: string
  plannedDate?: string | null
  quantity: number
  location?: string
  milestones: Milestone[]
  currentStage: string
  status: 'planned' | 'planted'
  notes?: string
  lastWatered?: string | null
  userId: string
  createdAt?: Timestamp | null
}

interface Plant {
  id: string
  commonName: string
  emoji?: string
  growthInfo?: {
    daysToGermination?: number
    daysToMaturity?: number
    daysToHarvest?: number
  }
}

type PlantDatabaseRecord = {
  id: string
  commonName: string
  emoji?: string
  growthInfo?: {
    daysToGermination?: number
    daysToMaturity?: number
    daysToHarvest?: number
  }
}

type PlantDatabaseResponse = {
  plants: PlantDatabaseRecord[]
}

type AddPlantIntent = 'planted' | 'planned'

interface AddPlantFormData {
  plantId: string
  plantName: string
  variety: string
  emoji: string
  quantity: number
  location: string
  plantedDate: string
  plannedDate: string
  notes: string
  intent: AddPlantIntent
}

const createInitialFormData = (intent: AddPlantIntent = 'planted'): AddPlantFormData => ({
  plantId: '',
  plantName: '',
  variety: '',
  emoji: '🌱',
  quantity: 1,
  location: '',
  plantedDate: intent === 'planted' ? getToday() : '',
  plannedDate: getToday(),
  notes: '',
  intent
})
const getToday = () => {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  const localDate = new Date(now.getTime() - offsetMs)
  return localDate.toISOString().split('T')[0]
}

export default function TrackerPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [trackedPlants, setTrackedPlants] = useState<TrackedPlant[]>([])
  const [plantDatabase, setPlantDatabase] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHarvestModal, setShowHarvestModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState<TrackedPlant | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([])
  const [formData, setFormData] = useState<AddPlantFormData>(createInitialFormData())

  const resetAddForm = (intent: AddPlantIntent = 'planted') => {
    setFormData(createInitialFormData(intent))
    setSearchTerm('')
  }

  const switchIntent = (intent: AddPlantIntent) => {
    setFormData(prev => {
      if (prev.intent === intent) return prev
      const today = getToday()
      return {
        ...prev,
        intent,
        plantedDate: intent === 'planted' ? (prev.plantedDate || today) : '',
        plannedDate:
          intent === 'planned'
            ? (prev.plannedDate && prev.plannedDate >= today ? prev.plannedDate : today)
            : prev.plannedDate || today
      }
    })
  }

  const openAddModal = (intent: AddPlantIntent) => {
    resetAddForm(intent)
    setShowAddModal(true)
  }

  const isPlannedIntent = formData.intent === 'planned'
  const hasDateForIntent = isPlannedIntent ? Boolean(formData.plannedDate) : Boolean(formData.plantedDate)
  const canSubmit = Boolean(formData.plantId && hasDateForIntent && formData.quantity > 0)

  const [harvestData, setHarvestData] = useState({
    harvestDate: new Date().toISOString().split('T')[0],
    quantity: '',
    weight: '',
    notes: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetch('/plant-database.json')
      .then(res => res.json() as Promise<PlantDatabaseResponse>)
      .then(data => {
        const plants = data.plants.map((plant) => ({
          id: plant.id,
          commonName: plant.commonName,
          emoji: plant.emoji && plant.emoji !== '�' ? plant.emoji : '🌱',
          growthInfo: {
            daysToGermination: plant.growthInfo?.daysToGermination || 7,
            daysToMaturity: plant.growthInfo?.daysToMaturity || 60,
            daysToHarvest: plant.growthInfo?.daysToHarvest || 70
          }
        }))
        setPlantDatabase(plants)
        setFilteredPlants(plants)
      })
      .catch(err => console.error('Error loading plant database:', err))
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredPlants(
        plantDatabase.filter(p =>
          p.commonName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredPlants(plantDatabase)
    }
  }, [searchTerm, plantDatabase])

  const loadTrackedPlants = useCallback(async () => {
    if (!user) return

    try {
      const q = query(
        collection(db, 'users', user.uid, 'tracker'),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const plants: TrackedPlant[] = []

      querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data()
        if (!data.status) {
          data.status = data.plantedDate ? 'planted' : 'planned'
        }
        plants.push({ id: docSnapshot.id, ...data } as TrackedPlant)
      })

      setTrackedPlants(plants)
    } catch (error) {
      console.error('Error loading tracked plants:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }

    void loadTrackedPlants()
  }, [user, loadTrackedPlants])

  const getDaysPlanted = (plantedDate: string) => {
    if (!plantedDate) return 0
    const planted = new Date(plantedDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - planted.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDaysUntil = (targetDate?: string | null) => {
    if (!targetDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    return Math.round(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatDateForDisplay = (date?: string | null) => {
    if (!date) return null
    const timestamp = Date.parse(date)
    if (Number.isNaN(timestamp)) return null
    return new Date(timestamp).toLocaleDateString()
  }

  const getProgressPercentage = (plant: TrackedPlant) => {
    const plantInfo = plantDatabase.find(p => p.id === plant.plantId)
    if (!plantInfo) return 0

    const daysPlanted = getDaysPlanted(plant.plantedDate)
    const totalDays = plantInfo.growthInfo?.daysToHarvest || 70

    return Math.min((daysPlanted / totalDays) * 100, 100)
  }

  // Normalize stage names across historical data and UI
  const normalizeStage = (stage?: string | null): string => {
    const t = (stage || '').toLowerCase().trim()
    if (!t) return ''
    if (t === 'flowering' || t === 'vegetative growth' || t.includes('flowering')) {
      return 'vegetative growth/flowering'
    }
    return stage || ''
  }

  const getCurrentStageAuto = (plant: TrackedPlant) => {
    const daysPlanted = getDaysPlanted(plant.plantedDate)
    const plantInfo = plantDatabase.find(p => p.id === plant.plantId)
    const daysToHarvest = plantInfo?.growthInfo?.daysToHarvest || 70
    
    // Automatic stage progression based on days planted
    if (daysPlanted < 7) {
      return 'Germination'
    } else if (daysPlanted < 24.5) { // 7 + 17.5
      return 'Seedling'
    } else if (daysPlanted < 66.5) { // 7 + 17.5 + 42
      return 'vegetative growth/flowering'
    } else if (daysPlanted >= daysToHarvest) {
      return 'Ready to Harvest'
    } else {
      return 'vegetative growth/flowering'
    }
  }

  const getCurrentMilestone = (plant: TrackedPlant) => {
    return getCurrentStageAuto(plant)
  }

  const openHarvestModal = (plant: TrackedPlant) => {
    setSelectedPlant(plant)
    setHarvestData({
      harvestDate: new Date().toISOString().split('T')[0],
      quantity: plant.quantity.toString(),
      weight: '',
      notes: ''
    })
    setShowHarvestModal(true)
  }

  const selectPlant = (plant: Plant) => {
    setFormData(prev => ({
      ...prev,
      plantId: plant.id,
      plantName: plant.commonName,
      emoji: plant.emoji || '🌱'
    }))
    setSearchTerm('')
  }

  const createDefaultMilestones = (plantId: string): Milestone[] => {
    const plantInfo = plantDatabase.find(p => p.id === plantId)
    const daysToHarvest = plantInfo?.growthInfo?.daysToHarvest || 70
    
    return [
      {
        name: 'Germination',
        reached: false,
        estimatedDays: 7
      },
      {
        name: 'Seedling',
        reached: false,
        estimatedDays: 24.5 // 7 + 17.5
      },
      {
        name: 'vegetative growth/flowering',
        reached: false,
        estimatedDays: 66.5 // 7 + 17.5 + 42
      },
      {
        name: 'Ready to Harvest',
        reached: false,
        estimatedDays: daysToHarvest
      }
    ]
  }

  const handleAddPlant = async () => {
    if (!user || !formData.plantId || !formData.plantName) {
      alert('Please select a plant')
      return
    }

    if (formData.intent === 'planned') {
      if (!formData.plannedDate) {
        alert('Please choose a target date for your planned start.')
        return
      }

      const today = getToday()
      if (formData.plannedDate < today) {
        alert('Please choose a future date for your planned start.')
        return
      }
    }

    try {
      const now = new Date().toISOString()
      const commonPayload = {
        plantId: formData.plantId,
        plantName: formData.plantName,
        variety: formData.variety,
        emoji: formData.emoji,
        quantity: formData.quantity,
        location: formData.location,
        milestones: createDefaultMilestones(formData.plantId),
        notes: formData.notes,
        userId: user.uid,
        createdAt: serverTimestamp()
      }

      if (formData.intent === 'planned') {
        await addDoc(collection(db, 'users', user.uid, 'tracker'), {
          ...commonPayload,
          plantedDate: '',
          plannedDate: formData.plannedDate,
          currentStage: 'Planned',
          status: 'planned' as const,
          lastWatered: null
        })
      } else {
        await addDoc(collection(db, 'users', user.uid, 'tracker'), {
          ...commonPayload,
          plantedDate: formData.plantedDate,
          currentStage: 'Planted',
          status: 'planted' as const,
          lastWatered: now
        })
      }

      resetAddForm()
      setShowAddModal(false)
      await loadTrackedPlants()
    } catch (error) {
      console.error('Error adding plant:', error)
      alert('Failed to add plant. Please try again.')
    }
  }

  const handleHarvest = async () => {
    if (!user || !selectedPlant) return

    if (selectedPlant.status === 'planned') {
      alert('Please mark this plant as planted before harvesting.')
      return
    }

    if (!selectedPlant.plantedDate) {
      alert('This plant has no planted date. Please mark it as planted first.')
      return
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'harvestHistory'), {
        plantId: selectedPlant.plantId,
        plantName: selectedPlant.plantName,
        variety: selectedPlant.variety || '',
        emoji: selectedPlant.emoji || '',
        plantedDate: selectedPlant.plantedDate,
        harvestDate: harvestData.harvestDate,
        quantity: harvestData.quantity || '',
        weight: harvestData.weight || '',
        notes: harvestData.notes || '',
        daysToHarvest: getDaysPlanted(selectedPlant.plantedDate),
        createdAt: serverTimestamp()
      })

      await deleteDoc(doc(db, 'users', user.uid, 'tracker', selectedPlant.id))

      setShowHarvestModal(false)
      setSelectedPlant(null)
      setHarvestData({
        harvestDate: new Date().toISOString().split('T')[0],
        quantity: '',
        weight: '',
        notes: ''
      })
      await loadTrackedPlants()

      alert('Plant harvested successfully! 🎉')
    } catch (error) {
      console.error('Error harvesting plant:', error)
      alert(`Failed to harvest plant. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const openEditModal = (plant: TrackedPlant) => {
    setSelectedPlant(plant)
    setFormData(prev => ({
      ...prev,
      plantId: plant.plantId,
      plantName: plant.plantName,
      variety: plant.variety || '',
      emoji: plant.emoji || '🌱',
      quantity: plant.quantity,
      location: plant.location || '',
      plantedDate: plant.plantedDate || '',
      plannedDate: plant.plannedDate || getToday(),
      notes: plant.notes || '',
      intent: plant.status === 'planned' ? 'planned' : 'planted'
    }))
    setShowEditModal(true)
  }

  const handleEditPlant = async () => {
    if (!user || !selectedPlant) return

    if (formData.intent === 'planned') {
      if (!formData.plannedDate) {
        alert('Please choose a future target date for this planned start.')
        return
      }

      if (formData.plannedDate < getToday()) {
        alert('Planned starts must use today or a future date.')
        return
      }
    } else if (!formData.plantedDate) {
      alert('Please provide the planted date for this entry.')
      return
    }

    try {
      const updates: Record<string, unknown> = {
        variety: formData.variety,
        quantity: formData.quantity,
        location: formData.location,
        notes: formData.notes
      }

      if (formData.intent === 'planned') {
        Object.assign(updates, {
          status: 'planned',
          currentStage: 'Planned',
          plannedDate: formData.plannedDate,
          plantedDate: deleteField(),
          lastWatered: deleteField()
        })
      } else {
        Object.assign(updates, {
          status: 'planted',
          plantedDate: formData.plantedDate,
          currentStage: selectedPlant.currentStage === 'Planned' ? 'Planted' : selectedPlant.currentStage || 'Planted',
          plannedDate: deleteField()
        })

        if (selectedPlant.status === 'planned' && !selectedPlant.lastWatered) {
          Object.assign(updates, { lastWatered: new Date().toISOString() })
        }
      }

      await updateDoc(doc(db, 'users', user.uid, 'tracker', selectedPlant.id), updates)

      setShowEditModal(false)
      setSelectedPlant(null)
      resetAddForm()
      await loadTrackedPlants()
    } catch (error) {
      console.error('Error updating plant:', error)
      alert('Failed to update plant. Please try again.')
    }
  }

  const handleDelete = async (plantId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this plant from tracking?')) return

    try {
  await deleteDoc(doc(db, 'users', user.uid, 'tracker', plantId))
  await loadTrackedPlants()
    } catch (error) {
      console.error('Error deleting plant:', error)
      alert('Failed to delete plant. Please try again.')
    }
  }

  const handleWater = async (plant: TrackedPlant) => {
    if (!user) return

    try {
      await updateDoc(doc(db, 'users', user.uid, 'tracker', plant.id), {
        lastWatered: new Date().toISOString()
      })
      await loadTrackedPlants()
    } catch (error) {
      console.error('Error logging watering:', error)
      alert('Failed to log watering. Please try again.')
    }
  }

  const getDaysSinceWatered = (lastWatered?: string | null): number => {
    if (!lastWatered) return 999
    const lastWateredDate = new Date(lastWatered)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastWateredDate.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const getWateringMessage = (lastWatered?: string | null): string => {
    const days = getDaysSinceWatered(lastWatered)
    if (days === 0) return 'Watered today'
    if (days === 1) return 'Watered 1 day ago'
    if (days >= 999) return 'Not watered yet'
    return `Watered ${days} days ago`
  }

  const getWateringColor = (lastWatered?: string | null): string => {
    const days = getDaysSinceWatered(lastWatered)
    if (days <= 2) return 'text-green-600'
    if (days <= 4) return 'text-yellow-600'
    if (days <= 7) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleMarkAsPlanted = async (plant: TrackedPlant) => {
    if (!user) return

    try {
      const plantedDate = new Date().toISOString()

      await updateDoc(doc(db, 'users', user.uid, 'tracker', plant.id), {
        status: 'planted',
        plantedDate: plantedDate.split('T')[0],
        currentStage: 'Planted',
        plannedDate: deleteField()
      })

      const plantedDateObj = new Date(plantedDate)
      for (const milestone of plant.milestones) {
        const milestoneDate = new Date(plantedDateObj)
        milestoneDate.setDate(milestoneDate.getDate() + (milestone.estimatedDays || 0))

        const calendarEvent = {
          title: `${milestone.name}: ${plant.plantName}`,
          date: milestoneDate.toISOString(),
          plantId: plant.plantId,
          plantName: plant.plantName,
          type: 'milestone',
          milestoneName: milestone.name,
          description: `Expected ${milestone.name.toLowerCase()} for ${plant.plantName}`,
          userId: user.uid,
          createdAt: serverTimestamp()
        }

        await addDoc(collection(db, 'users', user.uid, 'calendar'), calendarEvent)
      }

      await loadTrackedPlants()
      alert(`🌱 ${plant.plantName} marked as planted with milestone reminders created!`)
    } catch (error) {
      console.error('Error marking as planted:', error)
      alert('Failed to mark as planted. Please try again.')
    }
  }

  const updateMilestone = async (plant: TrackedPlant, milestoneIndex: number) => {
    if (!user) return

    try {
      const updatedMilestones = [...plant.milestones]
      updatedMilestones[milestoneIndex] = {
        ...updatedMilestones[milestoneIndex],
        reached: !updatedMilestones[milestoneIndex].reached,
        reachedDate: !updatedMilestones[milestoneIndex].reached
          ? new Date().toISOString()
          : undefined
      }

      await updateDoc(doc(db, 'users', user.uid, 'tracker', plant.id), {
        milestones: updatedMilestones
      })

      await loadTrackedPlants()
    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

  const plantedCount = trackedPlants.filter(p => p.status === 'planted').length
  const plannedStarts = trackedPlants
    .filter(p => p.status === 'planned')
    .sort((a, b) => {
      const aTime = a.plannedDate ? new Date(a.plannedDate).getTime() : Number.POSITIVE_INFINITY
      const bTime = b.plannedDate ? new Date(b.plannedDate).getTime() : Number.POSITIVE_INFINITY
      return aTime - bTime
    })
  const plannedCount = plannedStarts.length
  const readyToHarvestCount = trackedPlants.filter(
    p => p.status === 'planted' && getCurrentMilestone(p) === 'Ready to Harvest'
  ).length
  const totalPlants = trackedPlants.reduce((sum, p) => sum + p.quantity, 0)

  const trackerInsights = [
    {
      label: 'Active Plantings',
      value: plantedCount,
      description: 'Currently thriving in your beds',
      accent: 'from-emerald-400/60 via-emerald-500/55 to-emerald-600/50',
      icon: Sprout,
      iconTint: 'text-emerald-500'
    },
    {
      label: 'Planned Starts',
      value: plannedCount,
      description: 'Ready to drop into soil',
      accent: 'from-amber-300/70 via-yellow-400/60 to-orange-300/55',
      icon: Calendar,
      iconTint: 'text-amber-500'
    },
    {
      label: 'Harvest Window',
      value: readyToHarvestCount,
      description: 'Primed for your basket',
      accent: 'from-lime-300/60 via-emerald-400/55 to-teal-400/50',
      icon: Flower2,
      iconTint: 'text-lime-500'
    },
    {
      label: 'Plants Tracked',
      value: totalPlants,
      description: 'Across every variety',
      accent: 'from-cyan-300/60 via-emerald-400/50 to-sky-400/50',
      icon: Apple,
      iconTint: 'text-cyan-500'
    }
  ]

  if (authLoading || loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <span className="floating-orb w-72 h-72 -left-16 top-20 bg-emerald-300/30" />
        <span className="floating-orb w-80 h-80 right-[-120px] top-40 bg-teal-300/30" />
        <div className="relative z-10 flex items-center justify-center h-[70vh] px-4">
          <div className="glass-card px-10 py-12 text-center space-y-4 max-w-md">
            <div className="flex items-center justify-center gap-3 text-lg font-semibold text-slate-600">
              <Clock className="w-5 h-5 text-emerald-500 animate-pulse" />
              Loading your garden intelligence…
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PremiumFeatureWrapper featureName="Tracker">
      <div className="relative min-h-screen overflow-hidden">
      <span className="floating-orb w-72 h-72 -left-24 top-32 bg-emerald-300/30" />
      <span className="floating-orb w-96 h-96 right-[-160px] top-24 bg-lime-300/25" />
      <span className="floating-orb w-64 h-64 bottom-10 left-1/2 -translate-x-1/2 bg-sky-200/20" />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <header className="glass-panel shine-border px-8 py-10 md:px-12 md:py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 max-w-3xl">
              <span className="glass-pill w-fit">Premium Plant Intelligence</span>
              <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
                Orchestrate every stage of your <span className="gradient-text">Plant Tracker</span>
              </h1>
              <p className="text-lg text-slate-600">
                Monitor germination, plan harvests, and surface reminders in one refined workspace. Syncs live with your mobile app so every milestone stays perfectly aligned.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => openAddModal('planted')}
                  className="btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Add plant to tracker
                </button>
                <button
                  onClick={() => router.push('/planner')}
                  className="btn-secondary"
                >
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Open seasonal planner
                </button>
              </div>
            </div>
            <div className="w-full md:w-[320px] flex flex-col gap-4">
              {trackerInsights.slice(0, 2).map((insight) => {
                const Icon = insight.icon
                return (
                  <article key={insight.label} className="glass-card-hover relative overflow-hidden px-6 py-7">
                    <div className={`absolute inset-0 bg-gradient-to-br ${insight.accent}`} />
                    <div className="relative z-10 space-y-4 text-white">
                      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.28em] uppercase text-white/70">
                        <Icon className="w-5 h-5 text-white drop-shadow" />
                        {insight.label}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-semibold">{insight.value}</span>
                      </div>
                      <p className="text-sm text-white/80">{insight.description}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {trackerInsights.map((insight) => {
            const Icon = insight.icon
            return (
              <article key={insight.label} className="glass-card-hover p-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${insight.accent} opacity-20`} />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    <span>{insight.label}</span>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/75 shadow-sm">
                      <Icon className={`w-5 h-5 ${insight.iconTint}`} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold text-slate-900">{insight.value}</span>
                  </div>
                  <p className="text-sm text-slate-600">{insight.description}</p>
                </div>
              </article>
            )
          })}
        </section>

        {/* Planned Starts Spotlight */}
        <section className="glass-panel px-6 py-7 md:px-8 md:py-9">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Planned Starts</h2>
              <p className="text-sm text-slate-600">
                Keep tabs on the varieties you intend to drop into soil. Mark them as planted when they hit the beds to unlock full tracking.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <span className="glass-pill text-xs uppercase tracking-[0.28em] text-slate-500">
                {plannedCount === 0 ? 'No starts queued' : `${plannedCount} planned starts`}
              </span>
              <button
                onClick={() => openAddModal('planned')}
                className="btn-ghost text-sm px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                Plan a new start
              </button>
            </div>
          </div>

          {plannedStarts.length === 0 ? (
            <div className="glass-card-hover p-6 text-center text-slate-600">
              <div className="text-4xl mb-3">📝</div>
              <p>No planned starts yet. Open the planner or add a plant to queue up your next planting session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plannedStarts.map((plant) => {
                const daysUntilStart = getDaysUntil(plant.plannedDate)
                const formattedTargetDate = formatDateForDisplay(plant.plannedDate)

                return (
                  <article
                    key={plant.id}
                    className="glass-card-hover px-5 py-5 md:px-6 md:py-6 flex flex-col gap-4"
                  >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl" aria-hidden>{plant.emoji || '🌱'}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                          {plant.plantName}
                        </h3>
                        {plant.variety && (
                          <p className="text-sm text-slate-500">{plant.variety}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 uppercase tracking-[0.22em]">
                          <span className="glass-pill bg-white/80 text-slate-600/90">
                            {plant.quantity} {plant.quantity === 1 ? 'start' : 'starts'}
                          </span>
                          <span className="glass-pill bg-white/80 text-slate-600/90">
                            Target &middot; {formattedTargetDate ?? 'Date TBD'}
                          </span>
                          {typeof daysUntilStart === 'number' && (
                            <span className="glass-pill bg-white/85 text-slate-600/90">
                              {daysUntilStart > 0
                                ? `Starts in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}`
                                : daysUntilStart === 0
                                  ? 'Starts today'
                                  : `Overdue by ${Math.abs(daysUntilStart)} day${Math.abs(daysUntilStart) === 1 ? '' : 's'}`}
                            </span>
                          )}
                          {plant.location && (
                            <span className="glass-pill bg-white/80 text-slate-600/90">📍 {plant.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {plant.notes && (
                      <p className="max-w-md text-sm text-slate-600 bg-white/70 border border-white/60 rounded-xl px-4 py-3 shadow-inner-soft">
                        <span className="font-medium text-slate-700">Notes:</span> {plant.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleMarkAsPlanted(plant)}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl smooth-transition hover:shadow-glow-primary"
                    >
                      <Sprout className="w-4 h-4" />
                      Mark as planted
                    </button>
                    <button
                      onClick={() => openEditModal(plant)}
                      className="btn-ghost text-sm px-4 py-2"
                    >
                      <Edit className="w-4 h-4" />
                      Update details
                    </button>
                    <button
                      onClick={() => handleDelete(plant.id)}
                      className="btn-tertiary text-sm px-4 py-2 text-rose-600 border-rose-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </article>
              )
              })}
            </div>
          )}
        </section>

        {/* Tracked Plants Grid */}
        {trackedPlants.length === 0 ? (
          <div className="glass-card p-12 text-center animate-scale-in">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No plants tracked yet</h3>
            <p className="text-slate-600 mb-6">Start tracking your plants to monitor their growth and harvest times</p>
            <button
              onClick={() => openAddModal('planted')}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Your First Plant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackedPlants.map(plant => {
              const progress = getProgressPercentage(plant)
              const currentMilestone = normalizeStage(getCurrentMilestone(plant))
              const daysPlanted = plant.status === 'planted' ? getDaysPlanted(plant.plantedDate) : 0
              const isPlanned = plant.status === 'planned'
              
              return (
                <div key={plant.id} className="glass-card-hover overflow-hidden">
                  {/* Plant Header with Glass Effect */}
                  <div className={`p-6 text-white relative overflow-hidden ${isPlanned ? 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700' : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800'}`}>
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl drop-shadow-lg">{plant.emoji || '🌱'}</div>
                        <div>
                          <h3 className="text-xl font-bold drop-shadow-md">{plant.plantName}</h3>
                          {plant.variety && (
                            <p className={`text-sm ${isPlanned ? 'text-slate-100' : 'text-emerald-100'}`}>{plant.variety}</p>
                          )}
                          {isPlanned && (
                            <p className="text-xs bg-white/30 backdrop-blur-sm inline-block px-3 py-1 rounded-full mt-1">📝 Planned</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold drop-shadow-md">{plant.quantity}</div>
                        <div className={`text-xs ${isPlanned ? 'text-slate-100' : 'text-emerald-100/90'}`}>plants</div>
                      </div>
                    </div>
                  </div>

                  {/* Plant Details */}
                  <div className="p-6">{isPlanned ? (
                    /* Planned Plant View */
                    <>
                      <div className="mb-4 p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/70 rounded-xl shadow-inner-soft">
                        <p className="text-sm text-slate-600">
                          This plant is in your garden plan. Click &ldquo;Mark as Planted&rdquo; when you actually plant it to start milestone tracking and calendar reminders.
                        </p>
                      </div>
                      
                      {plant.location && (
                          <div className="text-sm text-slate-600 mb-4 flex items-center gap-2">
                          <span className="text-lg">📍</span>
                          <span>Location: {plant.location}</span>
                        </div>
                      )}
                      
                      {plant.notes && (
                          <div className="text-sm text-slate-600 mb-4 p-3 bg-white/70 border border-white/60 rounded-xl shadow-inner-soft">
                          <span className="text-lg">📝</span> {plant.notes}
                        </div>
                      )}

                      {/* Action Buttons for Planned Plant */}
                      <div className="flex gap-2 mt-6">
                        <button
                          onClick={() => handleMarkAsPlanted(plant)}
                            className="flex-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white py-3 rounded-xl hover:shadow-glow-primary hover:scale-105 smooth-transition font-semibold flex items-center justify-center gap-2"
                        >
                          <Sprout className="w-5 h-5" />
                          Mark as Planted
                        </button>
                        <button
                          onClick={() => openEditModal(plant)}
                            className="px-4 py-2 glass-card hover:bg-white/80 smooth-transition rounded-xl"
                        >
                            <Edit className="w-5 h-5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(plant.id)}
                            className="px-4 py-2 glass-card hover:bg-rose-50 smooth-transition rounded-xl"
                        >
                            <Trash2 className="w-5 h-5 text-rose-600" />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Planted Plant View (existing code) */
                    <>
                    {/* Days Planted Display */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">Days Since Planted</span>
                        <span className="text-sm font-semibold text-emerald-600">{daysPlanted} days</span>
                      </div>
                      <div className="w-full bg-slate-200/70 rounded-full h-3 shadow-inner-soft overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Current Stage */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 rounded-xl border border-emerald-200/60">
                      <Sprout className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-emerald-700">Current Stage</div>
                        <div className="font-semibold text-slate-900">{currentMilestone}</div>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2 mb-4">
                      {plant.milestones.map((milestone, index) => {
                        const normalizedName = normalizeStage(milestone.name)
                        const isCurrentStage = normalizedName === currentMilestone
                        const estDays = milestone.estimatedDays ?? Number.POSITIVE_INFINITY
                        const isPastStage = daysPlanted >= estDays
                        const displayName = normalizedName || ''

                        return (
                          <div
                            key={index}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl ${
                              isCurrentStage 
                                ? 'bg-emerald-100/70 border border-emerald-300' 
                                : isPastStage 
                                  ? 'bg-white/70' 
                                  : 'bg-slate-50/70'
                            } hover:bg-white/80 cursor-pointer transition`}
                            onClick={() => updateMilestone(plant, index)}
                            role="button"
                            aria-pressed={!!plant.milestones[index]?.reached}
                          >
                            {isPastStage ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isCurrentStage ? (
                              <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400" />
                            )}
                            <div className="flex-1">
                              <span className={`text-sm ${
                                isPastStage ? 'text-slate-900 font-medium' : 
                                isCurrentStage ? 'text-emerald-900 font-semibold' :
                                'text-slate-500'
                              }`}>
                                {displayName}
                              </span>
                              <div className="text-xs text-slate-500 mt-1">
                                {Number.isFinite(estDays) ? `Day ${Math.round(estDays)}` : 'Day —'}
                              </div>
                            </div>
                            {isCurrentStage && (
                              <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-full font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Metadata */}
                    <div className="border-t border-slate-200/60 pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        Planted {new Date(plant.plantedDate).toLocaleDateString()} ({daysPlanted} days ago)
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${getWateringColor(plant.lastWatered)} font-medium`}>
                        💧 {getWateringMessage(plant.lastWatered)}
                      </div>
                      {plant.location && (
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                          <span>📍</span>
                          <span>{plant.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => handleWater(plant)}
                        className="flex-1 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 text-white py-2 rounded-xl hover:shadow-soft-lg hover:scale-105 smooth-transition font-semibold flex items-center justify-center gap-2"
                        title="Log watering"
                      >
                        💧 Water
                      </button>
                      <button
                        onClick={() => openHarvestModal(plant)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white py-2 rounded-xl hover:shadow-soft-lg hover:scale-105 smooth-transition font-semibold flex items-center justify-center gap-2"
                      >
                        <Apple className="w-4 h-4" />
                        Harvest
                      </button>
                      <button
                        onClick={() => openEditModal(plant)}
                        className="px-4 py-2 glass-card hover:bg-white smooth-transition rounded-xl"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(plant.id)}
                        className="px-4 py-2 glass-card hover:bg-red-50 smooth-transition rounded-xl"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                    </>
                  )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add Plant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold gradient-text">Add Plant to Tracker</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetAddForm()
                  }}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Tracking Intent */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    How would you like to track this plant?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => switchIntent('planted')}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isPlannedIntent
                          ? 'border-white/60 bg-white/70 text-slate-500 hover:bg-white/80'
                          : 'border-emerald-500/80 bg-emerald-500/10 text-emerald-700 shadow-inner-soft'
                      }`}
                    >
                      🌱 Already planted
                      <span className="block text-xs font-normal text-slate-500">
                        Log milestones for plants in soil now
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchIntent('planned')}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isPlannedIntent
                          ? 'border-amber-400/80 bg-amber-100/60 text-amber-700 shadow-inner-soft'
                          : 'border-white/60 bg-white/70 text-slate-500 hover:bg-white/80'
                      }`}
                    >
                      📅 Plan for later
                      <span className="block text-xs font-normal text-slate-500">
                        Schedule starts and plant when the date arrives
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plant Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Select Plant *
                  </label>
                  {formData.plantId ? (
                    <div className="flex items-center justify-between p-4 border-2 border-primary-600 rounded-lg bg-primary-50">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{formData.emoji}</span>
                        <span className="font-semibold text-slate-900">{formData.plantName}</span>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, plantId: '', plantName: '', emoji: '🌱' })}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search for a plant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                      />
                      {searchTerm && (
                        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                          {filteredPlants.slice(0, 10).map(plant => (
                            <button
                              key={plant.id}
                              onClick={() => selectPlant(plant)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-white/80 text-left transition"
                            >
                              <span className="text-2xl">{plant.emoji}</span>
                              <span className="text-slate-900">{plant.commonName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Variety */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variety (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Cherry Tomato, Purple Basil"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Date Selection */}
                {isPlannedIntent ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.plannedDate}
                      min={getToday()}
                      onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-amber-300/80 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    />
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Planned starts need today or a future date so reminders fire on schedule.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planted Date *
                    </label>
                    <input
                      type="date"
                      value={formData.plantedDate}
                      onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    />
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Select today or a past date if you forgot to track earlier
                    </p>
                  </div>
                )}

                {/* Quantity and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Bed 1, Container"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="Any special notes about this planting..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetAddForm()
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPlant}
                  disabled={!canSubmit}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Tracker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Modal */}
      {showHarvestModal && selectedPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{selectedPlant.emoji}</div>
                  <div>
                    <h2 className="text-2xl font-bold">Harvest {selectedPlant.plantName}</h2>
                    {selectedPlant.variety && (
                      <p className="text-gray-600 text-sm">{selectedPlant.variety}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowHarvestModal(false)
                    setSelectedPlant(null)
                    setHarvestData({
                      harvestDate: new Date().toISOString().split('T')[0],
                      quantity: '',
                      weight: '',
                      notes: ''
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Harvest Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harvest Date *
                  </label>
                  <input
                    type="date"
                    value={harvestData.harvestDate}
                    onChange={(e) => setHarvestData({ ...harvestData, harvestDate: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900"
                  />
                </div>

                {/* Quantity and Weight */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity Harvested
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 10 tomatoes"
                      value={harvestData.quantity}
                      onChange={(e) => setHarvestData({ ...harvestData, quantity: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 2 lbs"
                      value={harvestData.weight}
                      onChange={(e) => setHarvestData({ ...harvestData, weight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harvest Notes
                  </label>
                  <textarea
                    placeholder="How was the harvest? Any observations?"
                    value={harvestData.notes}
                    onChange={(e) => setHarvestData({ ...harvestData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Apple className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">This will:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Save harvest details to your history</li>
                        <li>Remove plant from active tracker</li>
                        <li>Track days from planting to harvest ({getDaysPlanted(selectedPlant.plantedDate)} days)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowHarvestModal(false)
                    setSelectedPlant(null)
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHarvest}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  <Apple className="w-5 h-5" />
                  Complete Harvest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plant Modal */}
      {showEditModal && selectedPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedPlant.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-bold">Edit {selectedPlant.plantName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold uppercase tracking-[0.24em] px-3 py-1 rounded-full ${formData.intent === 'planned' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {formData.intent === 'planned' ? 'Planned' : 'Planted'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formData.intent === 'planned'
                          ? `Target ${formatDateForDisplay(formData.plannedDate) ?? '(date needed)'}`
                          : formData.plantedDate
                            ? `Planted ${formatDateForDisplay(formData.plantedDate)}`
                            : 'Planted date not recorded'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedPlant(null)
                    resetAddForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Tracking Intent */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Tracking mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => switchIntent('planted')}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        formData.intent === 'planned'
                          ? 'border-white/60 bg-white/70 text-slate-500 hover:bg-white/80'
                          : 'border-emerald-500/80 bg-emerald-500/10 text-emerald-700 shadow-inner-soft'
                      }`}
                    >
                      🌱 Actively planted
                      <span className="block text-xs font-normal text-slate-500">
                        Record milestones and watering activity
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchIntent('planned')}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        formData.intent === 'planned'
                          ? 'border-amber-400/80 bg-amber-100/60 text-amber-700 shadow-inner-soft'
                          : 'border-white/60 bg-white/70 text-slate-500 hover:bg-white/80'
                      }`}
                    >
                      📅 Planning ahead
                      <span className="block text-xs font-normal text-slate-500">
                        Keep this in your queue until it hits soil
                      </span>
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                {formData.intent === 'planned' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.plannedDate}
                      min={getToday()}
                      onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-amber-300/80 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    />
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Planned starts need today or a future date so reminders fire on schedule.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planted Date *
                    </label>
                    <input
                      type="date"
                      value={formData.plantedDate}
                      onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    />
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Select today or a past date if you planted earlier than recorded
                    </p>
                  </div>
                )}

                {/* Variety */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variety
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Cherry Tomato, Purple Basil"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900"
                  />
                </div>

                {/* Quantity and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Bed 1, Container"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    placeholder="Any special notes about this plant..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedPlant(null)
                    resetAddForm()
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditPlant}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PremiumFeatureWrapper>
  )
}
