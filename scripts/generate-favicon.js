#!/usr/bin/env node
/**
 * Generate favicon PNGs from assets/branding/favicon-source.png.
 * Re-run after replacing the source artwork.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(repoRoot, 'assets/branding/favicon-source.png');

/** @param {number} size */
async function pngAt(size) {
  return sharp(sourcePath)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
}

const outputs = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 }
];

console.log('Generating favicons…');

for (const { name, size } of outputs) {
  writeFileSync(join(repoRoot, name), await pngAt(size));
  console.log(`  ${name} (${size}×${size})`);
}

console.log('Done.');
