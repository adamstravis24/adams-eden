const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');

// Read as buffer to see exact bytes
const buffer = fs.readFileSync(filePath);
const content = buffer.toString('utf8');

console.log('Searching for corrupted line...');

// Find the line number containing the issue
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('formatDate(start)') && lines[i].includes('formatDate(end)')) {
    console.log(`Found at line ${i + 1}: ${lines[i]}`);
    console.log('Bytes:', Buffer.from(lines[i]).toString('hex'));
    
    // Replace that specific line
    lines[i] = lines[i].replace(/[^\x00-\x7F]+/g, (match) => {
      console.log(`Replacing non-ASCII: ${match} (${Buffer.from(match).toString('hex')})`);
      return ' - ';
    });
    console.log(`Fixed line: ${lines[i]}`);
  }
}

const fixedContent = lines.join('\n');
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('Done!');
