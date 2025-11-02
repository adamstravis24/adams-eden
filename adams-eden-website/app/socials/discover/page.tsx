"use client"

import Link from 'next/link'
import PlantbookNav from '@/components/PlantbookNav'
import { useAuth } from '@/contexts/AuthContext'

export default function PlantbookDiscoverPage() {
  const { user } = useAuth()
  const isAuthenticated = Boolean(user)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <PlantbookNav />

      <main className="py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 lg:px-10">
          <section className="glass-panel border border-primary-100/60 bg-white/90 px-10 py-12">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              Discover feed
            </span>
            <h1 className="mt-6 text-4xl font-extrabold text-slate-800 sm:text-5xl">
              Algorithmic highlights are sprouting soon.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              We&apos;re preparing a signal-boosted feed that blends trending lessons, seasonal checklists, and recommended gardeners tailored to your interests. While the seeds take root, keep sharing in your home feed and explore featured circles.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/socials" className="btn-primary px-6 py-2 text-sm font-semibold">
                Return to home feed
              </Link>
              {isAuthenticated ? (
                <Link href="/socials/groups" className="btn-ghost text-sm font-semibold">
                  Join a featured circle
                </Link>
              ) : (
                <Link href="/signup" className="btn-ghost text-sm font-semibold">
                  Create a profile
                </Link>
              )}
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-primary-100/60 bg-white/90 p-8 shadow-sm md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-800">What to expect next</h2>
              <p className="text-sm text-slate-600">
                The Discover feed will evolve over the coming weeks. Here&apos;s a peek at the signals we&apos;re curating before it ships:
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-xl bg-primary-50/60 px-4 py-3">
                <span className="font-semibold text-primary-700">Seasonal prompts</span>
                <p className="mt-1 text-slate-600">
                  Timely tasks, regional growers, and NOAA-driven climate insights to keep plots on schedule.
                </p>
              </li>
              <li className="rounded-xl bg-primary-50/60 px-4 py-3">
                <span className="font-semibold text-primary-700">Trending lessons</span>
                <p className="mt-1 text-slate-600">
                  High-signal posts surfaced from community loves, comments, and moderator picks.
                </p>
              </li>
              <li className="rounded-xl bg-primary-50/60 px-4 py-3">
                <span className="font-semibold text-primary-700">Suggested growers</span>
                <p className="mt-1 text-slate-600">
                  Meet gardeners who match your interests, zones, and active circles.
                </p>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-dashed border-primary-200/70 bg-white/80 px-8 py-10 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600/10 text-2xl">
              🌿
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-slate-800">Want to help shape Discover?</h2>
            <p className="mt-3 text-sm text-slate-600">
              Share the types of prompts or recommendations you&apos;d love to see. Drop feedback in your home feed or send the team a quick message.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/socials/messages" className="btn-primary px-6 py-2 text-sm font-semibold">
                Message the team
              </Link>
              <Link href="/socials" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">
                Back to home feed
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}