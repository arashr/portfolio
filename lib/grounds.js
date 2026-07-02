import { getGalleryConfig } from './gallery-config.js';
import { GROUND_CANONICAL_ORDER } from './ground-tokens.js';

/** Poster ground class names from config (canonical slot order in `groundForSlug`). */
export function getGrounds() {
  const active = new Set(getGroundKeys());
  return GROUND_CANONICAL_ORDER.filter((name) => active.has(name)).map((name) => `ground-${name}`);
}

export function getGroundKeys() {
  return Object.keys(getGalleryConfig().grounds);
}

/**
 * @param {string} slug
 * @param {string | null} [previousGround] class name of the prior poster in sequence (e.g. `ground-lime`)
 */
export function groundForSlug(slug, previousGround = null) {
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

  let ground = candidates[0];
  if (previousGround != null && ground === previousGround && candidates.length > 1) {
    ground = candidates[1];
  }
  return ground;
}
