import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPlantbookFriendIds, getPlantbookErrorMessage } from '@/lib/plantbook'

interface UsePlantbookFriendIdsResult {
  friendIds: string[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePlantbookFriendIds(userId?: string | null): UsePlantbookFriendIdsResult {
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(userId))
  const [error, setError] = useState<string | null>(null)
  const active = useRef(true)

  const load = useCallback(async () => {
    if (!userId) {
      if (active.current) {
        setFriendIds([])
        setLoading(false)
        setError(null)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      const ids = await fetchPlantbookFriendIds(userId)
      if (!active.current) {
        return
      }
      setFriendIds(ids)
    } catch (error) {
      if (active.current) {
        setError(getPlantbookErrorMessage(error))
      }
    } finally {
      if (active.current) {
        setLoading(false)
      }
    }
  }, [userId])

  useEffect(() => {
    active.current = true
    load()

    return () => {
      active.current = false
    }
  }, [load])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  return {
    friendIds,
    loading,
    error,
    refresh,
  }
}
