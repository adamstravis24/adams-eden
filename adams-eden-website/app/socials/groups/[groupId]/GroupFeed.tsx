'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ImagePlus, Loader2, MessageCircle, PlusCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlantbookFeed } from '@/hooks/usePlantbookFeed'
import { usePlantbookGroupMembership } from '@/hooks/usePlantbookGroupMembership'
import { createPlantbookPost, getPlantbookErrorMessage } from '@/lib/plantbook'
import type { PlantbookPost } from '@/types/plantbook'

interface GroupFeedProps {
  groupId: string
  groupName: string
  groupSlug?: string | null
}

function toDate(value: PlantbookPost['createdAt']) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  return null
}

function formatRelativeTime(value: PlantbookPost['createdAt']) {
  const date = toDate(value)
  if (!date) {
    return 'Just now'
  }

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) {
    return 'Moments ago'
  }

  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) {
    return 'Just now'
  }

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function GroupFeed({ groupId, groupName }: GroupFeedProps) {
  const { user, userProfile, loading: authLoading } = useAuth()
  const normalizedGroupId = useMemo(() => groupId.trim(), [groupId])
  const normalizedGroupName = useMemo(() => {
    const candidate = groupName.trim()
    return candidate.length > 0 ? candidate : groupName
  }, [groupName])
  const isAuthenticated = Boolean(user)
  const {
    membership,
    loading: membershipLoading,
    error: membershipError,
  } = usePlantbookGroupMembership(normalizedGroupId, user?.uid, {
    skip: !isAuthenticated || !normalizedGroupId,
  })
  const allowGroupAccess = Boolean(membership && normalizedGroupId)

  useEffect(() => {
    console.log('🔍 GroupFeed Debug:', {
      normalizedGroupId,
      userId: user?.uid,
      membership,
      membershipLoading,
      membershipError,
      allowGroupAccess,
      isAuthenticated
    })
  }, [normalizedGroupId, user?.uid, membership, membershipLoading, membershipError, allowGroupAccess, isAuthenticated])

  const {
    posts,
    loading: feedLoading,
    error: feedError,
    refresh: refreshFeed,
    toggleLove,
    isTogglingLove,
  } = usePlantbookFeed(user?.uid, {
    limit: 25,
    groupIds: normalizedGroupId ? [normalizedGroupId] : [],
    includePublic: false,
    skip: !allowGroupAccess || !normalizedGroupId,
  })

  const [composerContent, setComposerContent] = useState('')
  const [composerError, setComposerError] = useState<string | null>(null)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<Array<{ file: File; previewUrl: string }>>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const selectedMediaRef = useRef<Array<{ file: File; previewUrl: string }>>([])
  const MAX_MEDIA_ITEMS = 6
  const profileName = useMemo(() => {
    if (userProfile?.displayName) {
      return userProfile.displayName
    }
    if (user?.displayName) {
      return user.displayName
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Garden Friend'
  }, [user?.displayName, user?.email, userProfile?.displayName])

  useEffect(() => {
    selectedMediaRef.current = selectedMedia
  }, [selectedMedia])

  useEffect(() => {
    return () => {
      selectedMediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [])

  const membershipDocIds = useMemo(() => {
    if (!user?.uid) {
      return [] as string[]
    }

    const ids = new Set<string>()
    if (normalizedGroupId) {
      ids.add(`${normalizedGroupId}_${user.uid}`)
    }
    return Array.from(ids)
  }, [normalizedGroupId, user?.uid])

  const permissionErrorDetails = useMemo(() => {
    const entries: Array<{ source: string; message: string }> = [
      { source: 'loading the circle feed', message: (feedError ?? '').trim() },
      { source: 'submitting a new post', message: (composerError ?? '').trim() },
      { source: 'confirming your membership', message: (membershipError ?? '').trim() },
    ]

    return (
      entries.find((entry) => {
        if (!entry.message) {
          return false
        }
        const lower = entry.message.toLowerCase()
        return lower.includes('permission') || lower.includes('denied') || lower.includes('insufficient')
      }) ?? null
    )
  }, [composerError, feedError, membershipError])

  const permissionNotice = useMemo(() => {
    if (!permissionErrorDetails) {
      return null
    }

    return {
      summary: `We couldn't finish ${permissionErrorDetails.source} because Firebase rejected the request. Confirm your account is listed as a member of this circle and try again.`,
      rawMessage: permissionErrorDetails.message,
      source: permissionErrorDetails.source,
    }
  }, [permissionErrorDetails])

  const handleOpenFilePicker = () => {
    if (!isSubmittingPost) {
      fileInputRef.current?.click()
    }
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setSelectedMedia((previous) => {
      const next = [...previous]

      files.forEach((file) => {
        if (!file.type.startsWith('image/')) {
          return
        }

        const duplicate = next.some(
          (item) => item.file.name === file.name && item.file.lastModified === file.lastModified
        )

        if (duplicate || next.length >= MAX_MEDIA_ITEMS) {
          return
        }

        next.push({ file, previewUrl: URL.createObjectURL(file) })
      })

      return next
    })

    event.target.value = ''
  }

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia((previous) => {
      const next = [...previous]
      const [removed] = next.splice(index, 1)
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return next
    })
  }

  const handleSubmitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      return
    }

    const trimmed = composerContent.trim()
    if (!trimmed) {
      setComposerError('Share a note or observation with your circle before posting.')
      return
    }

    setIsSubmittingPost(true)
    setComposerError(null)

    try {
      await createPlantbookPost(
        {
          authorId: user.uid,
          authorDisplayName: profileName,
          authorEmail: user.email,
          authorPhotoURL: user.photoURL || userProfile?.photoURL || null,
          content: trimmed,
          visibility: 'group',
          groupId: normalizedGroupId,
          groupName: normalizedGroupName,
        },
        selectedMedia.map((item) => item.file)
      )

      setComposerContent('')
      selectedMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setSelectedMedia([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await refreshFeed()
    } catch (error) {
      setComposerError(getPlantbookErrorMessage(error))
    } finally {
      setIsSubmittingPost(false)
    }
  }

  const renderPost = (post: PlantbookPost) => {
    const relativeTime = formatRelativeTime(post.createdAt)
    const loved = Boolean(post.viewerHasLoved)
    const lovePending = isTogglingLove(post.id)

    return (
      <article key={post.id} className="glass-card space-y-4 border border-slate-200/70 bg-white/90 p-6 shadow-inner">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{post.authorDisplayName || 'Garden Friend'}</p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{relativeTime}</p>
          </div>
        </header>
        {post.content && (
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{post.content}</p>
        )}
        {Array.isArray(post.media) && post.media.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {post.media.map((item) => (
              <figure key={item.id} className="relative h-52 overflow-hidden rounded-xl border border-slate-200">
                {item.kind === 'image' ? (
                  <Image src={item.url} alt="Circle post media" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <video controls className="h-52 w-full rounded-xl bg-black/90">
                    <source src={item.url} />
                  </video>
                )}
              </figure>
            ))}
          </div>
        )}
        <footer className="flex items-center gap-3 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => toggleLove(post.id)}
            disabled={!isAuthenticated || lovePending}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition ${
              loved ? 'border-primary-300 bg-primary-50/80 text-primary-700' : 'border-transparent hover:bg-slate-100'
            } ${lovePending ? 'opacity-70' : ''}`}
          >
            <Heart className={`h-4 w-4 ${loved ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{post.stats.loves}</span>
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-slate-400">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{post.stats.comments}</span>
          </div>
        </footer>
      </article>
    )
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <section className="glass-card space-y-5 border border-slate-200/70 bg-white/90 p-8 shadow-inner">
        <div className="flex items-center gap-3 text-slate-700">
          <PlusCircle className="h-5 w-5" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Circle feed</h2>
        </div>
        <p className="text-sm text-slate-600">
          Sign in to share updates and view conversations happening inside this circle.
        </p>
        <Link href="/login" className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold">
          Sign in to participate
        </Link>
      </section>
    )
  }

  if (membershipLoading || authLoading) {
    return (
      <section className="glass-card space-y-4 border border-slate-200/70 bg-white/90 p-8 shadow-inner">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold">Loading circle feed...</span>
        </div>
        <p className="text-sm text-slate-500">We&apos;re confirming your membership and gathering recent posts.</p>
      </section>
    )
  }

  if (!allowGroupAccess) {
    return (
      <section className="glass-card space-y-5 border border-slate-200/70 bg-white/90 p-8 shadow-inner">
        <div className="flex items-center gap-3 text-slate-700">
          <PlusCircle className="h-5 w-5" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Circle feed</h2>
        </div>
        {membershipError ? (
          <p className="text-sm text-rose-600">{membershipError}</p>
        ) : (
          <p className="text-sm text-slate-600">
            You&apos;ll see posts here once you join this circle. Ask the host for an invitation to get started.
          </p>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {permissionNotice && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <p className="font-semibold text-amber-900">Circle access blocked</p>
          <p className="mt-1">{permissionNotice.summary}</p>
          <details className="mt-3 space-y-1 rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-xs text-amber-800">
            <summary className="cursor-pointer font-semibold text-amber-900">Debug details</summary>
            {membershipDocIds.length > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-amber-900">Expected membership doc(s)</p>
                <ul className="list-disc space-y-1 pl-5">
                  {membershipDocIds.map((docId) => (
                    <li key={docId}>
                      <span className="font-mono">{`plantbookGroupMembers/${docId}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              Firebase said: <span className="font-mono">{permissionNotice.rawMessage}</span>
            </p>
            <p>
              Circle identifier: <span className="font-mono">{normalizedGroupId || '(unknown)'}</span>
            </p>
            {user?.uid && (
              <p>
                Signed-in user: <span className="font-mono">{user.uid}</span>
              </p>
            )}
          </details>
        </div>
      )}

      <div className="glass-card space-y-4 border border-slate-200/70 bg-white/95 p-8 shadow-inner">
        <header className="flex items-center gap-3 text-slate-700">
          <PlusCircle className="h-5 w-5" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Share an update</h2>
        </header>
        <form onSubmit={handleSubmitPost} className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
          <textarea
            value={composerContent}
            onChange={(event) => setComposerContent(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder={`Update circle members about your latest progress in ${normalizedGroupName}.`}
            rows={4}
            disabled={isSubmittingPost}
          />
          {selectedMedia.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedMedia.map((item, index) => (
                <div key={item.previewUrl} className="relative h-40 overflow-hidden rounded-2xl border border-slate-200">
                  <Image src={item.previewUrl} alt="Selected circle upload" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-white/90 p-1 text-slate-600 shadow"
                    aria-label="Remove image"
                  >
                    <XCircle className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {composerError && (
            <p className="text-sm font-medium text-rose-600">{composerError}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button
                type="button"
                onClick={handleOpenFilePicker}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
                disabled={isSubmittingPost || selectedMedia.length >= MAX_MEDIA_ITEMS}
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                <span>Add pictures</span>
              </button>
              {selectedMedia.length > 0 && (
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  {selectedMedia.length} of {MAX_MEDIA_ITEMS} selected
                </span>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              disabled={isSubmittingPost}
            >
              {isSubmittingPost && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{isSubmittingPost ? 'Posting...' : 'Share with circle'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-slate-700">
            <h2 className="text-lg font-semibold">Circle feed</h2>
            {feedLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          </div>
          <button
            type="button"
            onClick={() => refreshFeed()}
            disabled={feedLoading}
            className="btn-ghost text-sm font-semibold"
          >
            Refresh
          </button>
        </header>

        {feedError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {feedError}
          </div>
        )}

        {posts.length === 0 && !feedLoading && !feedError && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
            No updates yet. Start the conversation with your first post.
          </div>
        )}

        <div className="space-y-6">
          {posts.map((post) => renderPost(post))}
        </div>
      </div>
    </section>
  )
}
