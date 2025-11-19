import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getForecastForLatLon(lat: number, lon: number) {
  type NWSPeriod = {
    name: string
    startTime: string
    endTime: string
    isDaytime: boolean
    temperature: number
    temperatureUnit: string
    windSpeed: string
    windDirection: string
    shortForecast: string
    detailedForecast?: string
  }
  // NWS requires a descriptive User-Agent with contact info
  const headers = {
    'User-Agent': 'AdamsEdenApp/1.0 (contact: support@adamsedenbranson.com)',
    'Accept': 'application/geo+json'
  }

  const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`
  const pointsRes = await fetch(pointsUrl, { headers })
  if (!pointsRes.ok) {
    throw new Error(`NWS points error ${pointsRes.status}`)
  }
  const points = await pointsRes.json()
  const forecastUrl: string | undefined = points?.properties?.forecast
  if (!forecastUrl) throw new Error('No forecast URL from NWS points')

  const fcRes = await fetch(forecastUrl, { headers })
  if (!fcRes.ok) {
    throw new Error(`NWS forecast error ${fcRes.status}`)
  }
    const forecast = await fcRes.json()
    const periods = (forecast?.properties?.periods || []) as NWSPeriod[]
    const now = new Date()
    // Filter out past periods - include current period (where endTime is in future) and future periods
    return periods
      .filter((p) => {
        try {
          const endTime = new Date(p.endTime)
          // Include if the period hasn't ended yet (current or future)
          return endTime > now
        } catch {
          return false
        }
      })
      .map((p) => ({
        name: p.name,
        startTime: p.startTime,
        endTime: p.endTime,
        isDaytime: p.isDaytime,
        temperature: p.temperature,
        temperatureUnit: p.temperatureUnit,
        windSpeed: p.windSpeed,
        windDirection: p.windDirection,
        shortForecast: p.shortForecast,
        detailedForecast: p.detailedForecast
      }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zip = searchParams.get('zip')
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')

    let lat: number | null = null
    let lon: number | null = null

    if (latParam && lonParam) {
      lat = parseFloat(latParam)
      lon = parseFloat(lonParam)
    } else if (zip) {
      // Build an absolute URL to our own API in all environments (Vercel, dev, etc.)
      // Prefer forwarded proto/host from Vercel/Proxy, then fall back to the request URL's protocol for local dev.
      const inferredProtocol = request.nextUrl?.protocol?.replace(':', '') || new URL(request.url).protocol.replace(':', '')
      const proto = request.headers.get('x-forwarded-proto') || inferredProtocol || 'http'
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
      const origin = `${proto}://${host}`
      const zipUrl = `${origin}/api/zip-lookup?zip=${zip}`
      console.log('Forecast API: Looking up ZIP:', zip, 'via', zipUrl)
      const zipRes = await fetch(zipUrl)
      if (!zipRes.ok) {
        const errorText = await zipRes.text()
        console.error('Forecast API: ZIP lookup failed:', zipRes.status, errorText)
        return NextResponse.json({ error: 'ZIP not found', details: errorText }, { status: 404 })
      }
      const record = await zipRes.json()
      console.log('Forecast API: ZIP lookup result:', record.latitude, record.longitude, record.location)
      lat = record.latitude
      lon = record.longitude
    }

    if (lat == null || lon == null) {
      return NextResponse.json({ error: 'Provide zip or lat/lon' }, { status: 400 })
    }

    const periods = await getForecastForLatLon(lat, lon)
    console.log('Forecast API: Returning', periods.length, 'periods for lat/lon', lat, lon)
    // Return with explicit no-cache headers to ensure fresh data
    return NextResponse.json({ periods }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Forecast API error:', error)
    return NextResponse.json({ error: 'Failed to fetch forecast', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
