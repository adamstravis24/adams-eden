/**
 * Download plant images to local assets
 * Using public domain/free images from Wikimedia Commons
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// High-quality plant images from Wikimedia Commons (public domain)
const PLANT_IMAGES = {
  // Vegetables
  "Tomato": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Bright_red_tomato_and_cross_section02.jpg/300px-Bright_red_tomato_and_cross_section02.jpg",
  "Lettuce": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Lettuce_in_market.jpg/300px-Lettuce_in_market.jpg",
  "Cucumber": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/ARS_cucumber.jpg/300px-ARS_cucumber.jpg",
  "Bell Pepper": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Yellow_Red_Orange_Bell_Pepper_2021.jpg/300px-Yellow_Red_Orange_Bell_Pepper_2021.jpg",
  "Carrot": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vegetable-Carrot-Bundle-wStalks.jpg/300px-Vegetable-Carrot-Bundle-wStalks.jpg",
  "Zucchini": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Courgette_J1.JPG/300px-Courgette_J1.JPG",
  "Spinach": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Spinach_-_Flickr_-_magic_robot.jpg/300px-Spinach_-_Flickr_-_magic_robot.jpg",
  "Kale": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Kale-Bundle.jpg/300px-Kale-Bundle.jpg",
  "Broccoli": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Broccoli_bunches.jpg/300px-Broccoli_bunches.jpg",
  "Cauliflower": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Cauliflower.JPG/300px-Cauliflower.JPG",
  "Eggplant": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Solanum_melongena_24_08_2012_%281%29.JPG/300px-Solanum_melongena_24_08_2012_%281%29.JPG",
  "Radish": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Radishes_in_a_basket.jpg/300px-Radishes_in_a_basket.jpg",
  "Green Beans": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Green_beans_in_colander.jpg/300px-Green_beans_in_colander.jpg",
  "Peas": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Peas_in_pods_-_Studio.jpg/300px-Peas_in_pods_-_Studio.jpg",
  "Onion": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Onion_on_White.JPG/300px-Onion_on_White.JPG",
  "Garlic": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Garlic_bulbs.jpg/300px-Garlic_bulbs.jpg",
  "Potato": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/300px-Patates.jpg",
  "Sweet Potato": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ipomoea_batatas_006.JPG/300px-Ipomoea_batatas_006.JPG",
  "Beet": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Beets-Bundle.jpg/300px-Beets-Bundle.jpg",
  "Corn": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Corncobs.jpg/300px-Corncobs.jpg",
  
  // Herbs
  "Basil": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Basil-Basilico-Ocimum_basilicum-albahaca.jpg/300px-Basil-Basilico-Ocimum_basilicum-albahaca.jpg",
  "Rosemary": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Rosmarinus_officinalis266.jpg/300px-Rosmarinus_officinalis266.jpg",
  "Mint": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mint-leaves-2007.jpg/300px-Mint-leaves-2007.jpg",
  "Thyme": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Thyme_%28Thymus_vulgaris%29_flowers.jpg/300px-Thyme_%28Thymus_vulgaris%29_flowers.jpg",
  "Oregano": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Origanum_vulgare_-_harilik_pune.jpg/300px-Origanum_vulgare_-_harilik_pune.jpg",
  "Parsley": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Parsley_-_Curly.jpg/300px-Parsley_-_Curly.jpg",
  "Cilantro": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/A_scene_of_Coriander_leaves.JPG/300px-A_scene_of_Coriander_leaves.JPG",
  "Dill": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Dill_flowering.jpg/300px-Dill_flowering.jpg",
  "Chives": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Allium_schoenoprasum_with_blossom.jpg/300px-Allium_schoenoprasum_with_blossom.jpg",
  "Sage": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Salvia_officinalis0.jpg/300px-Salvia_officinalis0.jpg",
  "Lavender": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Single_lavendar_flower02.jpg/300px-Single_lavendar_flower02.jpg",
  "Chamomile": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Matricaria_February_2008-1.jpg/300px-Matricaria_February_2008-1.jpg",
  "Lemon Balm": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Melissa_officinalis_20100704_b.jpg/300px-Melissa_officinalis_20100704_b.jpg",
  "Tarragon": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Artemisia_dracunculus.jpg/300px-Artemisia_dracunculus.jpg",
  "Fennel": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Foeniculum_vulgare1.jpg/300px-Foeniculum_vulgare1.jpg",
  
  // Flowers
  "Marigold": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Tagetes_erecta_003.JPG/300px-Tagetes_erecta_003.JPG",
  "Sunflower": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sunflower_sky_backdrop.jpg/300px-Sunflower_sky_backdrop.jpg",
  "Zinnia": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Zinnia_elegans_1.jpg/300px-Zinnia_elegans_1.jpg",
  "Petunia": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Petunia_cultivars01.jpg/300px-Petunia_cultivars01.jpg",
  "Cosmos": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Cosmos_bipinnatus2.jpg/300px-Cosmos_bipinnatus2.jpg",
  "Dahlia": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dahlia_x_hybridus_Kamerun.jpg/300px-Dahlia_x_hybridus_Kamerun.jpg",
  "Rose": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Red_rose.jpg/300px-Red_rose.jpg",
  "Pansy": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Viola_tricolor_cultivar_001.JPG/300px-Viola_tricolor_cultivar_001.JPG",
  "Snapdragon": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Antirrhinum_majus_L.jpg/300px-Antirrhinum_majus_L.jpg",
  "Geranium": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Red_geranium.jpg/300px-Red_geranium.jpg",
  "Impatiens": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Impatiens_walleriana1.jpg/300px-Impatiens_walleriana1.jpg",
  "Begonia": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Begonia_odorata_1.jpg/300px-Begonia_odorata_1.jpg",
  "Nasturtium": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Tropaeolum_majus_Jewel_Mix.jpg/300px-Tropaeolum_majus_Jewel_Mix.jpg",
  "Black-eyed Susan": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Rudbeckia_hirta_2006.08.25_15.04.17-p8250039.jpg/300px-Rudbeckia_hirta_2006.08.25_15.04.17-p8250039.jpg",
  "Morning Glory": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Ipomoea_purpurea_20070730.jpg/300px-Ipomoea_purpurea_20070730.jpg"
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      const fileStream = require('fs').createWriteStream(filepath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadAllImages() {
  console.log('📥 Downloading plant images from Wikimedia Commons...\n');
  
  // Create images directory
  const imagesDir = path.join(__dirname, '..', 'assets', 'images', 'plants');
  await fs.mkdir(imagesDir, { recursive: true });
  
  let downloaded = 0;
  let failed = 0;
  
  for (const [plantName, url] of Object.entries(PLANT_IMAGES)) {
    const filename = plantName.toLowerCase().replace(/\s+/g, '-') + '.jpg';
    const filepath = path.join(imagesDir, filename);
    
    try {
      console.log(`  Downloading ${plantName}...`);
      await downloadImage(url, filepath);
      downloaded++;
    } catch (error) {
      console.error(`  ❌ Failed: ${plantName} - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n✅ Downloaded ${downloaded} plant images`);
  if (failed > 0) console.log(`⚠️  Failed: ${failed} images`);
  console.log(`📁 Location: ${imagesDir}\n`);
  
  // Now update database to use local images
  console.log('📝 Updating database with local image paths...\n');
  
  const dbPath = path.join(__dirname, '..', 'assets', 'data', 'comprehensive-plant-database.json');
  const data = await fs.readFile(dbPath, 'utf8');
  const database = JSON.parse(data);
  
  for (const plant of database.plants) {
    const filename = plant.commonName.toLowerCase().replace(/\s+/g, '-') + '.jpg';
    const localPath = path.join(imagesDir, filename);
    
    // Check if file exists
    try {
      await fs.access(localPath);
      plant.thumbnail = filename; // Just store filename, will use require() in app
    } catch {
      plant.thumbnail = ''; // File doesn't exist, use icon
    }
  }
  
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
  console.log('✅ Database updated with local image references\n');
}

downloadAllImages().catch(console.error);
