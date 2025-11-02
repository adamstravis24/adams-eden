import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlantbookGroup, PlantbookGroupOptions } from '@/types/plantbook'
import { fetchPlantbookGroups, getPlantbookErrorMessage } from '@/lib/plantbook'

interface UsePlantbookGroupsOptions extends PlantbookGroupOptions {
  skip?: boolean
}

interface UsePlantbookGroupsResult {
  groups: PlantbookGroup[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePlantbookGroups(
  options: UsePlantbookGroupsOptions = {}
): UsePlantbookGroupsResult {
  const { limit = 6, featuredOnly = false, skip = false } = options
  const [groups, setGroups] = useState<PlantbookGroup[]>([])
  const [loading, setLoading] = useState<boolean>(!skip)
  const [error, setError] = useState<string | null>(null)
  const active = useRef(true)

  const loadGroups = useCallback(async () => {
    if (skip) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const fetched = await fetchPlantbookGroups({ limit, featuredOnly })
      if (!active.current) {
        return
      }

      setGroups(fetched)
      setError(null)
    } catch (error) {
      if (active.current) {
        setError(getPlantbookErrorMessage(error))
      }
    } finally {
      if (active.current) {
        setLoading(false)
      }
    }
  }, [featuredOnly, limit, skip])

  useEffect(() => {
    active.current = true
    loadGroups()

    return () => {
      active.current = false
    }
  }, [loadGroups])

  const refresh = useCallback(async () => {
    await loadGroups()
  }, [loadGroups])

  return {
    groups,
    loading,
    error,
    refresh,
  }
}
