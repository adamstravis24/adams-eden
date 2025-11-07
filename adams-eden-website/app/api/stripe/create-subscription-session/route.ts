import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { planType, userId, userEmail } = body;

    if (!planType || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = planType === 'annual' ? SUBSCRIPTION_PLANS.ANNUAL : SUBSCRIPTION_PLANS.MONTHLY;

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/calendar?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/calendar?subscription=canceled`,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
        planType,
      },
      subscription_data: {
        metadata: {
          userId,
          planType,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Subscription session error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription session' },
      { status: 500 }
    );
  }
}
