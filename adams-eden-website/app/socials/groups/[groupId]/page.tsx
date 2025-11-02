import { cache } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Timestamp } from 'firebase/firestore'
import { ArrowLeft, Users, Sparkles, Lock, CalendarDays } from 'lucide-react'
import PlantbookNav from '@/components/PlantbookNav'
import SiteFooter from '@/components/SiteFooter'
import { fetchPlantbookGroup, fetchPlantbookGroups } from '@/lib/plantbook'
import GroupMembershipPanel from './GroupMembershipPanel'
import GroupFeed from './GroupFeed'

export const revalidate = 60
export const dynamic = 'auto'

const getGroup = cache(async (identifier: string) => {
  return fetchPlantbookGroup(identifier)
})

type GroupPageParams = {
  groupId: string
}

type GroupPageProps = {
  params: GroupPageParams
}

function toDate(value: Date | Timestamp | null) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (value instanceof Timestamp) {
    return value.toDate()
  }

  return null
}

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const identifier = decodeURIComponent(params.groupId)
  const group = await getGroup(identifier)

  if (!group) {
    return {
      title: 'Circle not found | Plantbook',
      description: 'We could not locate that Plantbook circle.',
    }
  }

  return {
    title: `${group.name} | Plantbook circle`,
    description: group.description || 'Explore this Plantbook circle to connect with growers who share your focus.',
  }
}

export default async function PlantbookGroupDetailPage({ params }: GroupPageProps) {
  const identifier = decodeURIComponent(params.groupId)
  const group = await getGroup(identifier)

  if (!group) {
    notFound()
  }

  const createdAtDate = toDate(group.createdAt ?? null)
  const formattedCreatedAt = createdAtDate
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(createdAtDate)
    : null
  const formattedMemberCount = new Intl.NumberFormat().format(group.memberCount ?? 0)

  const relatedCandidates = await fetchPlantbookGroups({ limit: 6 })
  const relatedGroups = relatedCandidates.filter((item) => item.id !== group.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <PlantbookNav />

      <section className="relative overflow-hidden border-b border-primary-100/60 bg-white/80">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-gradient-to-b from-primary-100/60 via-primary-50/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-24 lg:px-10">
          <div className="glass-panel px-8 py-10">
            <Link href="/socials/groups" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 transition hover:text-primary-700">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to circles
            </Link>

            <div className="mt-6 flex flex-col gap-10 lg:flex-row lg:items-start">
              <div className="flex-1 space-y-5">
                <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
                  Plantbook circle
                </span>
                <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">{group.name}</h1>
                {group.description && (
                  <p className="max-w-3xl text-base text-slate-600 sm:text-lg">{group.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  <span className="rounded-full bg-primary-50 px-4 py-2 text-primary-700">
                    <Users className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    {formattedMemberCount} members
                  </span>
                  {formattedCreatedAt && (
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-600">
                      <CalendarDays className="mr-2 inline h-4 w-4" aria-hidden="true" />
                      Created {formattedCreatedAt}
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-600">
                    <Lock className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    {group.isPrivate ? 'Private circle' : 'Open circle'}
                  </span>
                  {group.featured && (
                    <span className="rounded-full bg-amber-100 px-4 py-2 text-amber-700">
                      <Sparkles className="mr-2 inline h-4 w-4" aria-hidden="true" />
                      Featured circle
                    </span>
                  )}
                </div>
              </div>

              {group.coverImageUrl ? (
                <div className="relative h-48 w-full overflow-hidden rounded-3xl border border-white/60 bg-white/50 shadow-lg ring-1 ring-primary-100/80 lg:h-56 lg:max-w-sm">
                  <Image
                    src={group.coverImageUrl}
                    alt={`${group.name} cover image`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-48 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-primary-200 bg-primary-50/40 text-center text-sm font-semibold text-primary-600 lg:h-56 lg:max-w-sm">
                  <p>No cover image uploaded yet.</p>
                  <p className="mt-1 text-xs font-medium text-primary-500">Add one to give the circle some personality.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <GroupFeed groupId={group.id} groupName={group.name} groupSlug={group.slug ?? null} />
            <section className="glass-card space-y-5 border border-slate-200/70 bg-white/90 p-8 shadow-inner">
              <h2 className="text-2xl font-bold text-slate-800">About this circle</h2>
              <p className="text-sm leading-relaxed text-slate-600">
                {group.description || 'The circle organizer has not added a description yet. Check back soon for details about their focus, meeting rhythm, and membership guidelines.'}
              </p>

              {group.activityLabel && (
                <div className="rounded-2xl border border-primary-200/80 bg-primary-50/60 px-4 py-3 text-sm font-semibold text-primary-700">
                  Latest activity: {group.activityLabel}
                </div>
              )}

              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  {group.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 uppercase tracking-[0.25em]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-card space-y-5 border border-slate-200/70 bg-white/90 p-8 shadow-inner">
              <h2 className="text-2xl font-bold text-slate-800">What comes next</h2>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>• Circle hosts can add discussion prompts, resource files, and meeting schedules here.</li>
                <li>• Members will see a dedicated feed for posts, comments, and shared media.</li>
                <li>• Moderator tools for approving new members and pinning announcements arrive soon.</li>
              </ul>
            </section>
          </div>

          <div className="space-y-8">
            <GroupMembershipPanel groupId={group.id} groupName={group.name} isPrivate={group.isPrivate ?? false} />

            <aside className="glass-card space-y-4 border border-slate-200/70 bg-white/90 p-6 shadow-inner">
              <h3 className="text-lg font-semibold text-slate-800">Circle details</h3>
              <dl className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <dt className="font-medium">Privacy</dt>
                  <dd>{group.isPrivate ? 'Invite only' : 'Open to requests'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium">Members</dt>
                  <dd>{formattedMemberCount}</dd>
                </div>
                {formattedCreatedAt && (
                  <div className="flex items-center justify-between">
                    <dt className="font-medium">Created</dt>
                    <dd>{formattedCreatedAt}</dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>
        </div>

        <section className="mt-16">
          <header className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Other circles to explore</h2>
            <Link href="/socials/groups" className="btn-ghost text-sm font-semibold">
              Browse all circles
            </Link>
          </header>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {relatedGroups.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                We&apos;ll showcase similar circles once more communities go live.
              </div>
            )}

            {relatedGroups.map((related) => (
              <article key={related.id} className="glass-card flex h-full flex-col gap-5 border border-slate-200/70 bg-white/90 p-6 shadow-inner transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/10 text-primary-700">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{related.name}</h3>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {related.activityLabel || 'Active circle'}
                    </p>
                  </div>
                </div>
                {related.description && (
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{related.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-primary-100 px-3 py-1 font-medium text-primary-700">
                    {new Intl.NumberFormat().format(related.memberCount)} members
                  </span>
                  {related.tags?.slice(0, 2).map((tag) => (
                    <span key={`${related.id}-${tag}`} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/socials/groups/${related.slug || related.id}`}
                  className="btn-primary mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                >
                  View circle
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
