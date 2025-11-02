const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'GardenContext.tsx');
let buffer = fs.readFileSync(filePath);

// Corrupted arrow hex sequence
const corruptedArrow = Buffer.from('c3a2e280a0e28099', 'hex');
const arrow = Buffer.from('→');

let pos = 0;
let count = 0;

while ((pos = buffer.indexOf(corruptedArrow, pos)) !== -1) {
  console.log(`Found corrupted arrow at position ${pos}`);
  buffer = Buffer.concat([
    buffer.slice(0, pos),
    arrow,
    buffer.slice(pos + corruptedArrow.length)
  ]);
  count++;
  pos += arrow.length;
}

fs.writeFileSync(filePath, buffer);
console.log(`Fixed ${count} corrupted arrow(s)`);
