/**
 * Generate emoji mappings for each plant based on their characteristics
 * These emojis will be used as fallback icons or alongside images
 */

const fs = require('fs').promises;
const path = require('path');

// Carefully selected emojis that best represent each plant
const PLANT_EMOJIS = {
  // Vegetables - Using realistic food emojis
  'tomato': '🍅',
  'lettuce': '🥬',
  'cucumber': '🥒',
  'bell-pepper': '🫑',
  'carrot': '🥕',
  'zucchini': '🥒',
  'spinach': '🥬',
  'kale': '🥬',
  'broccoli': '🥦',
  'cauliflower': '🥦',
  'eggplant': '🍆',
  'radish': '🌱',
  'green-beans': '🫘',
  'peas': '🫛',
  'onion': '🧅',
  'garlic': '🧄',
  'potato': '🥔',
  'sweet-potato': '🍠',
  'beet': '🌱',
  'corn': '🌽',
  
  // Herbs - Using herb/leaf emojis
  'basil': '🌿',
  'rosemary': '🌿',
  'mint': '🌿',
  'thyme': '🌿',
  'oregano': '🌿',
  'parsley': '🌿',
  'cilantro': '🌿',
  'dill': '🌿',
  'chives': '🌿',
  'sage': '🌿',
  'lavender': '💜',
  'chamomile': '🌼',
  'lemon-balm': '🌿',
  'tarragon': '🌿',
  'fennel': '🌿',
  
  // Flowers - Using diverse, colorful flower emojis
  'marigold': '🌼',        // Yellow daisy-like
  'sunflower': '🌻',       // Big yellow sunflower
  'zinnia': '🌺',          // Tropical bright flower
  'petunia': '🌸',         // Delicate pink blossom
  'cosmos': '�️',          // Rosette flower
  'dahlia': '🌺',          // Large tropical flower
  'rose': '🌹',            // Classic red rose
  'pansy': '🪷',           // Lotus/pansy shape
  'snapdragon': '💐',      // Bouquet for tall spikes
  'geranium': '🌺',        // Bright tropical
  'impatiens': '🌸',       // Delicate pink
  'begonia': '�',         // Tulip shape
  'nasturtium': '🧡',      // Orange heart for orange flowers
  'black-eyed-susan': '🌼', // Yellow daisy
  'morning-glory': '🪻'    // Purple hyacinth for trumpet shape
};

async function addEmojisToDatabase() {
  console.log('🎨 Adding emoji representations to plant database...\n');
  
  const dbPath = path.join(__dirname, '..', 'assets', 'data', 'comprehensive-plant-database.json');
  const data = await fs.readFile(dbPath, 'utf8');
  const database = JSON.parse(data);
  
  let updated = 0;
  for (const plant of database.plants) {
    const plantKey = plant.commonName.toLowerCase().replace(/\s+/g, '-');
    if (PLANT_EMOJIS[plantKey]) {
      plant.emoji = PLANT_EMOJIS[plantKey];
      updated++;
      console.log(`  ${PLANT_EMOJIS[plantKey]} ${plant.commonName}`);
    }
  }
  
  // Update database version
  database.version = '2.2.0';
  
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
  
  console.log(`\n✅ Added emojis to ${updated} plants`);
  console.log(`📁 Database updated: ${dbPath}\n`);
  console.log('💡 You can now use plant.emoji in the UI!');
}

addEmojisToDatabase().catch(console.error);
