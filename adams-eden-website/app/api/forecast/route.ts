import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getForecastForLatLon(lat: number, lon: number) {
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
  const periods = forecast?.properties?.periods || []
  return periods.map((p: any) => ({
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
      const resp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/zip-lookup?zip=${zip}`)
      // Fallback to relative if NEXT_PUBLIC_SITE_URL not set
      const zipRes = resp.ok ? resp : await fetch(`/api/zip-lookup?zip=${zip}`)
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
