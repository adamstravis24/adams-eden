// Stripe Subscription Configuration
// Create these products in your Stripe Dashboard at https://dashboard.stripe.com/products

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    name: 'Adams Eden Premium - Monthly',
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_replace_me',
    price: 4.99,
    interval: 'month',
  },
  ANNUAL: {
    name: 'Adams Eden Premium - Annual',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID || 'price_annual_replace_me',
    price: 49.99,
    interval: 'year',
    savings: '17%', // Save $10/year
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
};
