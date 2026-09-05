/**
 * Solid glyph / heroGlyph color pools.
 * Replaces canvas blend modes + opacity with explicit hex (or CSS color) lists.
 */

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeColorPool(value) {
  if (Array.isArray(value)) {
    return value
      .map((c) => String(c ?? '').trim())
      .filter((c) => c.length > 0);
  }
  if (value == null) return [];
  const single = String(value).trim();
  return single ? [single] : [];
}

/**
 * Prefer `colors[]`; fall back to legacy singular `color`.
 * @param {{ colors?: unknown, color?: unknown }} cfg
 * @param {string[]} [fallback=[]]
 */
export function resolveColorPool(cfg, fallback = []) {
  const fromColors = normalizeColorPool(cfg?.colors);
  if (fromColors.length) return fromColors;
  const fromSingular = normalizeColorPool(cfg?.color);
  if (fromSingular.length) return fromSingular;
  return [...fallback];
}

/**
 * @param {{ colors?: unknown, color?: unknown }} cfg
 * @param {() => number} rand
 * @param {string} [fallback='#c8102e']
 */
export function pickGlyphColor(cfg, rand, fallback = '#c8102e') {
  const pool = resolveColorPool(cfg);
  if (!pool.length) return fallback;
  return pool[Math.floor(rand() * pool.length)] || fallback;
}
