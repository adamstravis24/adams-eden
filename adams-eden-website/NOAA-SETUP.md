# NOAA Climate Data API Setup

## Get Your Free API Token

1. Go to: https://www.ncdc.noaa.gov/cdo-web/token
2. Enter your email address
3. Check your email for the token (usually arrives within minutes)

## Configure Your Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your token as a server-only environment variable in `.env.local` (for local dev) and in Vercel (for Preview/Production):
    - Local (do NOT prefix with NEXT_PUBLIC):
       ```
       NOAA_TOKEN=YourActualTokenHere
       ```
    - Vercel Dashboard → Project Settings → Environment Variables:
       - Key: `NOAA_TOKEN`
       - Value: Your token
       - Environments: Preview and Production
       - Type: Plaintext

3. Restart the development server:
   ```bash
   npm run dev
   ```

## How It Works

The calendar uses NOAA's 30-year climate normals to calculate:
- **Last Spring Frost Date**: When it's safe to plant frost-sensitive crops
- **First Fall Frost Date**: When frost-sensitive plants should be harvested
- **Average Winter Temperature**: Determines cold-hardy plant survival

### Data Used

- **Dataset**: NORMAL_ANN (Annual Normals)
- **Spring Frost (preferred)**: ANN-TMIN-PRBLST-T36FP30 (36°F, 30% probability)
- **Fall Frost (preferred)**: ANN-TMIN-PRBFST-T36FP30 (36°F, 30% probability)
- **Fallbacks (if 36°F unavailable at a station)**: T32FP30 then T28FP30
- **Winter Temp**: DJF-TMIN-NORMAL (Dec-Jan-Feb minimum)

### ZIP Code Lookup

The system includes 40,000+ US ZIP codes mapped to the nearest NOAA weather stations. Enter your ZIP code to get accurate planting dates for your specific location.

## Testing Without NOAA Token

The calendar will work for displaying plants you add, but you won't be able to:
- Look up location-based climate data
- Calculate accurate planting dates based on your frost dates

For development, you can use sample data by manually adding plants with preset months.

## Security Notes

- Keep your NOAA token server-side: use `NOAA_TOKEN` only. Do not use `NEXT_PUBLIC_NOAA_TOKEN`.
- Our API route reads `NOAA_TOKEN` on the server and proxies data to the client, so the token is never exposed in browser code.

## Features

- **Location-Based Planting Dates**: Automatically calculates when to plant based on your local frost dates
- **Add Plants**: Search and add plants from the 50-plant database
- **Visual Timeline**: See planting, growing, and harvest periods across 12 months
- **Remove Plants**: Hover over any plant card to remove it
- **Data Persistence**: Your location and schedule are saved in browser localStorage

## API Rate Limits

NOAA's free tier allows:
- 1,000 requests per day
- 5 requests per second

The app caches climate data to minimize API calls.
