import { getGalleryConfig } from '../../lib/gallery-config.js';

/** @typedef {{ titleSizePx: number, lineHeight: string, letterSpacing: string }} TitleTypography */

export const DEFAULT_TYPOGRAPHY = {
  titleSizePx: 72,
  lineHeight: '0.95',
  letterSpacing: '-0.03em'
};

/**
 * @param {string} displayId
 * @returns {TitleTypography}
 */
export function typographyForDisplayId(displayId) {
  const face = getGalleryConfig().fonts?.titleFaces?.find((f) => f.id === displayId);
  return {
    titleSizePx: DEFAULT_TYPOGRAPHY.titleSizePx,
    lineHeight: face?.lineHeight ?? DEFAULT_TYPOGRAPHY.lineHeight,
    letterSpacing: face?.letterSpacing ?? DEFAULT_TYPOGRAPHY.letterSpacing
  };
}

/**
 * @param {HTMLElement} root
 * @param {TitleTypography} typo
 */
export function applyTitleTypography(root, typo) {
  root.style.setProperty('--demo-title-size', `${typo.titleSizePx}px`);
  root.style.setProperty('--demo-title-line-height', typo.lineHeight);
  root.style.setProperty('--demo-title-letter-spacing', typo.letterSpacing);
}

/**
 * @param {string} displayId
 * @param {TitleTypography} typo
 */
export function configSnippet(displayId, typo) {
  return JSON.stringify(
    {
      id: displayId,
      lineHeight: typo.lineHeight,
      letterSpacing: typo.letterSpacing,
      titleScale: {
        minPx: Math.round(typo.titleSizePx * 0.85),
        maxPx: typo.titleSizePx,
        maxWidthRatio: 0.45,
        floorPx: 14
      }
    },
    null,
    2
  );
}

/**
 * @param {URLSearchParams} params
 * @returns {Partial<TitleTypography>}
 */
export function typographyFromUrl(params) {
  const out = {};
  const size = Number(params.get('size'));
  if (Number.isFinite(size) && size > 0) out.titleSizePx = size;
  const lh = params.get('lh');
  if (lh) out.lineHeight = lh;
  const ls = params.get('ls');
  if (ls) out.letterSpacing = ls;
  return out;
}
