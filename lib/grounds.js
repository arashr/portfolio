import { getGalleryConfig } from './gallery-config.js';
import { GROUND_CANONICAL_ORDER } from './ground-tokens.js';

/** Poster ground class names from config (canonical slot order in `groundForSlug`). */
export function getGrounds() {
  const active = new Set(getGroundKeys());
  return GROUND_CANONICAL_ORDER.filter((name) => active.has(name)).map((name) => `ground-${name}`);
}

export function getGroundKeys() {
  return Object.entries(getGalleryConfig().grounds)
    .filter(([, entry]) => entry?.enabled !== false)
    .map(([name]) => name);
}

/**
 * Normalize a frontmatter / config ground token to a canonical key (`pink`, `indigo`, …).
 * Accepts `indigo` or `ground-indigo`. Unknown names return null.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeGroundKey(value) {
  if (value == null) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  const key = raw.replace(/^ground-/, '');
  return GROUND_CANONICAL_ORDER.includes(key) ? key : null;
}

/**
 * @param {unknown} value
 * @returns {string | null} e.g. `ground-indigo`
 */
export function groundClassFromToken(value) {
  const key = normalizeGroundKey(value);
  return key ? `ground-${key}` : null;
}

/**
 * @param {string | null | undefined} previousGround
 * @param {string[]} [recentGrounds]
 */
export function groundsToAvoid(previousGround = null, recentGrounds = []) {
  const avoid = new Set();
  for (const ground of recentGrounds.slice(-2)) {
    if (ground) avoid.add(ground);
  }
  if (previousGround) avoid.add(previousGround);
  return avoid;
}

/**
 * @param {string} slug
 * @param {string | null} [previousGround] class name of the prior poster in sequence (e.g. `ground-lime`)
 * @param {string[]} [recentGrounds] prior grounds in display order (up to the last 2 are avoided)
 */
export function groundForSlug(slug, previousGround = null, recentGrounds = []) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const active = new Set(getGroundKeys());
  if (!active.size) return 'ground-pink';

  const slotCount = GROUND_CANONICAL_ORDER.length;
  const start = hash % slotCount;
  const candidates = [];
  for (let i = 0; i < slotCount; i++) {
    const name = GROUND_CANONICAL_ORDER[(start + i) % slotCount];
    if (active.has(name)) candidates.push(`ground-${name}`);
  }
  if (!candidates.length) return 'ground-pink';

  const avoid = groundsToAvoid(previousGround, recentGrounds);

  for (const ground of candidates) {
    if (!avoid.has(ground)) return ground;
  }
  return candidates[0];
}

/**
 * Pick a ground for a card in a multi-case sequence (landing / more-cases).
 * Frontmatter cover color wins only when it does not repeat a recent ground.
 *
 * @param {string} slug
 * @param {string | null} [previousGround]
 * @param {string[]} [recentGrounds]
 * @param {unknown} [coverGroundKey]
 */
export function resolveSequencedGround(
  slug,
  previousGround = null,
  recentGrounds = [],
  coverGroundKey = null
) {
  const cover = groundClassFromToken(coverGroundKey);
  if (cover && !groundsToAvoid(previousGround, recentGrounds).has(cover)) {
    return cover;
  }
  return groundForSlug(slug, previousGround, recentGrounds);
}
