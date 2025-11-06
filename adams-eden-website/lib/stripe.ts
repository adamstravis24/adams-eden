import Stripe from 'stripe';

// Only initialize Stripe if the secret key is available
// This allows the build to succeed even if env vars aren't set yet
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-04-10',
      typescript: true,
    })
  : null;

export const formatAmountForStripe = (amount: number, currency: string): number => {
  // Stripe expects amounts in cents for USD, EUR, etc.
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
  const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toLowerCase());
  return isZeroDecimal ? amount : Math.round(amount * 100);
};
