const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the corrupted em dash with a simple hyphen
content = content.replace(/â€"/g, '-');

// Also replace any other unicode dashes
content = content.replace(/—/g, '-'); // em dash
content = content.replace(/–/g, '-'); // en dash  
content = content.replace(/â†'/g, '→'); // arrow might also be corrupted

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed encoding in GardenContext.tsx');
