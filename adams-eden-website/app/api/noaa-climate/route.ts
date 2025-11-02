import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

const NOAA_API_URL = 'https://www.ncdc.noaa.gov/cdo-web/api/v2/data';
const NOAA_DATASET_ID = 'NORMAL_ANN';
// We prefer a safer (warmer) frost threshold of 36°F at 30% probability.
// To maximize coverage across stations, we request multiple thresholds and
// pick the best available in order: 36°F -> 32°F -> 28°F.
const NOAA_DATATYPES = [
  // Preferred threshold (light frost): 36°F @ 30% probability
  'ANN-TMIN-PRBLST-T36FP30',  // Spring: Last frost date (36°F, 30%)
  'ANN-TMIN-PRBFST-T36FP30',  // Fall: First frost date (36°F, 30%)
  // Fallback thresholds
  'ANN-TMIN-PRBLST-T32FP30',  // Spring: Last frost date (32°F, 30%)
  'ANN-TMIN-PRBFST-T32FP30',  // Fall: First frost date (32°F, 30%)
  'ANN-TMIN-PRBLST-T28FP30',  // Spring: Last frost date (28°F, 30%)
  'ANN-TMIN-PRBFST-T28FP30',  // Fall: First frost date (28°F, 30%)
  // Winter normal minimum temperature (for informational context)
  'DJF-TMIN-NORMAL',          // Winter: Dec-Jan-Feb minimum temp normal
];

type NoaaApiResult = {
  station: string;
  datatype: string;
  value: number;
};

function getApiToken(): string {
  // Server-only variables. Avoid reading any NEXT_PUBLIC_* to prevent accidental exposure.
  const token = process.env.NOAA_TOKEN || process.env.NOAA_API_TOKEN;
  
  if (!token) {
    throw new Error('NOAA API token not found. Set NOAA_TOKEN (server-only) in the environment.');
  }
  
  return token;
}

function parseResults(results: NoaaApiResult[]) {
  // Collect candidates by threshold (°F) so we can prefer 36°F over 32°F over 28°F
  const springCandidates: Record<number, number | undefined> = {};
  const fallCandidates: Record<number, number | undefined> = {};
  let avgWinterTempF: number | null = null;

  for (const result of results) {
    const { datatype, value } = result;

    if (datatype.startsWith('ANN-TMIN-PRBLST-') || datatype.startsWith('ANN-TMIN-PRBFST-')) {
      const m = datatype.match(/T(\d+)F/);
      const thresholdF = m ? parseInt(m[1], 10) : undefined;
      if (thresholdF && Number.isFinite(thresholdF)) {
        const dayOfYear = Math.round(value);
        if (datatype.startsWith('ANN-TMIN-PRBLST-')) {
          springCandidates[thresholdF] = dayOfYear;
        } else if (datatype.startsWith('ANN-TMIN-PRBFST-')) {
          fallCandidates[thresholdF] = dayOfYear;
        }
      }
    } else if (datatype === 'DJF-TMIN-NORMAL') {
      // NOAA normals temps are in tenths of a degree C or F depending on dataset; for NORMALS they are tenths of °F
      avgWinterTempF = value / 10;
    }
  }

  // Prefer 36°F, then 32°F, then 28°F
  const preference = [36, 32, 28];
  let springFrostDay: number | null = null;
  let winterFrostDay: number | null = null;

  for (const t of preference) {
    if (springCandidates[t] !== undefined) {
      springFrostDay = springCandidates[t]!;
      break;
    }
  }
  for (const t of preference) {
    if (fallCandidates[t] !== undefined) {
      winterFrostDay = fallCandidates[t]!;
      break;
    }
  }

  return { springFrostDay, winterFrostDay, avgWinterTempF };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationsParam = searchParams.get('stations');

    if (!stationsParam) {
      return NextResponse.json({ error: 'Stations parameter required' }, { status: 400 });
    }

    const stations = stationsParam.split(',');
    
    const params = new URLSearchParams({
      datasetid: NOAA_DATASET_ID,
      startdate: '2010-01-01',
      enddate: '2010-01-01',
      limit: '1000',
    });

    NOAA_DATATYPES.forEach(datatype => {
      params.append('datatypeid', datatype);
    });

    stations.forEach(stationId => {
      params.append('stationid', stationId);
    });

    const url = `${NOAA_API_URL}?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        token: getApiToken(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NOAA API error:', response.status, errorText);
      return NextResponse.json(
        { error: `NOAA API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const results = data.results || [];
    const parsed = parseResults(results);

    return NextResponse.json({
      ...parsed,
      usedStations: stations,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching NOAA data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
