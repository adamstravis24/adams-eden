# Stripe Subscription Setup Guide

## Step 1: Create Subscription Products in Stripe Dashboard

### 1. Go to Stripe Dashboard
Visit: https://dashboard.stripe.com/test/products

### 2. Create Monthly Subscription Product
1. Click **"+ Add product"**
2. Fill in details:
   - **Name:** Adams Eden Premium (Monthly)
   - **Description:** Access to Calendar, Tracker, Journal, Planner, and Premium Analytics
   - **Pricing model:** Recurring
   - **Price:** $4.99
   - **Billing period:** Monthly
   - **Currency:** USD
3. Click **"Save product"**
4. **COPY THE PRICE ID** (starts with `price_...`) - you'll need this!

### 3. Create Annual Subscription Product
1. Click **"+ Add product"**
2. Fill in details:
   - **Name:** Adams Eden Premium (Annual)
   - **Description:** Access to Calendar, Tracker, Journal, Planner, and Premium Analytics - Save 17%!
   - **Pricing model:** Recurring
   - **Price:** $49.99
   - **Billing period:** Yearly
   - **Currency:** USD
3. Click **"Save product"**
4. **COPY THE PRICE ID** (starts with `price_...`) - you'll need this!

## Step 2: Update Environment Variables

### Website (.env.local)
Update your `adams-eden-website/.env.local` file:

```env
# Stripe Keys (already have these)
STRIPE_SECRET_KEY=sk_test_... # Your secret key from Stripe dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your publishable key

# Replace these with actual Price IDs from Step 1
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx  # Monthly price ID
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx   # Annual price ID

# Stripe Webhook Secret (get this in Step 3)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Firebase Admin (get this in Step 4)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

## Step 3: Set Up Stripe Webhook

### 1. Go to Webhooks
Visit: https://dashboard.stripe.com/test/webhooks

### 2. Add Endpoint
1. Click **"+ Add endpoint"**
2. **Endpoint URL:** 
   - Local testing: Use ngrok or Stripe CLI
   - Production: `https://your-domain.com/api/stripe/webhook`
3. **Events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Click **"Add endpoint"**
5. **COPY THE SIGNING SECRET** (starts with `whsec_...`)

### 3. Test Webhook Locally (Optional)
Using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Step 4: Set Up Firebase Admin SDK

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com

### 2. Generate Service Account Key
1. Select your project
2. Go to **Project Settings** (gear icon) → **Service accounts**
3. Click **"Generate new private key"**
4. Click **"Generate key"** - downloads JSON file
5. **Open the JSON file** and copy entire contents
6. Stringify it (remove newlines) and add to `.env.local`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"adams-eden-app",...}
   ```

### 3. Get Database URL
1. In Firebase Console, go to **Realtime Database**
2. Copy the database URL (e.g., `https://adams-eden-app-default-rtdb.firebaseio.com`)
3. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://adams-eden-app-default-rtdb.firebaseio.com
   ```

## Step 5: Deploy to Vercel

### 1. Add Environment Variables to Vercel
Visit: https://vercel.com/your-project/settings/environment-variables

Add all the variables from your `.env.local`:
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`

### 2. Redeploy
Push to GitHub - Vercel will automatically redeploy with new variables.

## Step 6: Test Subscription Flow

### 1. Test Card Numbers
Use Stripe test cards: https://stripe.com/docs/testing

**Successful payment:**
- `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

**Payment requires authentication:**
- `4000 0025 0000 3155`

**Declined card:**
- `4000 0000 0000 9995`

### 2. Test Flow
1. Go to a premium feature (Calendar, Tracker, Journal, or Planner)
2. Click **"Upgrade to Premium"**
3. Select Monthly or Annual plan
4. Enter test card details
5. Complete payment
6. Verify you're redirected back
7. Check Firebase Realtime Database for subscription data at:
   ```
   users/{uid}/subscription/
   ```

### 3. Verify Features
- Premium features should now be accessible
- Check subscription status in Stripe Dashboard
- Test cancellation flow

## Troubleshooting

### Webhook not receiving events?
- Check endpoint URL is correct
- Verify webhook secret in environment variables
- Check Vercel logs for errors
- Test locally with Stripe CLI first

### Subscription not showing in Firebase?
- Check webhook is firing (view in Stripe Dashboard)
- Check Vercel function logs
- Verify Firebase Admin SDK credentials
- Check database security rules allow server writes

### Payment succeeds but no access?
- Check SubscriptionContext is loading data
- Verify user ID matches between Stripe metadata and Firebase
- Check browser console for errors

## Production Checklist

Before going live:
- [ ] Switch to live Stripe API keys
- [ ] Create products with live price IDs
- [ ] Update webhook to use live mode
- [ ] Add production domain to Stripe allowed domains
- [ ] Test with real (small amount) payment
- [ ] Set up Stripe billing portal for self-service management
- [ ] Configure email receipts in Stripe
- [ ] Set up subscription lifecycle emails (welcome, renewal, cancellation)

## Current Implementation
## Current Implementation

You have your Stripe test keys already configured in `.env.local`.

You just need to:
1. Create the two products (monthly + annual)
2. Get the price IDs
3. Update environment variables
4. Set up webhook
5. Add Firebase Admin credentials
6. Test!
