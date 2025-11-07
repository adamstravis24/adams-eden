"use client"

import { useSubscription } from '@/contexts/SubscriptionContext'

export default function SubscriptionBadge() {
  const { subscription, isPremium, loading } = useSubscription()
  if (loading) return null
  const text = isPremium ? 'Premium' : 'Free'
  const color = isPremium ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
  return (
    <span className={`ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {text}
      {subscription?.cancelAtPeriodEnd && (
        <span className="ml-2 text-[10px] text-amber-700">(cancels end of period)</span>
      )}
    </span>
  )
}
