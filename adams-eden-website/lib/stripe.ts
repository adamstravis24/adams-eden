import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export const formatAmountForStripe = (amount: number, currency: string): number => {
  // Stripe expects amounts in cents for USD, EUR, etc.
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
  const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toLowerCase());
  return isZeroDecimal ? amount : Math.round(amount * 100);
};
