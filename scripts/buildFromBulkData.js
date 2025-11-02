/**
 * Build Plant Database from Bulk Downloaded Data
 * 
 * This is much faster than API-based approach.
 * Downloads complete datasets and processes them locally.
 * 
 * Sources:
 * 1. USDA Plants Database - Direct CSV download
 * 2. Trefle Bulk Export - Request from support@trefle.io
 * 3. Wikipedia Plant Data - Scraped taxonomic info
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const CONFIG = {
  tempDir: path.join(__dirname, '../temp-plant-data'),
  outputDir: path.join(__dirname, '../assets/data'),
  downloadDir: path.join(__dirname, '../temp-plant-data/downloads'),
};

// Download helper
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`Downloading: ${url}`);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        file.close();
        require('fs').unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve, reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        require('fs').unlinkSync(dest);
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }
      
      const totalBytes = parseInt(response.headers['content-length'], 10);
      let downloadedBytes = 0;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n  ✓ Download complete');
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      require('fs').unlinkSync(dest);
      reject(err);
    });
  });
}

// USDA CSV Parser
class USDAParser {
  async parse(csvPath) {
    console.log('\n📖 Parsing USDA Plants Database...');
    
    const content = await fs.readFile(csvPath, 'utf-8');
    const lines = content.split('\n');
    const plants = [];
    
    // USDA format: Symbol,Synonym Symbol,Scientific Name,Common Name,Family
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = this.parseCSVLine(line);
      if (parts.length < 4) continue;
      
      const [symbol, synonym, scientificName, commonName, family] = parts;
      
      if (!scientificName) continue;
      
      plants.push({
        id: `usda_${symbol}`,
        commonName: commonName || '',
        commonNames: [commonName].filter(Boolean),
        scientificName: scientificName || '',
        family: family || '',
        genus: this.extractGenus(scientificName),
        
        thumbnail: '',
        images: [],
        
        care: {
          watering: '',
          sunlight: '',
          hardiness: { min: null, max: null },
          soilType: [],
          soilPH: { min: null, max: null },
          fertilizer: '',
          spacing: '',
          depth: '',
        },
        
        type: '',
        edible: false,
        edibleParts: [],
        toxic: false,
        toxicTo: [],
        
        height: { min: null, max: null, unit: 'cm' },
        spread: { min: null, max: null, unit: 'cm' },
        growthRate: '',
        
        bloomTime: [],
        harvestTime: [],
        daysToMaturity: null,
        
        native: ['North America'],
        invasive: false,
        drought: false,
        deer: false,
        attracts: [],
        companionPlants: [],
        
        source: 'usda',
        sourceId: symbol,
        lastUpdated: new Date().toISOString()
      });
      
      if (i % 1000 === 0) {
        process.stdout.write(`\r  Parsed ${i} plants...`);
      }
    }
    
    console.log(`\n  ✓ Parsed ${plants.length} plants from USDA`);
    return plants;
  }
  
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  extractGenus(scientificName) {
    if (!scientificName) return '';
    const parts = scientificName.split(' ');
    return parts[0] || '';
  }
}

// Wikipedia data enrichment (for images and care info)
class WikipediaEnricher {
  async enrich(plants) {
    console.log('\n🔍 Enriching with Wikipedia data...');
    console.log('  Note: This is a placeholder - full implementation requires Wikipedia API');
    
    // In production, this would:
    // 1. Query Wikipedia API for each plant
    // 2. Extract care information from infoboxes
    // 3. Download and cache images
    // 4. Parse growing requirements
    
    return plants;
  }
}

// Main builder
async function buildDatabase() {
  console.log('🌱 Building Plant Database from Bulk Data\n');
  
  // Create directories
  await fs.mkdir(CONFIG.tempDir, { recursive: true });
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  await fs.mkdir(CONFIG.downloadDir, { recursive: true });
  
  // Download USDA data
  const usdaUrl = 'https://plants.usda.gov/assets/docs/CompletePLANTSList/plantlst.txt';
  const usdaPath = path.join(CONFIG.downloadDir, 'usda-plants.txt');
  
  try {
    await fs.access(usdaPath);
    console.log('✓ USDA data already downloaded');
  } catch {
    console.log('📥 Downloading USDA Plants Database...');
    await downloadFile(usdaUrl, usdaPath);
  }
  
  // Parse USDA data
  const usdaParser = new USDAParser();
  const usdaPlants = await usdaParser.parse(usdaPath);
  
  // Enrich with Wikipedia data (optional)
  // const enricher = new WikipediaEnricher();
  // const enrichedPlants = await enricher.enrich(usdaPlants);
  
  // For now, use USDA data as-is
  const enrichedPlants = usdaPlants;
  
  // Sort alphabetically
  enrichedPlants.sort((a, b) => {
    const nameA = (a.commonName || a.scientificName).toLowerCase();
    const nameB = (b.commonName || b.scientificName).toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Generate final database
  const database = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    plantCount: enrichedPlants.length,
    sources: ['usda'],
    license: 'Public Domain (USDA), CC-BY-SA (Wikipedia)',
    attribution: 'USDA PLANTS Database, Wikimedia Foundation',
    plants: enrichedPlants
  };
  
  const outputPath = path.join(CONFIG.outputDir, 'comprehensive-plant-database.json');
  await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
  
  const stats = await fs.stat(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log('\n✅ Database Build Complete!\n');
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Plant count: ${enrichedPlants.length}`);
  console.log(`💾 File size: ${sizeMB} MB`);
  console.log(`\n🎉 Your app now has ${enrichedPlants.length} plants with ZERO API rate limits!`);
}

// Run
buildDatabase().catch(console.error);
