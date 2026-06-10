import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { CONTENT_DIR } from './content-catalog.js';
import { normalizeRelativePath } from './local-md-links.js';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;

/** @param {Buffer | Uint8Array} buf @param {number} off */
function u16be(buf, off) {
  return (buf[off] << 8) | buf[off + 1];
}

/** @param {Buffer | Uint8Array} buf @param {number} off */
function u32be(buf, off) {
  return ((buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]) >>> 0;
}

/** @param {Buffer | Uint8Array} buf @returns {[number, number] | null} */
export function parseImageDimensions(buf) {
  if (!buf || buf.length < 10) return null;

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf.length >= 24) {
    const w = u32be(buf, 16);
    const h = u32be(buf, 20);
    return w > 0 && h > 0 ? [w, h] : null;
  }

  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const h = u16be(buf, i + 5);
        const w = u16be(buf, i + 7);
        return w > 0 && h > 0 ? [w, h] : null;
      }
      if (i + 3 >= buf.length) break;
      const segLen = u16be(buf, i + 2);
      if (segLen < 2) break;
      i += 2 + segLen;
    }
    return null;
  }

  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf.length >= 10) {
    const w = u16be(buf, 6);
    const h = u16be(buf, 8);
    return w > 0 && h > 0 ? [w, h] : null;
  }

  return null;
}

/** @param {string} filePath @returns {[number, number] | null} */
export function readImageDimensions(filePath) {
  try {
    const buf = readFileSync(filePath);
    return parseImageDimensions(buf);
  } catch {
    return null;
  }
}

/**
 * @param {string} [contentDir]
 * @param {string} [repoRoot]
 * @returns {string[]}
 */
export function scanContentImageAssets(contentDir = CONTENT_DIR, repoRoot = process.cwd()) {
  const root = join(repoRoot, contentDir);
  /** @type {string[]} */
  const paths = [];

  /** @param {string} dir */
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.startsWith('.')) continue;
        walk(full);
        continue;
      }
      if (!ent.isFile() || !IMAGE_EXT.test(ent.name)) continue;
      paths.push(normalizeRelativePath(relative(repoRoot, full).replace(/\\/g, '/')));
    }
  }

  walk(root);
  return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string} [contentDir]
 * @param {string} [repoRoot]
 * @returns {Record<string, [number, number]>}
 */
export function buildAssetDimensionsMap(contentDir = CONTENT_DIR, repoRoot = process.cwd()) {
  /** @type {Record<string, [number, number]>} */
  const map = {};
  for (const rel of scanContentImageAssets(contentDir, repoRoot)) {
    const dims = readImageDimensions(join(repoRoot, rel));
    if (dims) map[rel] = dims;
  }
  return map;
}
