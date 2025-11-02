"use client"

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import PlantbookNav from '@/components/PlantbookNav'
import { useAuth } from '@/contexts/AuthContext'
import { createPlantbookGroup, getPlantbookErrorMessage, uploadPlantbookGroupCover } from '@/lib/plantbook'

export default function PlantbookCreateGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [rawError, setRawError] = useState<unknown>(null)

  useEffect(() => {
    if (!coverImageFile) {
      setCoverImagePreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(coverImageFile)
    setCoverImagePreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [coverImageFile])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      router.push('/login')
      return
    }

    if (!name.trim()) {
      setError('Give your group a name to get started.')
      return
    }

    setIsSubmitting(true)
    setError(null)
  setRawError(null)

    if (coverImageFile && !coverImageFile.type.startsWith('image/')) {
      setError('Cover image must be an image file (jpeg, png, gif, etc.).')
      setIsSubmitting(false)
      return
    }

    try {
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      let uploadedCoverImageUrl: string | undefined

      if (coverImageFile) {
        uploadedCoverImageUrl = await uploadPlantbookGroupCover(user.uid, coverImageFile)
      }

      const group = await createPlantbookGroup(user.uid, {
        name: name.trim(),
        description: description.trim() || undefined,
        tags,
        isPrivate,
        featured: isFeatured,
        coverImageUrl: uploadedCoverImageUrl,
      })

      setSuccessMessage('Circle created successfully.')
      setCoverImageFile(null)
      setTimeout(() => {
        router.push(`/socials/groups/${group.slug || group.id}`)
      }, 1000)
    } catch (error) {
      console.error('Failed to create Plantbook circle', error)
      setError(getPlantbookErrorMessage(error))
      setRawError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formattedRawError = useMemo(() => {
    if (!rawError) {
      return null
    }

    try {
      return JSON.stringify(rawError, null, 2)
    } catch (error) {
      console.warn('Failed to stringify Plantbook error', error)
      return String(rawError)
    }
  }, [rawError])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <PlantbookNav />

      <section className="relative overflow-hidden border-b border-primary-100/60 bg-white/80">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-gradient-to-b from-primary-100/60 via-primary-50/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-12 pt-24 lg:px-10">
          <div className="glass-panel px-10 py-12">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              Launch a new circle
            </span>
            <h1 className="mt-6 text-4xl font-extrabold text-slate-800 sm:text-5xl">
              Gather growers around a shared mission
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Set the tone, define your focus, and invite gardeners who will thrive in your community space. You can adjust privacy and featured status anytime.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <form onSubmit={handleSubmit} className="glass-card space-y-6 border border-slate-200/70 bg-white/90 p-8 shadow-lg">
            {!user && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Sign in to create a Plantbook circle.
              </div>
            )}

            {error && (
              <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <p>{error}</p>
                {formattedRawError && (
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-rose-200 bg-white/70 p-3 text-xs text-rose-600">
                    {formattedRawError}
                  </pre>
                )}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="plantbook-group-name" className="text-sm font-semibold text-slate-700">
                Circle name
              </label>
              <input
                id="plantbook-group-name"
                name="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Pollinator Crew, Soil Builders Guild, etc."
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="plantbook-group-description" className="text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="plantbook-group-description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Share what you explore together, how often you meet, and who should join."
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="plantbook-group-tags" className="text-sm font-semibold text-slate-700">
                  Tags (comma separated)
                </label>
                <input
                  id="plantbook-group-tags"
                  name="tags"
                  type="text"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="permaculture, zone 6a, hydroponics"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="plantbook-group-cover" className="text-sm font-semibold text-slate-700">
                  Cover image (optional)
                </label>
                <input
                  id="plantbook-group-cover"
                  name="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setCoverImageFile(file)
                    event.target.value = ''
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  disabled={isSubmitting}
                />
                {coverImagePreview && (
                  <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200">
                    <Image
                      src={coverImagePreview}
                      alt="Selected cover preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImageFile(null)}
                      className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  disabled={isSubmitting}
                />
                Private circle (invite only)
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  disabled={isSubmitting}
                />
                Feature on the Plantbook home page
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/socials/groups" className="btn-ghost text-sm font-semibold">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary px-6 py-2 text-sm font-semibold"
                disabled={isSubmitting || !user}
              >
                {isSubmitting ? 'Creating...' : 'Create circle'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
