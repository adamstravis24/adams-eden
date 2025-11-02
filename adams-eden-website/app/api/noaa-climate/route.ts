import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

const NOAA_API_URL = 'https://www.ncdc.noaa.gov/cdo-web/api/v2/data';
const NOAA_DATASET_ID = 'NORMAL_ANN';
const NOAA_DATATYPES = [
  'ANN-TMIN-PRBLST-T28FP30',  // Spring: Last frost date (28°F, 30% probability)
  'ANN-TMIN-PRBFST-T28FP30',  // Fall: First frost date (28°F, 30% probability)
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
  let springFrostDay: number | null = null;
  let winterFrostDay: number | null = null;
  let avgWinterTempF: number | null = null;

  for (const result of results) {
    const { datatype, value } = result;

    if (datatype === 'ANN-TMIN-PRBLST-T28FP30') {
      springFrostDay = Math.round(value);
    } else if (datatype === 'ANN-TMIN-PRBFST-T28FP30') {
      winterFrostDay = Math.round(value);
    } else if (datatype === 'DJF-TMIN-NORMAL') {
      avgWinterTempF = value / 10;
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
