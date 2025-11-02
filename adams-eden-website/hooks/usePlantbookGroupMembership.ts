import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlantbookGroupMembership } from '@/types/plantbook'
import { fetchPlantbookGroupMembership, getPlantbookErrorMessage } from '@/lib/plantbook'

interface UsePlantbookGroupMembershipOptions {
  skip?: boolean
  fallbackGroupIds?: string[]
}

interface UsePlantbookGroupMembershipResult {
  membership: PlantbookGroupMembership | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePlantbookGroupMembership(
  groupId?: string | null,
  userId?: string | null,
  options: UsePlantbookGroupMembershipOptions = {}
): UsePlantbookGroupMembershipResult {
  const { skip = false, fallbackGroupIds = [] } = options
  const [membership, setMembership] = useState<PlantbookGroupMembership | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(groupId && userId) && !skip)
  const [error, setError] = useState<string | null>(null)
  const active = useRef(true)
  const fallbackIdsRef = useRef(fallbackGroupIds)

  // Update ref when fallbackGroupIds changes
  useEffect(() => {
    fallbackIdsRef.current = fallbackGroupIds
  }, [fallbackGroupIds])

  const loadMembership = useCallback(async () => {
    if (skip || !groupId || !userId) {
      setMembership(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)

    try {
      const result = await fetchPlantbookGroupMembership(groupId, userId, {
        fallbackGroupIds: fallbackIdsRef.current,
      })
      if (!active.current) {
        return
      }

      setMembership(result)
      setError(null)
    } catch (error) {
      if (active.current) {
        setError(getPlantbookErrorMessage(error))
        setMembership(null)
      }
    } finally {
      if (active.current) {
        setLoading(false)
      }
    }
  }, [groupId, skip, userId])

  useEffect(() => {
    active.current = true
    loadMembership()

    return () => {
      active.current = false
    }
  }, [loadMembership])

  const refresh = useCallback(async () => {
    await loadMembership()
  }, [loadMembership])

  return {
    membership,
    loading,
    error,
    refresh,
  }
}
