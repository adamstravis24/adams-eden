// Stripe Subscription Configuration
// Create these products in your Stripe Dashboard at https://dashboard.stripe.com/products

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    name: 'Adams Eden Premium - Monthly',
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_replace_me',
    price: 5.99,
    interval: 'month',
  },
  ANNUAL: {
    name: 'Adams Eden Premium - Annual',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID || 'price_annual_replace_me',
    price: 49.99,
    interval: 'year',
    savings: '31%', // Save $22.89/year
  },
} as const;

export const PREMIUM_FEATURES = [
  'Plant Care Calendar',
  'Growth Tracker',
  'Garden Journal',
  'Garden Planner',
  'Advanced Analytics',
  'Unlimited Plants',
  'Priority Support',
] as const;

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';

export type UserSubscription = {
  status: SubscriptionStatus;
  subscriptionId?: string;
  planType?: 'monthly' | 'annual';
  currentPeriodEnd?: number; // Unix timestamp
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: number; // Unix timestamp
  priceId?: string;
  customerId?: string;
  cancelAt?: number | null; // When Stripe will cancel (if set)
  canceledAt?: number | null; // When it was actually canceled
  endedAt?: number | null; // When it ended (Stripe end timestamp)
  updatedAt?: number; // When we last synced from webhook
};
