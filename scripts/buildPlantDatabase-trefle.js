/**
 * Quick Plant Database Builder
 * 
 * Uses Trefle.io API to build a comprehensive database.
 * Alternative approach: download in chunks over time, or use bulk export.
 * 
 * For 30,000 plants:
 * - Free tier: 120 requests/day = 250 days
 * - Paid tier ($9/mo): 10,000 requests = 3 months
 * - Bulk export: Contact support@trefle.io (instant!)
 */

const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  // Get your free API key at: https://trefle.io
  apiKey: process.env.TREFLE_API_KEY || 'YOUR_API_KEY_HERE',
  baseUrl: 'https://trefle.io/api/v1',
  outputDir: path.join(__dirname, '../assets/data'),
  tempDir: path.join(__dirname, '../temp-plant-data'),
  
  // How many plants to fetch
  targetCount: 30000,
  
  // Free tier limit per day
  dailyLimit: 120,
  
  // Delay between requests (ms)
  requestDelay: 1000,
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60');
        console.log(`  Rate limited. Waiting ${retryAfter} seconds...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`  Request failed, retrying... (${i + 1}/${retries})`);
      await sleep(2000);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeWatering(value) {
  if (!value) return '';
  const v = String(value).toLowerCase();
  if (v.includes('frequent') || v.includes('lot')) return 'frequent';
  if (v.includes('average') || v.includes('moderate')) return 'moderate';
  if (v.includes('minimal') || v.includes('little') || v.includes('low')) return 'minimal';
  return value;
}

function normalizeSunlight(lights) {
  if (!Array.isArray(lights) || lights.length === 0) return '';
  const light = lights[0].toLowerCase();
  if (light.includes('full sun')) return 'full_sun';
  if (light.includes('full shade')) return 'full_shade';
  if (light.includes('part')) return 'partial_shade';
  return lights[0];
}

function convertPlant(trefleData) {
  const main = trefleData.main_species || trefleData;
  
  return {
    id: `plant_${trefleData.id}`,
    commonName: trefleData.common_name || '',
    commonNames: [trefleData.common_name].filter(Boolean),
    scientificName: trefleData.scientific_name || '',
    family: trefleData.family || main.family || '',
    genus: trefleData.genus || main.genus || '',
    
    thumbnail: trefleData.image_url || '',
    images: [trefleData.image_url].filter(Boolean),
    
    care: {
      watering: normalizeWatering(main.growth?.watering),
      sunlight: normalizeSunlight(main.growth?.light || []),
      hardiness: {
        min: main.growth?.minimum_temperature?.deg_c || null,
        max: main.growth?.maximum_temperature?.deg_c || null,
      },
      soilType: Array.isArray(main.growth?.soil) ? main.growth.soil : [],
      soilPH: {
        min: main.growth?.minimum_ph || null,
        max: main.growth?.maximum_ph || null,
      },
      fertilizer: '',
      spacing: '',
      depth: '',
    },
    
    type: main.duration || '',
    edible: main.edible || false,
    edibleParts: Array.isArray(main.edible_part) ? main.edible_part : [],
    toxic: main.specifications?.toxicity !== 'none',
    toxicTo: [],
    
    height: {
      min: main.specifications?.average_height?.cm || null,
      max: main.specifications?.maximum_height?.cm || null,
      unit: 'cm'
    },
    spread: {
      min: null,
      max: null,
      unit: 'cm'
    },
    growthRate: main.specifications?.growth_rate || '',
    
    bloomTime: Array.isArray(main.flower?.bloom_months) ? main.flower.bloom_months : [],
    harvestTime: [],
    daysToMaturity: null,
    
    native: [],
    invasive: false,
    drought: main.growth?.drought_tolerant || false,
    deer: false,
    attracts: [],
    companionPlants: [],
    
    source: 'trefle',
    sourceId: String(trefleData.id),
    lastUpdated: new Date().toISOString()
  };
}

async function buildDatabase() {
  console.log('🌱 Adams Eden Plant Database Builder\n');
  
  if (!CONFIG.apiKey || CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
    console.log('❌ No Trefle API key found!\n');
    console.log('📝 To get started:');
    console.log('   1. Sign up at https://trefle.io (free)');
    console.log('   2. Get your API key from the dashboard');
    console.log('   3. Set environment variable:');
    console.log('      $env:TREFLE_API_KEY="your_key_here"');
    console.log('   4. Run this script again\n');
    console.log('💡 Alternative: Request bulk export from support@trefle.io');
    console.log('   (instant access to 400k+ plants)\n');
    return;
  }
  
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  await fs.mkdir(CONFIG.tempDir, { recursive: true });
  
  const plants = [];
  let page = 1;
  let requestCount = 0;
  
  console.log(`Target: ${CONFIG.targetCount} plants`);
  console.log(`Daily limit: ${CONFIG.dailyLimit} requests\n`);
  console.log('Starting download...\n');
  
  while (plants.length < CONFIG.targetCount) {
    try {
      const url = `${CONFIG.baseUrl}/plants?token=${CONFIG.apiKey}&page=${page}`;
      const response = await fetchWithRetry(url);
      
      if (!response.data || response.data.length === 0) {
        console.log('\n✓ Reached end of database');
        break;
      }
      
      const converted = response.data.map(convertPlant);
      plants.push(...converted);
      requestCount++;
      
      console.log(`Page ${page}: +${response.data.length} plants (total: ${plants.length}, requests: ${requestCount})`);
      
      // Check daily limit
      if (requestCount >= CONFIG.dailyLimit) {
        console.log(`\n⏸️  Reached daily limit (${CONFIG.dailyLimit} requests)`);
        console.log(`   Plants collected: ${plants.length}`);
        console.log(`   Saving progress...\n`);
        
        await saveProgress(plants, requestCount);
        
        console.log('💡 Options:');
        console.log('   - Wait 24 hours and run again (free)');
        console.log('   - Upgrade to paid plan for more requests');
        console.log('   - Request bulk export from Trefle');
        console.log('   - Use current database as-is\n');
        break;
      }
      
      // Save progress every 10 pages
      if (page % 10 === 0) {
        await saveProgress(plants, requestCount);
      }
      
      page++;
      await sleep(CONFIG.requestDelay);
      
    } catch (error) {
      console.error(`\n❌ Error on page ${page}:`, error.message);
      console.log('Saving progress before exit...\n');
      await saveProgress(plants, requestCount);
      break;
    }
  }
  
  // Final save
  await saveFinalDatabase(plants);
}

async function saveProgress(plants, requestCount) {
  const progressFile = path.join(CONFIG.tempDir, 'progress.json');
  const data = {
    plants,
    requestCount,
    lastPage: Math.ceil(plants.length / 30),
    savedAt: new Date().toISOString(),
  };
  
  await fs.writeFile(progressFile, JSON.stringify(data, null, 2));
  console.log(`   Progress saved: ${progressFile}`);
}

async function saveFinalDatabase(plants) {
  // Sort alphabetically
  plants.sort((a, b) => {
    const nameA = (a.commonName || a.scientificName).toLowerCase();
    const nameB = (b.commonName || b.scientificName).toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  const database = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    plantCount: plants.length,
    sources: ['trefle'],
    license: 'Data from Trefle.io',
    attribution: 'Plant data provided by Trefle.io',
    plants
  };
  
  const outputPath = path.join(CONFIG.outputDir, 'comprehensive-plant-database.json');
  await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
  
  const stats = await fs.stat(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log('\n✅ Database Build Complete!\n');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Plants: ${plants.length}`);
  console.log(`💾 Size: ${sizeMB} MB`);
  console.log(`\n🎉 Your app now has ${plants.length} plants with ZERO rate limits!\n`);
}

buildDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
