const https = require('https');
const fs = require('fs');
const path = require('path');

const PLANT_CALENDAR_URL = 'https://raw.githubusercontent.com/gg314/plant-calendar/main/src/PlantCalendar.elm';
const ZIP_DATA_URL = 'https://raw.githubusercontent.com/gg314/plant-calendar/main/src/WSData.elm';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed for ${url}: ${res.statusCode}`));
          res.resume();
          return;
        }
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function extractListBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Marker ${marker} not found`);
  }
  const startIndex = source.indexOf('[', markerIndex);
  if (startIndex === -1) {
    throw new Error(`List start not found after ${marker}`);
  }
  let depth = 0;
  for (let idx = startIndex; idx < source.length; idx += 1) {
    const ch = source[idx];
    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, idx + 1);
      }
    }
  }
  throw new Error(`Failed to locate matching bracket for ${marker}`);
}

function splitElmRecords(listBlock) {
  const records = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < listBlock.length; i += 1) {
    const ch = listBlock[i];
    current += ch;
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        records.push(current.trim());
        current = '';
        while (i + 1 < listBlock.length && /[\s,]/.test(listBlock[i + 1])) {
          i += 1;
        }
      }
    }
  }
  return records.filter(Boolean);
}

function parseFloatSafe(value) {
  const num = parseFloat(value);
  if (Number.isNaN(num)) {
    throw new Error(`Unable to parse float from "${value}"`);
  }
  return num;
}

function parseIntSafe(value) {
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) {
    throw new Error(`Unable to parse int from "${value}"`);
  }
  return num;
}

function parseExpression(expr) {
  const cleaned = expr.trim();
  if (cleaned === '-1000') return { valid: false };
  if (cleaned.startsWith('t0')) {
    const remainder = cleaned.slice(2).trim();
    if (!remainder) {
      return { valid: true, offset: 0, absolute: 120 };
    }
    const simple = remainder.replace(/\s+/g, '');
    const sign = simple[0];
    const magnitude = parseIntSafe(simple.slice(1));
    const offset = sign === '-' ? -magnitude : magnitude;
    return { valid: true, offset, absolute: 120 + offset };
  }
  const raw = parseIntSafe(cleaned);
  if (raw <= -900) {
    return { valid: false };
  }
  const offset = raw - 120;
  return { valid: true, offset, absolute: raw };
}

function parsePair(pairStr) {
  const [start, duration] = pairStr.split(',');
  if (!start || duration === undefined) {
    throw new Error(`Malformed pair: ${pairStr}`);
  }
  const durationValue = parseIntSafe(duration.trim());
  if (durationValue <= 0) return null;
  const parsedStart = parseExpression(start);
  if (!parsedStart.valid) return null;
  return {
    rawStart: start.trim(),
    startOffsetFromSpringFrost: parsedStart.offset,
    startDayDefault: parsedStart.absolute,
    duration: durationValue,
  };
}

function parseDefaultPeriods(periodStr) {
  const periods = [];
  const regex = /\(\(([^)]+)\),\s*\(([^)]+)\),\s*\(([^)]+)\)\)/g;
  let match;
  while ((match = regex.exec(periodStr)) !== null) {
    const [_, indoorRaw, transplantRaw, outdoorRaw] = match;
    periods.push({
      indoor: parsePair(indoorRaw),
      transplant: parsePair(transplantRaw),
      outdoor: parsePair(outdoorRaw),
    });
  }
  return periods;
}

function parsePlantRecord(recordStr) {
  const nameMatch = recordStr.match(/name\s*=\s*"([^"]+)"/);
  const categoryMatch = recordStr.match(/category\s*=\s*"([^"]+)"/);
  const minZoneMatch = recordStr.match(/minzone\s*=\s*([\d.]+)/);
  const maxZoneMatch = recordStr.match(/maxzone\s*=\s*([\d.]+)/);
  const periodsMatch = recordStr.match(/defaultPeriods\s*=\s*(\[[^\]]*\])/);

  if (!nameMatch || !categoryMatch || !minZoneMatch || !maxZoneMatch || !periodsMatch) {
    throw new Error(`Failed to parse plant record: ${recordStr.slice(0, 120)}...`);
  }

  return {
    name: nameMatch[1],
    category: categoryMatch[1],
    minZone: parseFloatSafe(minZoneMatch[1]),
    maxZone: parseFloatSafe(maxZoneMatch[1]),
    defaultPeriods: parseDefaultPeriods(periodsMatch[1]),
  };
}

function parsePlantData(source) {
  const block = extractListBlock(source, 'plantData sfday');
  const recordStrings = splitElmRecords(block);
  return recordStrings.map(parsePlantRecord);
}

function parseZipRecord(recordStr) {
  const zipMatch = recordStr.match(/zip\s*=\s*"(\d{5})"/);
  const nameMatch = recordStr.match(/name\s*=\s*"([^"]+)"/);
  const posMatch = recordStr.match(/pos\s*=\s*\(([^,]+),\s*([^\)]+)\)/);
  const elevMatch = recordStr.match(/elev\s*=\s*([^,}]+)/);
  const s1Match = recordStr.match(/s1\s*=\s*"([^"]+)"/);
  const s2Match = recordStr.match(/s2\s*=\s*"([^"]+)"/);
  const s3Match = recordStr.match(/s3\s*=\s*"([^"]+)"/);
  const s1NameMatch = recordStr.match(/s1name\s*=\s*"([^"]+)"/);
  const s1DistMatch = recordStr.match(/s1dist\s*=\s*([^,}]+)/);

  if (!zipMatch || !nameMatch || !posMatch || !elevMatch || !s1Match || !s2Match || !s3Match || !s1NameMatch || !s1DistMatch) {
    throw new Error(`Failed to parse zip record: ${recordStr.slice(0, 120)}...`);
  }

  return {
    zip: zipMatch[1],
    location: nameMatch[1],
    latitude: parseFloatSafe(posMatch[1]),
    longitude: parseFloatSafe(posMatch[2]),
    elevationMeters: parseFloatSafe(elevMatch[1]),
    primaryStation: {
      id: s1Match[1],
      name: s1NameMatch[1],
      distanceMeters: parseFloatSafe(s1DistMatch[1]),
    },
    alternateStations: [s2Match[1], s3Match[1]],
  };
}

function parseZipData(source) {
  const block = extractListBlock(source, 'allData =');
  const records = splitElmRecords(block);
  return records.map(parseZipRecord);
}

async function main() {
  console.log('Fetching Elm source files...');
  const [plantSource, zipSource] = await Promise.all([
    fetchText(PLANT_CALENDAR_URL),
    fetchText(ZIP_DATA_URL),
  ]);

  console.log('Parsing plant data...');
  const plants = parsePlantData(plantSource);
  console.log(`Parsed ${plants.length} plants.`);

  console.log('Parsing ZIP/station data...');
  const zipRecords = parseZipData(zipSource);
  console.log(`Parsed ${zipRecords.length} ZIP records.`);

  const outputDir = path.resolve(__dirname, '../assets/data');
  fs.mkdirSync(outputDir, { recursive: true });

  const plantOutput = {
    source: PLANT_CALENDAR_URL,
    license: 'GPL-3.0-or-later',
    generatedAt: new Date().toISOString(),
    plantCount: plants.length,
    plants,
  };
  fs.writeFileSync(path.join(outputDir, 'plant-data.json'), JSON.stringify(plantOutput, null, 2));

  const zipOutput = {
    source: ZIP_DATA_URL,
    license: 'GPL-3.0-or-later',
    generatedAt: new Date().toISOString(),
    recordCount: zipRecords.length,
    zips: zipRecords,
  };
  fs.writeFileSync(path.join(outputDir, 'zip-stations.json'), JSON.stringify(zipOutput, null, 2));

  console.log('Extraction completed. Files written to assets/data/.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});