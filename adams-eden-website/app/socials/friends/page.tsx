"use client"

import Link from 'next/link'
import PlantbookNav from '@/components/PlantbookNav'
import { useAuth } from '@/contexts/AuthContext'
import { friendHighlights, featuredGroups } from '@/app/socials/data'

export default function PlantbookFriendsPage() {
  const { user } = useAuth()
  const isAuthenticated = Boolean(user)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <PlantbookNav />

      <section className="relative overflow-hidden border-b border-primary-100/60 bg-white/80">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-primary-100/60 via-primary-50/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-24 lg:px-10">
          <div className="glass-panel px-10 py-12">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              Plantbook friends
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold text-slate-800 sm:text-5xl">
              Keep your garden circle close and your inspiration closer.
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              Add gardeners you meet in circles, share private updates, and spin up collaborative plans. Friend lists power quick check-ins and smart recommendations across Plantbook.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={isAuthenticated ? '/socials/friends/new' : '/signup'}
                className="btn-primary px-8 py-3 text-sm font-semibold"
              >
                {isAuthenticated ? 'Add a friend' : 'Create your profile to add friends'}
              </Link>
              <Link href="/socials/messages" className="btn-ghost text-sm font-semibold">
                Jump to inbox
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-bold text-slate-800">Active this week</h2>
            <Link href="/socials/groups" className="btn-ghost text-sm font-semibold">
              See which circles they host
            </Link>
          </header>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {friendHighlights.map(({ id, name, initials, gradient, zone, specialty, headline, mutualGroups, currentProject, isOnline }) => (
              <article
                key={id}
                className="glass-card flex flex-col gap-4 p-6"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-base font-semibold uppercase text-white`}>
                    {initials}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{name}</h3>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {zone} • {specialty}
                    </p>
                  </div>
                  <span className={`ml-auto inline-flex h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-600">{headline}</p>
                <div className="rounded-lg bg-primary-50/60 p-4 text-sm text-primary-700">
                  <p className="font-semibold">Current project</p>
                  <p className="mt-2 text-primary-600">{currentProject}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>🤝 {mutualGroups} mutual circles</span>
                  <Link
                    href={isAuthenticated ? `/socials/messages?to=${id}` : '/login'}
                    className="text-primary-600 transition hover:text-primary-700"
                  >
                    {isOnline ? 'Say hi →' : 'Schedule a check-in →'}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-primary-100/60 bg-white/80 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-slate-800">Suggested circles to join together</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {featuredGroups.slice(0, 2).map(({ name, description, href }) => (
              <article key={name} className="rounded-2xl border border-primary-200/60 bg-white/90 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800">{name}</h3>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
                <Link
                  href={isAuthenticated ? href : '/login'}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
                >
                  {isAuthenticated ? 'Join with a friend →' : 'Sign in to join together →'}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
