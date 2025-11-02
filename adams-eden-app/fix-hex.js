const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
let buffer = fs.readFileSync(filePath);

console.log('File size:', buffer.length, 'bytes');

// Define the corrupted sequences as hex buffers
const corruptedEmDash = Buffer.from('c3a2e282ace2809c', 'hex'); // â€"
const corruptedArrow = Buffer.from('c3a2e282a0e28099', 'hex');  // â†'

// Replacement values
const hyphen = Buffer.from(' - ');
const arrow = Buffer.from(' → ');

// Find and replace all occurrences
let modified = false;
let pos = 0;

while ((pos = buffer.indexOf(corruptedEmDash, pos)) !== -1) {
  console.log(`Found corrupted em dash at position ${pos}`);
  buffer = Buffer.concat([
    buffer.slice(0, pos),
    hyphen,
    buffer.slice(pos + corruptedEmDash.length)
  ]);
  modified = true;
  pos += hyphen.length;
}

pos = 0;
while ((pos = buffer.indexOf(corruptedArrow, pos)) !== -1) {
  console.log(`Found corrupted arrow at position ${pos}`);
  buffer = Buffer.concat([
    buffer.slice(0, pos),
    arrow,
    buffer.slice(pos + corruptedArrow.length)
  ]);
  modified = true;
  pos += arrow.length;
}

if (modified) {
  fs.writeFileSync(filePath, buffer);
  console.log('File updated successfully!');
} else {
  console.log('No corrupted characters found');
}
