import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PlantbookFeedOptions, PlantbookPost } from '@/types/plantbook'
import {
  fetchPlantbookFeed,
  fetchPlantbookLoveStatuses,
  getPlantbookErrorMessage,
  togglePlantbookLove,
} from '@/lib/plantbook'

interface UsePlantbookFeedOptions extends PlantbookFeedOptions {
  skip?: boolean
}

interface UsePlantbookFeedResult {
  posts: PlantbookPost[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  toggleLove: (postId: string) => Promise<void>
  isTogglingLove: (postId: string) => boolean
}

export function usePlantbookFeed(
  userId?: string | null,
  options: UsePlantbookFeedOptions = {}
): UsePlantbookFeedResult {
  const { limit = 20, skip = false } = options
  const includePublic = options.includePublic ?? true
  const groupIdsKey = options.groupIds?.join('|') ?? ''
  const authorIdsKey = options.authorIds?.join('|') ?? ''
  const groupIds = useMemo(() => {
    if (!options.groupIds || options.groupIds.length === 0) {
      return [] as string[]
    }
    return [...options.groupIds]
  }, [groupIdsKey])
  const authorIds = useMemo(() => {
    if (!options.authorIds || options.authorIds.length === 0) {
      return [] as string[]
    }
    return [...options.authorIds]
  }, [authorIdsKey])
  const sinceMillis = useMemo(() => {
    if (!options.since) {
      return null
    }
    if (options.since instanceof Date) {
      return options.since.getTime()
    }
    if (typeof options.since.toMillis === 'function') {
      return options.since.toMillis()
    }
    return null
  }, [options.since])
  const sinceValue = useMemo(() => options.since, [sinceMillis])
  const [posts, setPosts] = useState<PlantbookPost[]>([])
  const [loading, setLoading] = useState<boolean>(!skip)
  const [error, setError] = useState<string | null>(null)
  const [pendingLove, setPendingLove] = useState<Record<string, boolean>>({})
  const active = useRef(true)

  const loadPosts = useCallback(async () => {
    if (skip) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const fetched = await fetchPlantbookFeed({
        limit,
        groupIds,
        authorIds,
        includePublic,
        since: sinceValue,
      })
      if (!active.current) {
        return
      }

      if (userId) {
        const statuses = await fetchPlantbookLoveStatuses(
          fetched.map((post) => post.id),
          userId
        )
        setPosts(
          fetched.map((post) => ({
            ...post,
            viewerHasLoved: statuses[post.id] ?? Boolean(post.viewerHasLoved),
          }))
        )
      } else {
        setPosts(fetched)
      }

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
  }, [authorIds, groupIds, includePublic, limit, sinceValue, skip, userId])

  useEffect(() => {
    active.current = true
    loadPosts()

    return () => {
      active.current = false
    }
  }, [loadPosts])

  const toggleLove = useCallback(
    async (postId: string) => {
      if (!userId) {
        throw new Error('AUTH_REQUIRED')
      }

      setPendingLove((prev) => ({ ...prev, [postId]: true }))

      try {
        const result = await togglePlantbookLove(postId, userId)

        if (!active.current) {
          return
        }

        setPosts((prev) =>
          prev.map((post) => {
            if (post.id !== postId) {
              return post
            }

            const currentlyLoved = Boolean(post.viewerHasLoved)
            const nextLoved = Boolean(result?.loved)
            const lovesDelta = currentlyLoved === nextLoved ? 0 : nextLoved ? 1 : -1

            return {
              ...post,
              viewerHasLoved: nextLoved,
              stats: {
                ...post.stats,
                loves: Math.max(0, post.stats.loves + lovesDelta),
              },
            }
          })
        )

        setError(null)
      } catch (error) {
        if (active.current) {
          if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
            setError(null)
          } else {
            setError(getPlantbookErrorMessage(error))
          }
        }
        throw error
      } finally {
        if (active.current) {
          setPendingLove((prev) => {
            const next = { ...prev }
            delete next[postId]
            return next
          })
        }
      }
    },
    [userId]
  )

  const refresh = useCallback(async () => {
    await loadPosts()
  }, [loadPosts])

  const isTogglingLove = useCallback(
    (postId: string) => Boolean(pendingLove[postId]),
    [pendingLove]
  )

  return {
    posts,
    loading,
    error,
    refresh,
    toggleLove,
    isTogglingLove,
  }
}
