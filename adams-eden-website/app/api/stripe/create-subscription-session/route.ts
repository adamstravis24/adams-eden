import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe Secret Key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Stripe instance:', !!stripe);
    
    if (!stripe) {
      console.error('Stripe is not configured. STRIPE_SECRET_KEY missing.');
      return NextResponse.json(
        { error: 'Stripe is not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { planType, userId, userEmail } = body;

    console.log('Creating subscription for:', { planType, userId, userEmail });

    if (!planType || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = planType === 'annual' ? SUBSCRIPTION_PLANS.ANNUAL : SUBSCRIPTION_PLANS.MONTHLY;

    console.log('Plan details:', { priceId: plan.priceId, price: plan.price });

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

    console.log('Stripe session created:', session.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Subscription session error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to create subscription session', details: errorMessage },
      { status: 500 }
    );
  }
}
