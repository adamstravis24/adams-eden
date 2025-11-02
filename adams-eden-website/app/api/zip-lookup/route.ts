import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'

type ZipStationRecord = {
  zip: string;
  location: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  primaryStation: {
    id: string;
    name: string;
    distanceMeters: number;
  };
  alternateStations: string[];
};

let zipData: ZipStationRecord[] | null = null;
let zipIndex: Map<string, ZipStationRecord> | null = null;

function loadZipData() {
  if (zipData && zipIndex) return;

  const filePath = path.join(process.cwd(), 'public', 'zip-stations.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
  
  zipData = data.zips || data;
  zipIndex = new Map();
  
  if (Array.isArray(zipData)) {
    for (const record of zipData) {
      zipIndex.set(record.zip, record);
    }
  }
}

function normalizeZip(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.padStart(5, '0').slice(0, 5);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get('zip');

    if (!zip) {
      return NextResponse.json({ error: 'ZIP code required' }, { status: 400 });
    }

    loadZipData();

    const normalized = normalizeZip(zip);
    const record = zipIndex?.get(normalized) || null;

    if (!record) {
      return NextResponse.json({ error: 'ZIP code not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error looking up ZIP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
