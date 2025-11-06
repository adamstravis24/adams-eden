import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { getCart } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, customerInfo } = body;

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    // Get cart from Shopify
    const cart = await getCart(cartId);

    if (!cart || cart.totalQuantity === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Convert Shopify cart to Stripe line items
    const lineItems = cart.lines.map((line) => ({
      price_data: {
        currency: line.cost.totalAmount.currencyCode.toLowerCase(),
        product_data: {
          name: line.merchandise.product.title,
          description: line.merchandise.title !== 'Default Title' 
            ? line.merchandise.title 
            : undefined,
          images: line.merchandise.product.featuredImage
            ? [line.merchandise.product.featuredImage.url]
            : undefined,
        },
        unit_amount: formatAmountForStripe(
          Number(line.cost.totalAmount.amount) / line.quantity,
          line.cost.totalAmount.currencyCode
        ),
      },
      quantity: line.quantity,
    }));

    // Add shipping as a line item
    const shippingCost = customerInfo?.shippingMethod === 'express' ? 15 : 5;
    const shippingName = customerInfo?.shippingMethod === 'express' 
      ? 'Express Shipping (2-3 days)' 
      : 'Standard Shipping (5-7 days)';
    
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: shippingName,
          description: undefined,
          images: undefined,
        },
        unit_amount: formatAmountForStripe(shippingCost, 'usd'),
      },
      quantity: 1,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/cancel`,
      customer_email: customerInfo?.email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: {
        cartId,
        shopifyCheckoutUrl: cart.checkoutUrl,
      },
      payment_method_types: ['card'],
      billing_address_collection: 'required',
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
