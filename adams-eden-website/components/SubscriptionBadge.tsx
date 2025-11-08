"use client"

import { useSubscription } from '@/contexts/SubscriptionContext'
import { useAuth } from '@/contexts/AuthContext'

export default function SubscriptionBadge() {
  const { subscription, isPremium, loading } = useSubscription()
  const { user, loading: authLoading } = useAuth()

  // Hide while loading auth/subscription state
  if (loading || authLoading) return null

  // Only show a badge for signed-in users; for visitors, don't show anything
  if (!user) return null

  // Show Premium badge only when premium; otherwise hide (avoid confusing "Free" tag in header)
  if (!isPremium) return null

  const color = 'bg-emerald-100 text-emerald-700 border-emerald-300'
  return (
    <span className={`ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      Premium
      {subscription?.cancelAtPeriodEnd && (
        <span className="ml-2 text-[10px] text-amber-700">(cancels end of period)</span>
      )}
    </span>
  )
}
