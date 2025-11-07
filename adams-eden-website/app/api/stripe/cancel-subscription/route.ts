export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import admin from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token)
    const uid = decoded.uid

  // No immediate cancellation; always schedule at period end
  await req.json().catch(() => ({}))

    // Load subscription ID from RTDB
    const db = (await import('@/lib/firebase-admin')).adminDb
    if (!db) {
      return NextResponse.json({ error: 'Admin DB unavailable' }, { status: 500 })
    }
    const snap = await db.ref(`users/${uid}/subscription`).get()
    const sub = snap.val()
    const subscriptionId: string | undefined = sub?.subscriptionId

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Cancel at period end only
    const result = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    // Optimistic write (webhook will make source-of-truth update)
    await db.ref(`users/${uid}/subscription`).update({
      status: result.status,
      cancelAtPeriodEnd: result.cancel_at_period_end,
      currentPeriodEnd: result.current_period_end,
      updatedAt: Date.now(),
    })

    return NextResponse.json({
      ok: true,
      status: result.status,
      cancelAtPeriodEnd: result.cancel_at_period_end,
      currentPeriodEnd: result.current_period_end,
    })
  } catch (err: unknown) {
    console.error('Cancel subscription error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
