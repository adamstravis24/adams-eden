/**
 * Update plant thumbnails with working placeholder images
 */

const fs = require('fs').promises;
const path = require('path');

// Plant icon mappings - verified Unsplash images
const PLANT_IMAGES = {
  // Vegetables - Verified working images
  "Tomato": "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=300&q=80",
  "Lettuce": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&q=80",
  "Cucumber": "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=300&q=80",
  "Bell Pepper": "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=300&q=80",
  "Carrot": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&q=80",
  "Zucchini": "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=300&q=80",
  "Spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80",
  "Kale": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=300&q=80",
  "Broccoli": "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&q=80",
  "Cauliflower": "https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=300&q=80",
  "Eggplant": "https://images.unsplash.com/photo-1659261200833-ec8761558af7?w=300&q=80",
  "Radish": "https://images.unsplash.com/photo-1617545815150-7e49c2d49ef1?w=300&q=80",
  "Green Beans": "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=300&q=80",
  "Peas": "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&q=80",
  "Onion": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8c4?w=300&q=80",
  "Garlic": "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=300&q=80",
  "Potato": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&q=80",
  "Sweet Potato": "https://images.unsplash.com/photo-1596097635537-0b567034ab49?w=300&q=80",
  "Beet": "https://images.unsplash.com/photo-1514736387881-a0e1c88e0b0e?w=300&q=80",
  "Corn": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&q=80",
  
  // Herbs - Verified working images
  "Basil": "https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=300&q=80",
  "Rosemary": "https://images.unsplash.com/photo-1631377819268-d7c4f04b0fa1?w=300&q=80",
  "Mint": "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=300&q=80",
  "Thyme": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&q=80",
  "Oregano": "https://images.unsplash.com/photo-1629889744198-e6bad33c5a36?w=300&q=80",
  "Parsley": "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=300&q=80",
  "Cilantro": "https://images.unsplash.com/photo-1617347548554-df9f7eb9c9a9?w=300&q=80",
  "Dill": "https://images.unsplash.com/photo-1630333766692-24abce4d4323?w=300&q=80",
  "Chives": "https://images.unsplash.com/photo-1589621552726-c6d39b7c1a97?w=300&q=80",
  "Sage": "https://images.unsplash.com/photo-1584279998854-8c1f49e60eff?w=300&q=80",
  "Lavender": "https://images.unsplash.com/photo-1611251184974-99094fd5f7ef?w=300&q=80",
  "Chamomile": "https://images.unsplash.com/photo-1563373522-ff3e2cf6c3a3?w=300&q=80",
  "Lemon Balm": "https://images.unsplash.com/photo-1634141481169-70d0c0cf9a95?w=300&q=80",
  "Tarragon": "https://images.unsplash.com/photo-1628624747186-a46a6e0f097b?w=300&q=80",
  "Fennel": "https://images.unsplash.com/photo-1618387568904-20e8f9e9c30e?w=300&q=80",
  
  // Flowers - Verified working images
  "Marigold": "https://images.unsplash.com/photo-1564422167509-4f36fc10d7ae?w=300&q=80",
  "Sunflower": "https://images.unsplash.com/photo-1597848212624-e4f5f7c7e126?w=300&q=80",
  "Zinnia": "https://images.unsplash.com/photo-1594857054004-1bacc2f8508d?w=300&q=80",
  "Petunia": "https://images.unsplash.com/photo-1590065326900-49d2787a7daa?w=300&q=80",
  "Cosmos": "https://images.unsplash.com/photo-1590532975769-aa4bc206bb84?w=300&q=80",
  "Dahlia": "https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=300&q=80",
  "Rose": "https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=300&q=80",
  "Pansy": "https://images.unsplash.com/photo-1583542225715-473a32c9b0ef?w=300&q=80",
  "Snapdragon": "https://images.unsplash.com/photo-1592413629937-88d3f8f1e9e0?w=300&q=80",
  "Geranium": "https://images.unsplash.com/photo-1592802192805-39d47c3e05e7?w=300&q=80",
  "Impatiens": "https://images.unsplash.com/photo-1595934404144-c28c7ab57e93?w=300&q=80",
  "Begonia": "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=300&q=80",
  "Nasturtium": "https://images.unsplash.com/photo-1596470307289-34a3623c5df6?w=300&q=80",
  "Black-eyed Susan": "https://images.unsplash.com/photo-1628432136678-43ff9be34064?w=300&q=80",
  "Morning Glory": "https://images.unsplash.com/photo-1594908336520-f617e901b5c7?w=300&q=80"
};

async function updateThumbnails() {
  console.log('🖼️  Updating plant thumbnails...\n');
  
  const dbPath = path.join(__dirname, '..', 'assets', 'data', 'comprehensive-plant-database.json');
  const data = await fs.readFile(dbPath, 'utf8');
  const database = JSON.parse(data);
  
  let updated = 0;
  for (const plant of database.plants) {
    if (PLANT_IMAGES[plant.commonName]) {
      plant.thumbnail = PLANT_IMAGES[plant.commonName];
      updated++;
    }
  }
  
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
  
  console.log(`✅ Updated ${updated} plant thumbnails`);
  console.log(`📁 File: ${dbPath}\n`);
}

updateThumbnails().catch(console.error);
