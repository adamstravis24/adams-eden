const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find all corrupted text and log it
const lines = content.split('\n');
const problematicLines = [];

for (let i = 0; i < lines.length; i++) {
  // Check for non-ASCII characters
  if (/[^\x00-\x7F]/.test(lines[i])) {
    problematicLines.push({
      lineNum: i + 1,
      content: lines[i],
      hex: Buffer.from(lines[i]).toString('hex')
    });
  }
}

console.log(`Found ${problematicLines.length} lines with non-ASCII characters:`);
problematicLines.forEach(line => {
  console.log(`\nLine ${line.lineNum}: ${line.content.substring(0, 100)}`);
});

// Replace all non-ASCII with sensible defaults
content = content.replace(/[^\x00-\x7F]+/g, (match) => {
  const hex = Buffer.from(match).toString('hex');
  console.log(`\nReplacing: "${match}" (hex: ${hex})`);
  
  // Common replacements
  if (hex.includes('e28692')) return '→'; // right arrow
  if (hex.includes('e28093') || hex.includes('e28094')) return '-'; // en/em dash
  if (hex.includes('c3a2e282')) return '-'; // corrupted em dash
  
  return ''; // Remove unknown
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('\nDone! Fixed all non-ASCII characters.');
