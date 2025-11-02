const fs = require('fs');
const path = require('path');

// Read the file as buffer
const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
let buffer = fs.readFileSync(filePath);

// Map of hex sequences to actual emoji
const hexToEmoji = {
  // Basil - herb
  'c3b0c5b8c592c2bf': '🌿',
  // Leafy greens
  'c3b0c5b8c2a5c2ac': '🥬',
  // Pepper
  'c3b0c5b8c592c2b6c3afc2b8c28f': '🌶️',
  // Broccoli
  'c3b0c5b8c2a5c2a6': '🥦',
  // Melon
  'c3b0c5b8c28dcb86': '🍈',
  // Carrot
  'c3b0c5b8c2a5e280a2': '🥕',
  // Corn
  'c3b0c5b8c592c2bd': '🌽',
  // Cucumber
  'c3b0c5b8c2a5e28099': '🥒',
  // Eggplant
  'c3b0c5b8c28de280a0': '🍆',
  // Beans
  'c3b0c5b8c2abcb9c': '🫘',
  // Onion
  'c3b0c5b8c2a7e280a6': '🧅',
  // Wheat/grain
  'c3b0c5b8c28dc2bdc3afc2b8c28f': '🌾',
  // Peas
  'c3b0c5b8c2abe280ba': '🫛',
  // Potato
  'c3b0c5b8c2a5e2809d': '🥔',
  // Pumpkin
  'c3b0c5b8c5bdc692': '🎃',
  // Salad
  'c3b0c5b8c2a5': '🥗',
  // Strawberry
  'c3b0c5b8c28de2809c': '🍓',
  // Tomato
  'c3b0c5b8c28de280a6': '🍅',
  // Watermelon
  'c3b0c5b8c28de280b0': '🍉',
  // Sunflower
  'c3b0c5b8c592c2bb': '🌻',
  // Blossom
  'c3b0c5b8c592c2b8': '🌸',
  // Hibiscus
  'c3b0c5b8c592c2ba': '🌺',
  // Purple heart
  'c3b0c5b8e28099c593': '💜',
  // Rose
  'c3b0c5b8c592c2b9': '🌹',
  // Tulip
  'c3b0c5b8c592c2b7': '🌷',
  // Bouquet
  'c3b0c5b8e28099c290': '💐',
  // Daisy
  'c3b0c5b8c592c2bc': '🌼',
};

let totalFixed = 0;

for (const [hexSeq, emoji] of Object.entries(hexToEmoji)) {
  const corrupted = Buffer.from(hexSeq, 'hex');
  const replacement = Buffer.from(emoji);
  
  let pos = 0;
  let count = 0;
  
  while ((pos = buffer.indexOf(corrupted, pos)) !== -1) {
    buffer = Buffer.concat([
      buffer.slice(0, pos),
      replacement,
      buffer.slice(pos + corrupted.length)
    ]);
    count++;
    totalFixed++;
    pos += replacement.length;
  }
  
  if (count > 0) {
    console.log(`Fixed ${count} instances of ${emoji}`);
  }
}

fs.writeFileSync(filePath, buffer);
console.log(`\n✅ Fixed ${totalFixed} emoji encoding issues in GardenContext.tsx`);
