#!/usr/bin/env node
/**
 * Copy assets/branding/og-image-source.png → og-image.png for social previews.
 * Replace og-image-source.png with your artwork, then run npm run generate:og-image.
 */
import { cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(repoRoot, 'assets/branding/og-image-source.png');
const outPath = join(repoRoot, 'og-image.png');

console.log('Copying social preview image…');
cpSync(sourcePath, outPath);
const { width, height } = await sharp(outPath).metadata();
console.log(`  og-image.png (${width}×${height})`);
