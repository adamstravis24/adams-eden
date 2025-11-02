/**
 * Clear thumbnails - use icons instead
 */

const fs = require('fs').promises;
const path = require('path');

async function clearThumbnails() {
  console.log('🧹 Clearing unreliable thumbnails...\n');
  
  const dbPath = path.join(__dirname, '..', 'assets', 'data', 'comprehensive-plant-database.json');
  const data = await fs.readFile(dbPath, 'utf8');
  const database = JSON.parse(data);
  
  for (const plant of database.plants) {
    plant.thumbnail = ''; // Clear thumbnails, let UI show icons
  }
  
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
  
  console.log(`✅ Cleared all thumbnails`);
  console.log(`📁 App will now show category icons instead`);
  console.log(`🎨 Icons: 🥕 Vegetables, 🌿 Herbs, 🌸 Flowers\n`);
}

clearThumbnails().catch(console.error);
