import { getGalleryConfig } from './gallery-config.js';

/** Poster ground class names from config (stable hash order in `groundForSlug`). */
export function getGrounds() {
  return Object.keys(getGalleryConfig().grounds).map((name) => `ground-${name}`);
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
  const grounds = getGrounds();
  if (!grounds.length) return 'ground-pink';

  let slot = hash % grounds.length;
  let ground = grounds[slot];
  if (previousGround != null && ground === previousGround && grounds.length > 1) {
    slot = (slot + 1) % grounds.length;
    ground = grounds[slot];
  }
  return ground;
}
