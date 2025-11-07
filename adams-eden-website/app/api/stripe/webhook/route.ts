import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

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
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
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

async function updateUserSubscription(userId: string, subscriptionId: string) {
  try {
    if (!stripe) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const subscriptionData = {
      subscriptionId: subscription.id,
      status: subscription.status,
      planType: subscription.metadata.planType || 'monthly',
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: Date.now(),
    };

    // Update in Firebase
    if (adminDb) {
      await adminDb.ref(`users/${userId}/subscription`).set(subscriptionData);
    }
  } catch (error) {
    console.error('Failed to update user subscription:', error);
  }
}
