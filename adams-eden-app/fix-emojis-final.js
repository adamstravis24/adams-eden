const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace corrupted emoji codes with actual emojis
const emojiMap = {
  'ðŸŒ¿': '🌿',
  'ðŸ¥¬': '🥬',
  'ðŸŒ¶ï¸': '🌶️',
  'ðŸ¥¦': '🥦',
  'ðŸˆ': '🍈',
  'ðŸ¥•': '🥕',
  'ðŸŒ½': '🌽',
  'ðŸ¥'': '🥒',
  'ðŸ†': '🍆',
  'ðŸ«˜': '🫘',
  'ðŸ§…': '🧅',
  'ðŸ½ï¸': '🌾',
  'ðŸ«›': '🫛',
  'ðŸ¥"': '🥔',
  'ðŸŽƒ': '🎃',
  'ðŸ¥—': '🥗',
  'ðŸ"': '🍓',
  'ðŸ…': '🍅',
  'ðŸ‰': '🍉',
  'ðŸŒ¼': '🌼',
  'ðŸŒ»': '🌻',
  'ðŸŒ¸': '🌸',
  'ðŸŒº': '🌺',
  'ðŸ'œ': '💜',
  'ðŸŒ¹': '🌹',
  'ðŸŒ·': '🌷',
  'ðŸ'': '💐',
};

let fixCount = 0;

// Replace all occurrences
for (const [bad, good] of Object.entries(emojiMap)) {
  const before = content;
  content = content.split(bad).join(good);
  if (content !== before) {
    const count = (before.match(new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    console.log(`Replaced ${count} instances of corrupted emoji with ${good}`);
    fixCount += count;
  }
}

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Fixed ${fixCount} emoji encoding issues in GardenContext.tsx`);
