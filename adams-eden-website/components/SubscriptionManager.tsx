"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import toast from 'react-hot-toast'

export default function SubscriptionManager() {
  const { user } = useAuth()
  const { subscription, loading } = useSubscription()
  const [busy, setBusy] = useState(false)

  const handleCancel = async () => {
    if (!user) {
      toast.error('Please sign in')
      return
    }
    setBusy(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      toast.success('Subscription will cancel at period end')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to cancel subscription'
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()
    : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-800">Subscription</h2>
      <p className="mt-1 text-sm text-slate-600">Manage your Adams Eden Premium membership.</p>

      <div className="mt-4 grid gap-2 text-sm">
        <div><span className="text-slate-500">Status:</span> <span className="font-medium capitalize">{subscription?.status || 'none'}</span></div>
        {subscription?.planType && (
          <div><span className="text-slate-500">Plan:</span> <span className="font-medium capitalize">{subscription.planType}</span></div>
        )}
        {periodEnd && (
          <div><span className="text-slate-500">Renews / Ends:</span> <span className="font-medium">{periodEnd}</span></div>
        )}
        {subscription?.cancelAtPeriodEnd && (
          <div className="text-amber-600">Cancellation scheduled at period end.</div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleCancel}
          disabled={busy || !subscription?.subscriptionId || subscription?.cancelAtPeriodEnd}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel at period end
        </button>
      </div>
    </div>
  )
}
