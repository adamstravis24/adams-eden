# Plant Database Build Guide

This guide explains how to build a comprehensive 30,000+ plant database for Adams Eden from free data sources.

## Quick Start

```bash
# 1. Get a free Trefle API key (5 minutes)
# Visit: https://trefle.io and sign up

# 2. Set your API key
$env:TREFLE_API_KEY="your_key_here"

# 3. Run the builder
node scripts/buildPlantDatabase.js

# 4. Alternative: Use pre-downloaded datasets (faster, no API needed)
node scripts/buildFromBulkData.js
```

## Data Sources

### 1. **Trefle.io** (Recommended - Easiest)
- **Plants**: 400,000+ species
- **Free Tier**: 120 API requests/day
- **Data**: Scientific names, common names, images, care info, hardiness zones
- **Licensing**: Free for non-commercial use
- **Sign up**: https://trefle.io

**Pros**: Comprehensive, well-structured JSON API  
**Cons**: Rate limited (120/day = ~4-5 months to get 30k plants)

**Solution**: Use bulk download mode or combine with other sources

### 2. **USDA Plants Database** (Public Domain)
- **Plants**: 30,000+ species native to North America
- **Free**: Completely public domain, no API key needed
- **Data**: Scientific names, families, hardiness zones, native ranges
- **Download**: https://plants.usda.gov/home/downloads

**Pros**: No rate limits, public domain, authoritative  
**Cons**: Limited care info, mostly native plants, some images missing

### 3. **Open Farm** (Community)
- **Plants**: 1,000+ vegetables, herbs, fruits
- **Free**: Creative Commons licensed
- **Data**: Growing guides, companion planting, care instructions
- **API**: https://openfarm.cc/api/v1/crops

**Pros**: Excellent care information, growing guides  
**Cons**: Limited to food crops

### 4. **PlantNet** (Images)
- **Images**: Millions of plant photos
- **Free**: For research and education
- **Data**: Images only, community-identified
- **API**: https://my.plantnet.org/

**Pros**: Huge image collection  
**Cons**: Requires verification, images only

### 5. **GBIF** (Global Biodiversity)
- **Plants**: 400,000+ species
- **Free**: Public domain occurrence data
- **Data**: Scientific names, locations, observations
- **API**: https://www.gbif.org/developer/summary

**Pros**: Massive dataset, global coverage  
**Cons**: Scientific data, less care information

## Recommended Strategy

### Option A: Trefle Only (Easiest, but slow)
```bash
# Get 120 plants per day
# 30,000 plants = 250 days
# Or get multiple API keys / paid plan ($9/mo = 10k requests)

export TREFLE_API_KEY=your_key
node scripts/buildPlantDatabase.js
```

### Option B: USDA Bulk Download (Fastest)
```bash
# 1. Download USDA Complete Dataset (free)
wget https://plants.usda.gov/assets/docs/CompletePLANTSList/plantlst.txt

# 2. Download Trefle bulk data (requires email request)
# Contact: support@trefle.io

# 3. Run bulk processor
node scripts/buildFromBulkData.js
```

### Option C: Hybrid (Best Quality)
```bash
# Combine multiple sources for comprehensive data

# 1. USDA for base data (30k plants)
# 2. Trefle for images and care info (supplement)
# 3. Open Farm for food crops (supplement)
# 4. Manual curation for top 500 popular plants

node scripts/buildHybridDatabase.js
```

## Database Schema

Our standardized plant format:

```typescript
interface Plant {
  id: string;                  // Unique ID
  commonName: string;          // Primary common name
  commonNames: string[];       // Alternative names
  scientificName: string;      // Latin name
  family: string;              // Plant family
  genus: string;               // Genus
  
  thumbnail: string;           // Image URL
  images: string[];            // Additional images
  
  care: {
    watering: 'minimal' | 'moderate' | 'frequent';
    sunlight: 'full_shade' | 'partial_shade' | 'partial_sun' | 'full_sun';
    hardiness: { min: number; max: number };
    soilType: string[];
    soilPH: { min: number; max: number };
    fertilizer: string;
    spacing: string;
    depth: string;
  };
  
  type: 'annual' | 'perennial' | 'biennial';
  edible: boolean;
  edibleParts: string[];
  toxic: boolean;
  toxicTo: string[];
  
  height: { min: number; max: number; unit: string };
  spread: { min: number; max: number; unit: string };
  growthRate: 'slow' | 'moderate' | 'fast';
  
  bloomTime: string[];
  harvestTime: string[];
  daysToMaturity: number;
  
  native: string[];
  invasive: boolean;
  drought: boolean;
  deer: boolean;
  attracts: string[];
  companionPlants: string[];
  
  source: string;
  sourceId: string;
  lastUpdated: string;
}
```

## File Size Estimates

| Plants | JSON Size | With Thumbnails (URLs) | With Embedded Thumbs |
|--------|-----------|------------------------|----------------------|
| 1,000  | ~650 KB   | ~650 KB                | ~50 MB               |
| 5,000  | ~3.2 MB   | ~3.2 MB                | ~250 MB              |
| 10,000 | ~6.5 MB   | ~6.5 MB                | ~500 MB              |
| 30,000 | ~19 MB    | ~19 MB                 | ~1.5 GB              |

**Recommendation**: Use image URLs, not embedded images. Let the app download/cache as needed.

## Next Steps

After building the database:

1. **Update PlantDatabaseScreen.tsx** to use local data
2. **Remove Perenual service** dependencies
3. **Implement search/filter** on local database
4. **Add image caching** for thumbnails
5. **Test performance** with 30k+ plants

## Getting Help

- Trefle API docs: https://docs.trefle.io
- USDA download help: https://plants.usda.gov/home/downloads
- Open Farm API: https://github.com/openfarmcc/OpenFarm

## License Compliance

- **USDA Data**: Public domain (no attribution required)
- **Trefle**: Free for non-commercial use, attribution required
- **Open Farm**: Creative Commons CC-BY-SA 4.0
- **Our database**: Will include attribution for all sources

---

**Estimated Time**:
- Setup: 30 minutes
- Bulk download: 2 hours
- Processing: 1-2 hours
- **Total**: ~3-4 hours for 30,000 plants

Let's build! 🌱
