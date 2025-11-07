export const runtime = 'nodejs';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
      console.log('Event type:', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed');
      console.error('Error:', err instanceof Error ? err.message : err);
      console.error('Webhook secret exists:', !!webhookSecret);
      console.error('Webhook secret length:', webhookSecret?.length);
      console.error('Signature exists:', !!signature);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          const userId = session.client_reference_id || session.metadata?.userId;
          const subscriptionId = session.subscription as string;
          
          if (userId) {
            await updateUserSubscription(userId, subscriptionId);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (userId) {
          await updateUserSubscription(userId, subscription.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        const customerId = invoice.customer as string | null;
        // We don't get userId directly here; rely on subscription metadata on fetch
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = sub.metadata.userId;
            if (userId) {
              await updateUserSubscription(userId, subscriptionId);
            }
          } catch (e) {
            console.warn('Unable to refresh subscription on payment_succeeded:', { subscriptionId, customerId }, e);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          // Optionally notify user of failed payment
          console.log('Payment failed for subscription:', subscriptionId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

function derivePlanType(s: Stripe.Subscription): 'monthly' | 'annual' {
  const priceId = s.items.data[0]?.price?.id;
  const monthlyId = SUBSCRIPTION_PLANS.MONTHLY.priceId;
  const annualId = SUBSCRIPTION_PLANS.ANNUAL.priceId;
  if (priceId && monthlyId && priceId === monthlyId) return 'monthly';
  if (priceId && annualId && priceId === annualId) return 'annual';
  return (s.metadata.planType as 'monthly' | 'annual') || 'monthly';
}

async function updateUserSubscription(userId: string, subscriptionId: string) {
  try {
    if (!stripe) {
      console.error('Stripe not initialized');
      return;
    }

    console.log('Updating subscription for user:', userId);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const planType = derivePlanType(subscription);
    const priceId = subscription.items.data[0]?.price?.id || null;
    const subscriptionData = {
      subscriptionId: subscription.id,
      status: subscription.status,
      planType,
      priceId,
      customerId: (subscription.customer as string) || null,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAt: subscription.cancel_at || null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at || null,
      endedAt: subscription.ended_at || null,
      updatedAt: Date.now(),
    } as const;

    console.log('Subscription data:', subscriptionData);

    // Update in Firebase
    if (adminDb) {
      console.log('Writing to Firebase at path:', `users/${userId}/subscription`);
      await adminDb.ref(`users/${userId}/subscription`).set(subscriptionData);
      console.log('Successfully wrote to Firebase');
    } else {
      console.error('adminDb is not initialized');
    }
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
  }
}
