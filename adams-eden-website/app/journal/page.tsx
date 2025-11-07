'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { BookOpen, Plus, X, Calendar, Search, Filter, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import PremiumFeatureWrapper from '@/components/PremiumFeatureWrapper'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getErrorMessage } from '@/lib/errors'

type JournalEntry = {
  id: string
  title: string
  content: string
  date: Date
  tags: string[]
  images: string[]
  plantName?: string
  weather?: string
  temperature?: string
  createdAt: Date
  updatedAt: Date
}

export default function JournalPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('All')
  
  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formTags, setFormTags] = useState<string[]>([])
  const [formPlantName, setFormPlantName] = useState('')
  const [formWeather, setFormWeather] = useState('')
  const [formTemperature, setFormTemperature] = useState('')
  const [tagInput, setTagInput] = useState('')

  // Load journal entries from Firestore
  useEffect(() => {
    const loadEntries = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const entriesRef = collection(db, 'users', user.uid, 'journal')
        const q = query(entriesRef, orderBy('date', 'desc'))
        const snapshot = await getDocs(q)
        
        const loadedEntries = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            date: data.date?.toDate() || new Date(),
            tags: data.tags || [],
            images: data.images || [],
            plantName: data.plantName,
            weather: data.weather,
            temperature: data.temperature,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          }
        })
        
        setEntries(loadedEntries)
      } catch (error) {
        console.error('Error loading journal entries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [user])

  // Reset form
  const resetForm = () => {
    setFormTitle('')
    setFormContent('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormTags([])
    setFormPlantName('')
    setFormWeather('')
    setFormTemperature('')
    setTagInput('')
    setEditingEntry(null)
  }

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formTags.includes(tagInput.trim())) {
      setFormTags([...formTags, tagInput.trim()])
      setTagInput('')
    }
  }

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setFormTags(formTags.filter(t => t !== tag))
  }

  // Save entry
  const handleSaveEntry = async () => {
    if (!user || !formTitle.trim() || !formContent.trim()) {
      alert('Please fill in title and content')
      return
    }

    try {
      const entryData = {
        title: formTitle.trim(),
        content: formContent.trim(),
        date: Timestamp.fromDate(new Date(formDate)),
        tags: formTags,
        images: [],
        plantName: formPlantName.trim() || undefined,
        weather: formWeather.trim() || undefined,
        temperature: formTemperature.trim() || undefined,
        updatedAt: Timestamp.now(),
      }

      if (editingEntry) {
        // Update existing entry
        const entryRef = doc(db, 'users', user.uid, 'journal', editingEntry.id)
        await updateDoc(entryRef, entryData)
        
        setEntries(entries.map(e => 
          e.id === editingEntry.id 
            ? { ...e, ...entryData, date: new Date(formDate), updatedAt: new Date() }
            : e
        ))
        setShowEditModal(false)
      } else {
        // Create new entry
        const entriesRef = collection(db, 'users', user.uid, 'journal')
        const docRef = await addDoc(entriesRef, {
          ...entryData,
          createdAt: Timestamp.now(),
        })
        
        setEntries([{
          id: docRef.id,
          ...entryData,
          date: new Date(formDate),
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        }, ...entries])
        setShowAddModal(false)
      }

      resetForm()
    } catch (error: unknown) {
      console.error('Error saving entry:', error)
      alert(`Error saving entry: ${getErrorMessage(error)}. Please try again.`)
    }
  }

  // Delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user || !confirm('Are you sure you want to delete this entry?')) return

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'journal', entryId))
      setEntries(entries.filter(e => e.id !== entryId))
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Error deleting entry. Please try again.')
    }
  }

  // Edit entry
  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setFormTitle(entry.title)
    setFormContent(entry.content)
    setFormDate(entry.date.toISOString().split('T')[0])
    setFormTags(entry.tags)
    setFormPlantName(entry.plantName || '')
    setFormWeather(entry.weather || '')
    setFormTemperature(entry.temperature || '')
    setShowEditModal(true)
  }

  // Get all unique tags
  const allTags = ['All', ...new Set(entries.flatMap(e => e.tags))]

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.plantName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTag = selectedTag === 'All' || entry.tags.includes(selectedTag)
    
    return matchesSearch && matchesTag
  })

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access your garden journal</p>
            <Link 
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PremiumFeatureWrapper featureName="Journal">
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <BookOpen className="w-10 h-10 mr-3 text-green-600" />
                Garden Journal
              </h1>
              <p className="text-lg text-gray-600">Document your gardening journey</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Entry
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Entries List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading your journal...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || selectedTag !== 'All' ? 'No entries found' : 'Start Your Garden Journal'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedTag !== 'All' 
                ? 'Try adjusting your search or filter'
                : 'Document your plants, observations, and gardening experiences'}
            </p>
            {!searchQuery && selectedTag === 'All' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Entry
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{entry.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(entry.date)}
                        </span>
                        {entry.plantName && (
                          <span className="text-green-600 font-medium">🌱 {entry.plantName}</span>
                        )}
                        {entry.weather && (
                          <span>{entry.weather}</span>
                        )}
                        {entry.temperature && (
                          <span>{entry.temperature}°F</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{entry.content}</p>

                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Entry Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="What happened today?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Plant Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plant Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formPlantName}
                    onChange={(e) => setFormPlantName(e.target.value)}
                    placeholder="e.g., Tomato, Basil"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Weather & Temperature */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weather
                    </label>
                    <select
                      value={formWeather}
                      onChange={(e) => setFormWeather(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="☀️ Sunny">☀️ Sunny</option>
                      <option value="⛅ Partly Cloudy">⛅ Partly Cloudy</option>
                      <option value="☁️ Cloudy">☁️ Cloudy</option>
                      <option value="🌧️ Rainy">🌧️ Rainy</option>
                      <option value="⛈️ Stormy">⛈️ Stormy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature (°F)
                    </label>
                    <input
                      type="number"
                      value={formTemperature}
                      onChange={(e) => setFormTemperature(e.target.value)}
                      placeholder="72"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry *
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Write about your observations, tasks completed, or anything noteworthy..."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddTag}
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Add
                    </button>
                  </div>
                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formTags.map(tag => (
                        <span 
                          key={tag}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-green-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PremiumFeatureWrapper>
  )
}
