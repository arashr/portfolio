import { normalizeRelativePath } from './local-md-links.js';

export const CONTENT_DIR = 'content';
export const CONTENT_INDEX_PATH = 'content/cases.index.json';
export const IMAGE_VARIANTS_PATH = 'content/image-variants.json';
export const SITE_CONFIG_PATH = 'content/site.json';
export const HOME_ASIDE_PATH = 'content/home-aside.md';
const MD_RE = /\.(md|markdown)$/i;
/** Meta/docs markdown in `content/` — not case studies. */
const META_MD = /^(readme|content|contributing|home-aside)\.md$/i;

/**
 * @param {string} fileName
 * @param {string} [relativePath]
 */
export function shouldIncludeCaseStudyFile(fileName, relativePath = fileName) {
  if (!fileName || fileName.startsWith('.')) return false;
  if (!MD_RE.test(fileName)) return false;
  if (META_MD.test(fileName)) return false;
  if (relativePath.includes('/.')) return false;
  return true;
}

/**
 * @param {unknown} raw
 * @param {{ allowEmpty?: boolean }} [options]
 */
export function normalizeContentIndex(raw, options = {}) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid content index');
  const list = Array.isArray(/** @type {{ cases?: unknown, paths?: unknown }} */ (raw).cases)
    ? /** @type {{ cases: unknown[] }} */ (raw).cases
    : Array.isArray(/** @type {{ paths?: unknown[] }} */ (raw).paths)
      ? /** @type {{ paths: unknown[] }} */ (raw).paths
      : [];
  const cases = list
    .map((item) => {
      const path =
        typeof item === 'string'
          ? normalizeRelativePath(item.replace(/^\//, ''))
          : normalizeRelativePath(String(/** @type {{ path?: string }} */ (item)?.path || '').replace(/^\//, ''));
      if (!path || !MD_RE.test(path)) return null;
      const base = path.split('/').pop() || path;
      if (!shouldIncludeCaseStudyFile(base, path)) return null;
      return path;
    })
    .filter(Boolean);
  if (!cases.length && !options.allowEmpty) throw new Error('Content index has no case studies');
  const generatedAt =
    typeof /** @type {{ generatedAt?: unknown }} */ (raw).generatedAt === 'string'
      ? /** @type {{ generatedAt: string }} */ (raw).generatedAt
      : undefined;
  const revision =
    typeof /** @type {{ revision?: unknown }} */ (raw).revision === 'string'
      ? /** @type {{ revision: string }} */ (raw).revision
      : undefined;
  const rawDims = /** @type {{ assetDimensions?: unknown }} */ (raw).assetDimensions;
  /** @type {Record<string, [number, number]>} */
  const assetDimensions = {};
  if (rawDims && typeof rawDims === 'object' && !Array.isArray(rawDims)) {
    for (const [key, value] of Object.entries(rawDims)) {
      if (!Array.isArray(value) || value.length < 2) continue;
      const w = Number(value[0]);
      const h = Number(value[1]);
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) continue;
      assetDimensions[normalizeRelativePath(key.replace(/^\//, ''))] = [w, h];
    }
  }
  return { cases, generatedAt, revision, assetDimensions };
}
