"use client"

import { ChangeEvent, FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PlantbookNav from '@/components/PlantbookNav'
import { useAuth } from '@/contexts/AuthContext'
import { createPlantbookPost, getPlantbookErrorMessage } from '@/lib/plantbook'
import type { PlantbookVisibility } from '@/types/plantbook'

export default function PlantbookCreatePostPage() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<PlantbookVisibility>('public')
  const [groupId, setGroupId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const profileName =
    userProfile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Garden Friend'

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setMediaFiles(files)
  }

  const handleRemoveFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      router.push('/login')
      return
    }

    if (!content.trim()) {
      setError('Add a few words about your update before publishing.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createPlantbookPost(
        {
          authorId: user.uid,
          authorDisplayName: profileName,
          authorEmail: user.email,
          authorPhotoURL: user.photoURL || userProfile?.photoURL || null,
          content: content.trim(),
          visibility,
          groupId: visibility === 'group' ? groupId.trim() || null : null,
          groupName: visibility === 'group' ? groupName.trim() || null : null,
        },
        mediaFiles
      )

      setSuccessMessage('Post published to Plantbook.')
      setContent('')
      setGroupId('')
      setGroupName('')
      setMediaFiles([])

      setTimeout(() => {
        router.push('/socials')
      }, 1000)
    } catch (error) {
      setError(getPlantbookErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const disableGroupFields = visibility !== 'group'

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <PlantbookNav />

      <section className="relative overflow-hidden border-b border-primary-100/60 bg-white/80">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-gradient-to-b from-primary-100/60 via-primary-50/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-12 pt-24 lg:px-10">
          <div className="glass-panel px-10 py-12">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              Share an update
            </span>
            <h1 className="mt-6 text-4xl font-extrabold text-slate-800 sm:text-5xl">
              Tell your circles what&apos;s growing
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Drop photos, lessons learned, or questions for your community. You can keep it public or post directly to a group you lead.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <form onSubmit={handleSubmit} className="glass-card space-y-6 border border-slate-200/70 bg-white/90 p-8 shadow-lg">
            {!user && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Sign in to publish a Plantbook post.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="plantbook-content" className="text-sm font-semibold text-slate-700">
                What&apos;s happening in your garden?
              </label>
              <textarea
                id="plantbook-content"
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Share a highlight, question, or win from this week..."
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="plantbook-visibility" className="text-sm font-semibold text-slate-700">
                  Visibility
                </label>
                <select
                  id="plantbook-visibility"
                  name="visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as PlantbookVisibility)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  disabled={isSubmitting}
                >
                  <option value="public">Public feed</option>
                  <option value="group">Specific group</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="plantbook-media" className="text-sm font-semibold text-slate-700">
                  Media (optional)
                </label>
                <input
                  id="plantbook-media"
                  name="media"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-700"
                  disabled={isSubmitting}
                />
                {mediaFiles.length > 0 && (
                  <ul className="space-y-2 text-xs text-slate-500">
                    {mediaFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 py-2">
                        <span className="truncate" title={file.name}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="plantbook-group-id" className="text-sm font-semibold text-slate-700">
                  Group ID (optional)
                </label>
                <input
                  id="plantbook-group-id"
                  name="groupId"
                  type="text"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Enter the group document ID"
                  disabled={isSubmitting || disableGroupFields}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="plantbook-group-name" className="text-sm font-semibold text-slate-700">
                  Group name (optional)
                </label>
                <input
                  id="plantbook-group-name"
                  name="groupName"
                  type="text"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Shown in the feed when posting to a group"
                  disabled={isSubmitting || disableGroupFields}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/socials" className="btn-ghost text-sm font-semibold">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary px-6 py-2 text-sm font-semibold"
                disabled={isSubmitting || !user}
              >
                {isSubmitting ? 'Publishing...' : 'Publish post'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
