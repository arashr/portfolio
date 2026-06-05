/**
 * `theme.graphics.imageHalftone` — defaults + merge (flat legacy keys still supported).
 */

export const IMAGE_HALFTONE_PATTERNS = ['stagger', 'grid', 'line'];

export const IMAGE_HALFTONE_DEFAULTS = {
  enabled: true,
  dotPx: 5,
  contrast: 1.2,
  saturation: 1.35,
  paper: 'surface',
  angleDeg: 15,
  pattern: 'stagger'
};

/** @param {unknown} value */
function num(value, fallback) {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {import('./gallery-config.js').GalleryConfig | undefined} cfg
 * @returns {typeof IMAGE_HALFTONE_DEFAULTS}
 */
export function resolveImageHalftoneOptions(cfg) {
  const graphics = cfg?.theme?.graphics || {};
  const raw = graphics.imageHalftone;

  if (raw === false) {
    return { ...IMAGE_HALFTONE_DEFAULTS, enabled: false };
  }

  const nested = typeof raw === 'object' && raw !== null ? raw : {};
  const enabled =
    nested.enabled ??
    (raw === true || raw === undefined ? IMAGE_HALFTONE_DEFAULTS.enabled : raw !== false);

  const pattern = String(nested.pattern ?? graphics.imageHalftonePattern ?? IMAGE_HALFTONE_DEFAULTS.pattern);
  const normalizedPattern = IMAGE_HALFTONE_PATTERNS.includes(pattern) ? pattern : IMAGE_HALFTONE_DEFAULTS.pattern;

  return {
    enabled: Boolean(enabled),
    dotPx: num(nested.dotPx ?? graphics.imageHalftoneDotPx, IMAGE_HALFTONE_DEFAULTS.dotPx),
    contrast: num(nested.contrast ?? graphics.imageHalftoneContrast, IMAGE_HALFTONE_DEFAULTS.contrast),
    saturation: num(nested.saturation ?? graphics.imageHalftoneSaturation, IMAGE_HALFTONE_DEFAULTS.saturation),
    paper: String(nested.paper ?? graphics.imageHalftonePaper ?? IMAGE_HALFTONE_DEFAULTS.paper),
    angleDeg: num(nested.angleDeg ?? graphics.imageHalftoneAngleDeg, IMAGE_HALFTONE_DEFAULTS.angleDeg),
    pattern: normalizedPattern
  };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function isPosterImageHalftoneEnabled(cfg) {
  return resolveImageHalftoneOptions(cfg).enabled;
}
