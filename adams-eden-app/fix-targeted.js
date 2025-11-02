const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Before fix, checking for corrupted characters...');

// Only fix the specific corrupted sequences we identified
// â€" (corrupted em dash) -> -
// â†' (corrupted arrow) -> →

const before = content;
content = content.replace(/â€"/g, '-'); 
content = content.replace(/â†'/g, '→');

if (content !== before) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed corrupted em dash and arrow characters');
} else {
  console.log('No changes needed');
}
