/**
 * Update database to reference local image filenames
 */

const fs = require('fs').promises;
const path = require('path');

async function updateDatabaseWithLocalImages() {
  console.log('📝 Updating database with local image references...\n');
  
  const dbPath = path.join(__dirname, '..', 'assets', 'data', 'comprehensive-plant-database.json');
  const data = await fs.readFile(dbPath, 'utf8');
  const database = JSON.parse(data);
  
  for (const plant of database.plants) {
    // Generate filename from plant name
    const filename = plant.commonName.toLowerCase().replace(/\s+/g, '-') + '.jpg';
    plant.thumbnail = filename;
  }
  
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
  
  console.log('✅ Database updated with local image filenames');
  console.log('\n📋 Required images (place in assets/images/plants/):');
  console.log('\nVegetables:');
  database.plants
    .filter(p => p.category === 'Vegetables')
    .forEach(p => console.log(`  - ${p.thumbnail}`));
  
  console.log('\nHerbs:');
  database.plants
    .filter(p => p.category === 'Herbs')
    .forEach(p => console.log(`  - ${p.thumbnail}`));
  
  console.log('\nFlowers:');
  database.plants
    .filter(p => p.category === 'Flowers')
    .forEach(p => console.log(`  - ${p.thumbnail}`));
  
  console.log('\n💡 Download these images and save them to assets/images/plants/');
  console.log('   The app will show icons for any missing images.\n');
}

updateDatabaseWithLocalImages().catch(console.error);
