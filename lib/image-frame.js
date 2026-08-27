/** @typedef {{ isometric: boolean, half: boolean, isoGrid: boolean, skewX: number | null, skewY: number | null, radius: number | null, title: string }} ParsedImageTitle */

import { ISO_EXTRUSION_SVG } from './image-iso-config.js';

const ISO_GRID_TITLE = /^(iso-grid|isogrid)$/i;
const ISOMETRIC_TITLE = /^(isometric|iso)$/i;
const HALF_TITLE = /^(half|half-right|bleed-right)$/i;
const NUMERIC_TOKEN = /^-?\d+(\.\d+)?$/;
/** Per-image soft radius in native image px: `r8`, `rx:4`, `radius=12`. */
const RADIUS_TOKEN = /^(?:r|rx|radius)[=:]?(\d+(?:\.\d+)?)$/i;

/** @param {string} str */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse markdown image title for layout flags (comma/space/pipe separated).
 * Layout flags are mutually exclusive — first match wins (`iso-grid`, `iso`, or `half`).
 * After `iso` / `iso-grid`, optional numeric `skewX,skewY` override config / auto-facing:
 * `![](path "iso,-10,7 Caption")`
 * @param {string | null | undefined} title
 * @returns {ParsedImageTitle}
 */
export function parseImageTitle(title) {
  const raw = title?.trim() ?? '';
  if (!raw) {
    return {
      isometric: false,
      half: false,
      isoGrid: false,
      skewX: null,
      skewY: null,
      radius: null,
      title: ''
    };
  }

  const tokens = raw.split(/[\s,|]+/).map((t) => t.trim()).filter(Boolean);
  let isometric = false;
  let half = false;
  let isoGrid = false;
  /** @type {number | null} */
  let skewX = null;
  /** @type {number | null} */
  let skewY = null;
  /** @type {number | null} */
  let radius = null;
  /** @type {number} */
  let layoutIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    /* Check iso-grid before iso — `iso` would otherwise never see the compound flag. */
    if (ISO_GRID_TITLE.test(t)) {
      isometric = true;
      isoGrid = true;
      layoutIndex = i;
      break;
    }
    if (ISOMETRIC_TITLE.test(t)) {
      isometric = true;
      layoutIndex = i;
      break;
    }
    if (HALF_TITLE.test(t)) {
      half = true;
      layoutIndex = i;
      break;
    }
  }

  const skip = new Set();
  if (layoutIndex >= 0) skip.add(layoutIndex);

  if (isometric && layoutIndex >= 0) {
    let cursor = layoutIndex + 1;
    if (cursor < tokens.length && NUMERIC_TOKEN.test(tokens[cursor])) {
      skewX = Number.parseFloat(tokens[cursor]);
      skip.add(cursor);
      cursor += 1;
    }
    if (cursor < tokens.length && NUMERIC_TOKEN.test(tokens[cursor])) {
      skewY = Number.parseFloat(tokens[cursor]);
      skip.add(cursor);
      cursor += 1;
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    if (skip.has(i)) continue;
    const match = tokens[i].match(RADIUS_TOKEN);
    if (!match) continue;
    radius = Math.max(0, Number.parseFloat(match[1]));
    skip.add(i);
    break;
  }

  const titleParts = tokens.filter((_, i) => !skip.has(i));
  return { isometric, half, isoGrid, skewX, skewY, radius, title: titleParts.join(' ') };
}

/** Matches typical prose / poster width — browsers pick a srcset entry automatically. */
export const RESPONSIVE_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 960px';

/**
 * @typedef {{ url: string, w: number }} ResolvedImageVariant
 */

/**
 * SVG assets usually carry transparency — soft-round the iso chrome + extrusion.
 * @param {string} src
 */
export function isSoftIsoSource(src) {
  const raw = String(src || '').trim().toLowerCase();
  if (raw.startsWith('data:image/svg+xml')) return true;
  const path = raw.split('?')[0].split('#')[0];
  return /\.svg$/i.test(path);
}

/**
 * Inline CSS vars for per-image skew / soft-radius overrides.
 * @param {number | null | undefined} skewX
 * @param {number | null | undefined} skewY
 * @param {number | null | undefined} radius — native image px for soft frames
 */
export function isoSkewOverrideStyle(skewX, skewY, radius) {
  /** @type {string[]} */
  const parts = [];
  if (typeof skewX === 'number' && Number.isFinite(skewX)) {
    parts.push(`--config-iso-skew-x-base:${skewX}deg`);
    parts.push(`--config-iso-skew-x:${skewX}deg`);
  }
  if (typeof skewY === 'number' && Number.isFinite(skewY)) {
    parts.push(`--config-iso-skew-y-base:${skewY}deg`);
    parts.push(`--config-iso-skew-y:${skewY}deg`);
  }
  if (typeof radius === 'number' && Number.isFinite(radius) && radius >= 0) {
    parts.push(`--config-iso-radius:${radius}px`);
  }
  return parts.length ? ` style="${parts.join(';')}"` : '';
}

/**
 * @param {{ src: string, alt: string, title?: string | null, width?: number, height?: number, variants?: ResolvedImageVariant[] }} opts — src/alt already escaped
 */
export function renderMarkdownImage(opts) {
  const { src, alt, title, width, height, variants } = opts;
  const { isometric, half, isoGrid, skewX, skewY, radius, title: displayTitle } =
    parseImageTitle(title);
  const caption = displayTitle.trim();
  const dimAttr =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? ` width="${Math.round(width)}" height="${Math.round(height)}"`
      : '';

  const titleAttr =
    !isometric && !half && caption ? ` title="${escapeHtml(caption)}"` : '';
  const imgTag = `<img src="${src}" alt="${alt}"${dimAttr}${titleAttr} loading="lazy" decoding="async">`;
  const responsive =
    variants?.length &&
    `<picture><source type="image/webp" srcset="${variants
      .map((v) => `${v.url} ${v.w}w`)
      .join(', ')}" sizes="${RESPONSIVE_IMAGE_SIZES}">${imgTag}</picture>`;

  const img = responsive || imgTag;

  if (half) {
    return `<figure class="prose-img-half">${img}</figure>`;
  }

  if (!isometric) {
    return img;
  }

  const captionHtml = caption
    ? `<span class="prose-img-iso__caption mono-label">${escapeHtml(caption)}</span>`
    : '';

  const hasSkewOverride =
    (typeof skewX === 'number' && Number.isFinite(skewX)) ||
    (typeof skewY === 'number' && Number.isFinite(skewY));
  const hasRadiusOverride = typeof radius === 'number' && Number.isFinite(radius);
  const soft = isSoftIsoSource(src);
  const frameClass = [
    'prose-img-iso__frame',
    hasSkewOverride ? 'prose-img-iso__frame--skew-locked' : '',
    soft ? 'prose-img-iso__frame--soft' : ''
  ]
    .filter(Boolean)
    .join(' ');
  const skewStyle = isoSkewOverrideStyle(skewX, skewY, hasRadiusOverride ? radius : null);
  const radiusLock = hasRadiusOverride ? ' data-iso-radius-locked="1"' : '';
  const figureClass = isoGrid ? 'prose-img-iso prose-img-iso--grid' : 'prose-img-iso';

  return `<figure class="${figureClass}"><div class="${frameClass}"${skewStyle}${radiusLock}>${ISO_EXTRUSION_SVG}${captionHtml}${img}</div></figure>`;
}
