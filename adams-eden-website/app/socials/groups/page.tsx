"use client"

import Link from 'next/link'
import { Users } from 'lucide-react'
import PlantbookNav from '@/components/PlantbookNav'
import { useAuth } from '@/contexts/AuthContext'
import { featuredGroups, upcomingGroupEvents } from '@/app/socials/data'
import { usePlantbookGroups } from '@/hooks/usePlantbookGroups'

export default function PlantbookGroupsPage() {
  const { user } = useAuth()
  const isAuthenticated = Boolean(user)
  const {
    groups,
    loading,
    error,
  } = usePlantbookGroups({ limit: 9 })

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <PlantbookNav />

      <section className="relative overflow-hidden border-b border-primary-100/60 bg-white/80">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-primary-100/60 via-primary-50/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-24 lg:px-10">
          <div className="glass-panel px-10 py-12">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              Plantbook circles
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold text-slate-800 sm:text-5xl">
              Team up with growers who focus on what you love most.
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              Organize permaculture guilds, troubleshoot hydro towers, or host neighborhood swap nights. Circles keep chat, files, and planting calendars in sync with your planner.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={isAuthenticated ? '/socials/groups/new' : '/login'}
                className="btn-primary px-8 py-3 text-sm font-semibold"
              >
                {isAuthenticated ? 'Create a group' : 'Sign in to start a group'}
              </Link>
              <Link href="/socials" className="btn-ghost text-sm font-semibold">
                Peek at the community feed
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-bold text-slate-800">Featured circles</h2>
            <Link href="/socials/friends" className="btn-ghost text-sm font-semibold">
              Invite a friend to join you
            </Link>
          </header>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {loading && (
              <>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`group-skeleton-${index}`}
                    className="glass-card h-full border border-slate-200/70 bg-white/80 p-8 shadow-inner animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 rounded bg-slate-200" />
                        <div className="h-3 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-3 w-5/6 rounded bg-slate-100" />
                      <div className="h-3 w-4/6 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {!loading && groups.length === 0 && !error && (
              <>
                {featuredGroups.map(({ name, description, members, activity, tags, icon: Icon, href }) => (
                  <article
                    key={name}
                    className="glass-card flex h-full flex-col gap-5 p-8 transition hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600/10 text-primary-700">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800">{name}</h3>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{activity}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-primary-100 px-3 py-1 font-medium text-primary-700">
                        {members}
                      </span>
                      {tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={isAuthenticated ? href : '/login'}
                      className="btn-primary mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                      {isAuthenticated ? 'Join circle' : 'Sign in to join'}
                    </Link>
                  </article>
                ))}
              </>
            )}

            {groups.map((group) => (
              <article
                key={group.id}
                className="glass-card flex h-full flex-col gap-5 p-8 transition hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600/10 text-primary-700">
                    <Users className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">{group.name}</h3>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {group.activityLabel || 'Active circle'}
                    </p>
                  </div>
                </div>
                {group.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">{group.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-primary-100 px-3 py-1 font-medium text-primary-700">
                    {new Intl.NumberFormat().format(group.memberCount)} members
                  </span>
                  {group.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                      {tag}
                    </span>
                  ))}
                  {group.isPrivate && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
                      Private
                    </span>
                  )}
                </div>
                <Link
                  href={isAuthenticated ? `/socials/groups/${group.slug || group.id}` : '/login'}
                  className="btn-primary mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                >
                  {isAuthenticated ? 'View circle' : 'Sign in to view'}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-primary-100/60 bg-white/80 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-slate-800">Upcoming gatherings</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {upcomingGroupEvents.map(({ id, title, group, schedule, host, tags }) => (
              <article
                key={id}
                className="rounded-2xl border border-primary-200/60 bg-white/90 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <p className="mt-1 text-sm font-medium text-primary-600">{group}</p>
                <p className="mt-2 text-sm text-slate-600">{schedule}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">{host}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
