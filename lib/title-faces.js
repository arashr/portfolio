import { getGalleryConfig } from './gallery-config.js';

export function getTitleFaces() {
  return getGalleryConfig().fonts.titleFaces;
}

/**
 * @param {number} index
 * @param {string | null} [previousFaceId] `fonts.titleFaces[].id` of the prior poster in sequence
 */
export function titleFaceForIndex(index, previousFaceId = null) {
  const faces = getTitleFaces();
  if (!faces.length) {
    return { id: 'space-grotesk', google: 'Space+Grotesk:wght@400;500;700' };
  }

  let slot = ((index % faces.length) + faces.length) % faces.length;
  let face = faces[slot];
  if (previousFaceId != null && face.id === previousFaceId && faces.length > 1) {
    slot = (slot + 1) % faces.length;
    face = faces[slot];
  }
  return face;
}

/** @param {HTMLElement | null | undefined} el */
export function titleFaceIdFromElement(el) {
  const match = String(el?.className ?? '').match(/\btitle-face-([\w-]+)\b/);
  return match ? match[1] : null;
}

export function fontsHref() {
  const { fonts } = getGalleryConfig();
  const families = [
    fonts.uiSans.google,
    fonts.uiSerif.google,
    fonts.mono.google,
    ...fonts.titleFaces.map((f) => f.google)
  ];
  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}
