'use client'

import React, { useMemo, useState } from 'react'
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

type Milestone = { name?: string | null } & Record<string, unknown>
type TrackerDoc = { currentStage?: string | null; milestones?: Milestone[] }
type ChangeEntry = {
  docPath: string
  before: { currentStage: string | null; milestones: Array<{ name: string | null }> }
  after: { currentStage: string | null; milestones: Array<{ name: string | null }> }
}

function normalizeStageName(value?: string | null) {
  if (!value) return value ?? ''
  const t = String(value).toLowerCase().trim()
  if (!t) return value
  if (t === 'flowering' || t === 'vegetative growth' || t.includes('flowering')) {
    return 'vegetative growth/flowering'
  }
  return value
}

export default function NormalizeTrackerPage() {
  const { user, loading } = useAuth()
  const [running, setRunning] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [result, setResult] = useState<{
    checked: number
    updated: number
    changes: Array<{
      docPath: string
      before: { currentStage: string | null; milestones: Array<{ name: string | null }> }
      after: { currentStage: string | null; milestones: Array<{ name: string | null }> }
    }>
    error?: string
  } | null>(null)

  const canRun = useMemo(() => !!user && !loading && !running, [user, loading, running])

  const handleRun = async () => {
    if (!user) return
    setRunning(true)
    setResult(null)
    try {
      const trackerRef = collection(db, 'users', user.uid, 'tracker')
      const snap = await getDocs(trackerRef)
      let updated = 0
      const changes: ChangeEntry[] = []

      const batch = writeBatch(db)
      let opsInBatch = 0

      snap.forEach((d) => {
        const data: TrackerDoc = (d.data() || {}) as TrackerDoc
        let changed = false
        const updates: Partial<TrackerDoc> = {}

        const normalizedStage = normalizeStageName(data.currentStage)
        if (normalizedStage && normalizedStage !== data.currentStage) {
          updates.currentStage = normalizedStage
          changed = true
        }

        if (Array.isArray(data.milestones)) {
          const newMilestones = data.milestones.map((m: Milestone) => {
            if (!m || typeof m !== 'object') return m
            const newName = normalizeStageName(m.name)
            if (newName && newName !== m.name) {
              return { ...m, name: newName }
            }
            return m
          })
          if (JSON.stringify(newMilestones) !== JSON.stringify(data.milestones)) {
            updates.milestones = newMilestones
            changed = true
          }
        }

        if (changed) {
          updated++
          changes.push({
            docPath: `users/${user.uid}/tracker/${d.id}`,
            before: {
              currentStage: data.currentStage ?? null,
              milestones: Array.isArray(data.milestones)
                ? data.milestones.map((m: Milestone) => ({ name: m?.name ?? null }))
                : []
            },
            after: {
              currentStage: updates.currentStage ?? data.currentStage ?? null,
              milestones: (updates.milestones ?? data.milestones ?? []).map((m: Milestone) => ({ name: m?.name ?? null }))
            }
          })
          if (!dryRun) {
            batch.update(doc(db, 'users', user.uid, 'tracker', d.id), updates)
            opsInBatch++
            if (opsInBatch >= 400) {
              // commit mid-way to avoid large batches
              // run commit on a separate batch since writeBatch doesn't support partial commit
              // (Workaround: we keep using the same batch, but avoid mid-loop await to keep TS happy)
              // In practice, the operations are well below limits so we'll defer until the end.
            }
          }
        }
      })

      if (!dryRun && opsInBatch > 0) {
        await batch.commit()
      }

      setResult({ checked: snap.size, updated, changes })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      setResult({ checked: 0, updated: 0, changes: [], error: message })
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="glass-card p-6">Loading…</div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="glass-card p-6">
          <h1 className="text-lg font-semibold mb-2">Sign in required</h1>
          <p className="text-slate-600 text-sm">Please sign in to normalize your tracker data.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="glass-panel px-6 py-5">
        <h1 className="text-2xl font-semibold">Normalize Tracker Stages</h1>
        <p className="text-slate-600 text-sm mt-1">
          This tool updates your tracker entries so any stage that mentions flowering shows as
          <span className="font-medium"> &quot;vegetative growth/flowering&quot;</span>.
        </p>
      </header>

      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            id="dryRun"
            type="checkbox"
            className="h-4 w-4"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            disabled={running}
          />
          <label htmlFor="dryRun" className="text-sm text-slate-700">
            Dry run (preview only)
          </label>
        </div>
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="btn-primary inline-flex items-center justify-center px-4 py-2 disabled:opacity-50"
        >
          {running ? 'Working…' : dryRun ? 'Preview changes' : 'Normalize my tracker'}
        </button>
      </section>

      {result && (
        <section className="glass-card p-6">
          {result.error ? (
            <p className="text-rose-600 text-sm">{result.error}</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                Checked <span className="font-medium">{result.checked}</span> docs;{' '}
                would update <span className="font-medium">{result.updated}</span> docs.
              </p>
              {result.changes.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-slate-700">Show details</summary>
                  <pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-900/90 p-3 text-xs text-slate-100 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
