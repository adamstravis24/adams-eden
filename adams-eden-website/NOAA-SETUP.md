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

2. Edit `.env.local` and replace `your_token_here` with your actual NOAA token:
   ```
   NEXT_PUBLIC_NOAA_TOKEN=YourActualTokenHere
   ```

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
- **Spring Frost**: ANN-TMIN-PRBLST-T28FP30 (28°F, 30% probability)
- **Fall Frost**: ANN-TMIN-PRBFST-T28FP30 (28°F, 30% probability)
- **Winter Temp**: DJF-TMIN-NORMAL (Dec-Jan-Feb minimum)

### ZIP Code Lookup

The system includes 40,000+ US ZIP codes mapped to the nearest NOAA weather stations. Enter your ZIP code to get accurate planting dates for your specific location.

## Testing Without NOAA Token

The calendar will work for displaying plants you add, but you won't be able to:
- Look up location-based climate data
- Calculate accurate planting dates based on your frost dates

For development, you can use sample data by manually adding plants with preset months.

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
