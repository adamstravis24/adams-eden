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
  return periods.map((p) => ({
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
      const zipRes = await fetch(zipUrl)
      if (!zipRes.ok) return NextResponse.json({ error: 'ZIP not found' }, { status: 404 })
      const record = await zipRes.json()
      lat = record.latitude
      lon = record.longitude
    }

    if (lat == null || lon == null) {
      return NextResponse.json({ error: 'Provide zip or lat/lon' }, { status: 400 })
    }

    const periods = await getForecastForLatLon(lat, lon)
    return NextResponse.json({ periods })
  } catch (error) {
    console.error('Forecast API error:', error)
    return NextResponse.json({ error: 'Failed to fetch forecast' }, { status: 500 })
  }
}
