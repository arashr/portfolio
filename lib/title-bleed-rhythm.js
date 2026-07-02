/** @typedef {import('./gallery-config.js').DEFAULT_CONFIG} GalleryConfigShape */

export const TITLE_BLEED_DEFAULT_POOL = '/|#*+=%~';

/**
 * @param {GalleryConfigShape | { reader?: { titleBleed?: { symbolPool?: string } }, theme?: { graphics?: { typePattern?: { symbolPool?: string } } } }} [cfg]
 */
export function resolveTitleBleedSymbolPool(cfg) {
  const pool =
    cfg?.reader?.titleBleed?.symbolPool ??
    cfg?.theme?.graphics?.typePattern?.symbol?.pool ??
    cfg?.theme?.graphics?.typePattern?.symbolPool ??
    TITLE_BLEED_DEFAULT_POOL;
  return String(pool).trim() || TITLE_BLEED_DEFAULT_POOL;
}

/**
 * @param {string} pool
 * @param {() => number} [rng]
 */
export function pickBleedSymbol(pool, rng = Math.random) {
  const chars = [...String(pool || '')];
  if (!chars.length) return '/';
  const i = Math.min(chars.length - 1, Math.floor(rng() * chars.length));
  return chars[i] ?? chars[0];
}

/**
 * Map title words to repeated symbols — "The Challenge" → "/// /////////".
 * @param {string} plainTitle
 * @param {string} symbol
 */
export function titleToBleedRhythm(plainTitle, symbol) {
  const sym = symbol || '/';
  const words = String(plainTitle || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';
  return words.map((word) => sym.repeat([...word].length)).join(' ');
}
