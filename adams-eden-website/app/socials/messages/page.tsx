"use client"

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PlantbookNav from '@/components/PlantbookNav'
import { useAuth } from '@/contexts/AuthContext'
import { friendHighlights, conversationPreviews } from '@/app/socials/data'

function PlantbookMessagesInner() {
  const { user } = useAuth()
  const isAuthenticated = Boolean(user)
  const searchParams = useSearchParams()
  const showEmptyState = searchParams?.get('empty') === '1'
  const hasConversations = !showEmptyState && conversationPreviews.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <PlantbookNav />

      <section className="relative overflow-hidden border-b border-primary-100/60 bg-white/80">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-primary-100/60 via-primary-50/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-24 lg:px-10">
          <div className="glass-panel px-10 py-12">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              Plantbook messages
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold text-slate-800 sm:text-5xl">
              Keep conversations, plans, and inspiration in one thread.
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              Drop photos, voice notes, and crop updates without leaving Plantbook. DMs and group huddles plug into your planner so next steps never slip.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={isAuthenticated ? '/socials/messages/new' : '/login'}
                className="btn-primary px-8 py-3 text-sm font-semibold"
              >
                {isAuthenticated ? 'Compose a message' : 'Sign in to message friends'}
              </Link>
              <Link href="/socials/friends" className="btn-ghost text-sm font-semibold">
                Manage friends
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-bold text-slate-800">Inbox</h2>
            <Link
              href={isAuthenticated ? '/socials/messages/new' : '/login'}
              className="btn-primary px-5 py-2 text-sm font-semibold"
            >
              {isAuthenticated ? 'Start a new message' : 'Sign in to start' }
            </Link>
          </div>

          {hasConversations ? (
            <div className="mt-8 grid gap-4">
              {conversationPreviews.map(({ id, title, participants, lastMessageSnippet, lastMessageAt, unreadCount, href }) => (
                <article
                  key={id}
                  className="flex flex-col gap-3 rounded-2xl border border-primary-100/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-primary-500/80">{participants}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{lastMessageAt}</span>
                  </div>
                  <p className="text-sm text-slate-600">{lastMessageSnippet}</p>
                  <div className="flex items-center justify-between">
                    <Link
                      href={isAuthenticated ? href : '/login'}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
                    >
                      Open thread
                      <span aria-hidden="true">→</span>
                    </Link>
                    {unreadCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        {unreadCount} new
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Up to date</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-primary-200/60 bg-white/80 px-10 py-16 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-600/10 text-3xl">💌</span>
              <div className="space-y-3 max-w-md">
                <h3 className="text-2xl font-semibold text-slate-800">Your inbox is wide open</h3>
                <p className="text-sm text-slate-600">
                  Start a DM to swap plant updates or spin up a group huddle to plan the next build day. Invite friends from circles or send a link to anyone with an Adams Eden account.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={isAuthenticated ? '/socials/messages/new' : '/login'}
                  className="btn-primary px-6 py-2 text-sm font-semibold"
                >
                  {isAuthenticated ? 'Compose message' : 'Sign in to compose'}
                </Link>
                <Link href="/socials/friends" className="btn-ghost text-sm font-semibold">
                  Find gardeners to chat with
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-primary-100/60 bg-white/80 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="glass-card px-8 py-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Friends you chatted with recently</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Quick launch into active conversations or queue up your next check-in.
                </p>
              </div>
              <div className="space-y-4">
                {friendHighlights.slice(0, 3).map(({ id, name, initials, gradient, headline, isOnline }) => (
                  <article key={id} className="flex items-center gap-4 rounded-2xl border border-primary-200/60 bg-white/90 p-5 shadow-sm">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-semibold uppercase text-white`}>
                      {initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{name}</p>
                      <p className="text-xs text-slate-500">{headline}</p>
                    </div>
                    <span
                      className={`ml-auto inline-flex h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      aria-hidden="true"
                    />
                    <Link
                      href={isAuthenticated ? `/socials/messages?to=${id}` : '/login'}
                      className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
                    >
                      {isOnline ? 'Reply →' : 'Leave a note →'}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function PlantbookMessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center">Loading…</div>}>
      <PlantbookMessagesInner />
    </Suspense>
  )
}
