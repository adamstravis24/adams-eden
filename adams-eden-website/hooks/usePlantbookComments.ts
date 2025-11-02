import { useEffect, useRef, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore'
import type { PlantbookComment } from '@/types/plantbook'
import { db } from '@/lib/firebase'
import { getPlantbookErrorMessage, parsePlantbookComment } from '@/lib/plantbook'

interface UsePlantbookCommentsResult {
  comments: PlantbookComment[]
  loading: boolean
  error: string | null
}

export function usePlantbookComments(postId?: string | null): UsePlantbookCommentsResult {
  const [comments, setComments] = useState<PlantbookComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activePost = useRef<string | null>(null)

  useEffect(() => {
    activePost.current = postId ?? null

    if (!postId) {
      setComments([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const commentsRef = collection(db, 'plantbookPosts', postId, 'comments')
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (activePost.current !== postId) {
          return
        }

        setComments(
          snapshot.docs.map((docSnap) =>
            parsePlantbookComment(docSnap.id, postId, docSnap.data())
          )
        )
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        if (activePost.current !== postId) {
          return
        }

        setError(getPlantbookErrorMessage(snapshotError))
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [postId])

  return {
    comments,
    loading,
    error,
  }
}
