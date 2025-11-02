const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Replace all corrupted characters with their proper equivalents
let fixed = content;

// Fix corrupted arrow  
fixed = fixed.replace(/â†'/g, '→');

// Remove extra spaces around hyphens in date ranges
fixed = fixed.replace(/  -  /g, ' - ');

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Fixed all encoding issues in GardenContext.tsx');
