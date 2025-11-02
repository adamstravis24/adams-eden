'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, LogIn, Loader2, UserPlus, UserMinus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlantbookGroupMembership } from '@/hooks/usePlantbookGroupMembership'
import { joinPlantbookGroup, leavePlantbookGroup } from '@/lib/plantbook'

interface GroupMembershipPanelProps {
  groupId: string
  groupName: string
  isPrivate: boolean
}

export default function GroupMembershipPanel({ groupId, groupName, isPrivate }: GroupMembershipPanelProps) {
  const { user, loading: authLoading } = useAuth()
  const { membership, loading: membershipLoading, refresh } = usePlantbookGroupMembership(
    groupId,
    user?.uid,
    { skip: !user }
  )
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoinGroup = async () => {
    if (!user) return

    setIsJoining(true)
    setError(null)

    try {
      await joinPlantbookGroup(groupId, user.uid)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join circle')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!user) return
    if (!confirm('Are you sure you want to leave this circle?')) return

    setIsJoining(true)
    setError(null)

    try {
      await leavePlantbookGroup(groupId, user.uid)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave circle')
    } finally {
      setIsJoining(false)
    }
  }

  if (authLoading || membershipLoading) {
    return (
      <aside className="glass-card space-y-4 border border-slate-200/70 bg-white/90 p-6 shadow-inner">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold">Checking membership...</span>
        </div>
        <p className="text-sm text-slate-500">
          Hang tight while we confirm your Plantbook status.
        </p>
      </aside>
    )
  }

  if (!user) {
    return (
      <aside className="glass-card space-y-5 border border-slate-200/70 bg-white/90 p-6 shadow-inner">
        <div className="flex items-center gap-3 text-slate-700">
          <LogIn className="h-5 w-5" aria-hidden="true" />
          <h3 className="text-base font-semibold">Ready to join {groupName}?</h3>
        </div>
        <p className="text-sm text-slate-600">
          Sign in to request membership and follow updates from this circle.
        </p>
        <Link href="/login" className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold">
          Sign in to join
        </Link>
      </aside>
    )
  }

  // User is already a member
  if (membership) {
    return (
      <aside className="glass-card space-y-5 border border-slate-200/70 bg-white/90 p-6 shadow-inner">
        <div className="flex items-center gap-3 text-slate-700">
          <Users className="h-5 w-5" aria-hidden="true" />
          <h3 className="text-base font-semibold">You&apos;re a member</h3>
        </div>
        <p className="text-sm text-slate-600">
          You joined this circle as a <span className="font-semibold">{membership.role}</span>.
        </p>
        {error && (
          <p className="text-sm font-medium text-rose-600">{error}</p>
        )}
        <button
          type="button"
          onClick={handleLeaveGroup}
          disabled={isJoining || membership.role === 'owner'}
          className="btn-ghost inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          {isJoining && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          <UserMinus className="h-4 w-4" aria-hidden="true" />
          <span>{membership.role === 'owner' ? 'Owner cannot leave' : 'Leave circle'}</span>
        </button>
      </aside>
    )
  }

  // User can join public group or request to join private group
  return (
    <aside className="glass-card space-y-5 border border-slate-200/70 bg-white/90 p-6 shadow-inner">
      <div className="flex items-center gap-3 text-slate-700">
        <Users className="h-5 w-5" aria-hidden="true" />
        <h3 className="text-base font-semibold">
          {isPrivate ? 'Request to join' : 'Join this circle'}
        </h3>
      </div>
      <p className="text-sm text-slate-600">
        {isPrivate
          ? 'This is a private circle. Your request will be reviewed by the circle owner.'
          : 'This is a public circle. Join instantly to start participating in the feed.'}
      </p>
      {error && (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      )}
      <button
        type="button"
        onClick={handleJoinGroup}
        disabled={isJoining || isPrivate}
        className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {isJoining && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        <span>{isPrivate ? 'Request access (coming soon)' : isJoining ? 'Joining...' : 'Join circle'}</span>
      </button>
    </aside>
  )
}
