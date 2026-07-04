import { statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { IMAGE_VARIANTS_PATH } from './content-catalog.js';
import { scanContentImageAssets } from './image-dimensions-node.js';

/** Widths chosen for phone / tablet / desktop prose — generated only when smaller than the original. */
const TARGET_WIDTHS = [640, 960, 1280, 1920];
const WEBP_QUALITY = 88;
const RASTER_EXT = /\.(png|jpe?g)$/i;

/**
 * @typedef {{ w: number, path: string }} ImageVariantEntry
 * @typedef {Record<string, { widths: ImageVariantEntry[] }>} ImageVariantsManifest
 */

/**
 * @param {string} relPath repo-relative e.g. content/src/hero.png
 */
function variantPathsFor(relPath, width, originalWidth) {
  const base = relPath.replace(RASTER_EXT, '');
  if (width >= originalWidth) return `${base}.webp`;
  return `${base}.${width}w.webp`;
}

/**
 * Build WebP variants beside originals in dist/content. Source files in the repo are untouched.
 *
 * @param {string} distRoot
 * @param {string} [repoRoot]
 * @returns {Promise<{ manifest: ImageVariantsManifest, imageCount: number, bytesBefore: number, bytesAfter: number }>}
 */
export async function buildImageVariants(distRoot, repoRoot = process.cwd()) {
  /** @type {ImageVariantsManifest} */
  const manifest = {};
  let bytesBefore = 0;
  let bytesAfter = 0;
  let imageCount = 0;

  const images = scanContentImageAssets(undefined, repoRoot).filter((rel) => RASTER_EXT.test(rel));

  for (const rel of images) {
    const sourcePath = join(repoRoot, rel);
    const meta = await sharp(sourcePath).metadata();
    const originalWidth = meta.width;
    if (!originalWidth || !meta.height) continue;

    bytesBefore += statSync(sourcePath).size;
    imageCount += 1;

    const widths = [
      ...new Set([...TARGET_WIDTHS.filter((w) => w < originalWidth), originalWidth])
    ].sort((a, b) => a - b);

    /** @type {ImageVariantEntry[]} */
    const entries = [];

    for (const width of widths) {
      const variantRel = variantPathsFor(rel, width, originalWidth);
      const outPath = join(distRoot, variantRel);
      await sharp(sourcePath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);

      bytesAfter += statSync(outPath).size;
      entries.push({ w: width, path: variantRel });
    }

    manifest[rel] = { widths: entries };
  }

  const manifestPath = join(distRoot, IMAGE_VARIANTS_PATH);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return { manifest, imageCount, bytesBefore, bytesAfter };
}
