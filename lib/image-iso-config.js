/**
 * `theme.graphics.imageIsometric` — isometric prose image frame (opt-in via markdown title).
 */

export const IMAGE_ISO_DEFAULTS = {
  perspective: 1400,
  perspectiveOrigin: '50% 42%',
  rotateX: 7,
  rotateY: -16,
  rotateZ: -1.5,
  solidShadowX: 10,
  solidShadowY: 14,
  softShadowY: 28,
  softShadowBlur: 52,
  softShadowSpread: -16,
  softShadowOpacity: 0.24,
  stroke: '#000000'
};

/** @param {unknown} value @param {number} fallback */
function num(value, fallback) {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

/** @param {unknown} value @param {number} fallback */
function resolvePerspective(value, fallback) {
  if (value === false || value === null) return 'none';
  if (typeof value === 'string' && value.trim().toLowerCase() === 'none') return 'none';
  const n = num(value, fallback);
  return n <= 0 ? 'none' : `${n}px`;
}

/** @param {unknown} value @param {string} fallback */
function str(value, fallback) {
  const s = String(value ?? '').trim();
  return s || fallback;
}

/**
 * @param {import('./gallery-config.js').GalleryConfig | undefined} cfg
 */
export function resolveImageIsometricOptions(cfg) {
  const graphics = cfg?.theme?.graphics || {};
  const raw = graphics.imageIsometric;
  const nested = typeof raw === 'object' && raw !== null ? raw : {};
  const perspectiveRaw = nested.perspective ?? graphics.imageIsometricPerspective;

  return {
    perspective: resolvePerspective(perspectiveRaw, IMAGE_ISO_DEFAULTS.perspective),
    perspectiveOrigin: str(
      nested.perspectiveOrigin ?? graphics.imageIsometricPerspectiveOrigin,
      IMAGE_ISO_DEFAULTS.perspectiveOrigin
    ),
    rotateX: num(nested.rotateX ?? graphics.imageIsometricRotateX, IMAGE_ISO_DEFAULTS.rotateX),
    rotateY: num(nested.rotateY ?? graphics.imageIsometricRotateY, IMAGE_ISO_DEFAULTS.rotateY),
    rotateZ: num(nested.rotateZ ?? graphics.imageIsometricRotateZ, IMAGE_ISO_DEFAULTS.rotateZ),
    solidShadowX: num(
      nested.solidShadowX ?? graphics.imageIsometricSolidShadowX,
      IMAGE_ISO_DEFAULTS.solidShadowX
    ),
    solidShadowY: num(
      nested.solidShadowY ?? graphics.imageIsometricSolidShadowY,
      IMAGE_ISO_DEFAULTS.solidShadowY
    ),
    softShadowY: num(nested.softShadowY ?? graphics.imageIsometricSoftShadowY, IMAGE_ISO_DEFAULTS.softShadowY),
    softShadowBlur: num(
      nested.softShadowBlur ?? graphics.imageIsometricSoftShadowBlur,
      IMAGE_ISO_DEFAULTS.softShadowBlur
    ),
    softShadowSpread: num(
      nested.softShadowSpread ?? graphics.imageIsometricSoftShadowSpread,
      IMAGE_ISO_DEFAULTS.softShadowSpread
    ),
    softShadowOpacity: num(
      nested.softShadowOpacity ?? graphics.imageIsometricSoftShadowOpacity,
      IMAGE_ISO_DEFAULTS.softShadowOpacity
    ),
    stroke: str(nested.stroke ?? graphics.imageIsometricStroke, IMAGE_ISO_DEFAULTS.stroke)
  };
}

/** @param {ReturnType<typeof resolveImageIsometricOptions>} iso */
export function imageIsometricCssVars(iso) {
  const softAlpha = Math.min(1, Math.max(0, iso.softShadowOpacity));
  return {
    '--config-iso-perspective': iso.perspective,
    '--config-iso-perspective-origin': iso.perspectiveOrigin,
    '--config-iso-rotate-x': `${iso.rotateX}deg`,
    '--config-iso-rotate-y': `${iso.rotateY}deg`,
    '--config-iso-rotate-z': `${iso.rotateZ}deg`,
    '--config-iso-solid-shadow-x': `${iso.solidShadowX}px`,
    '--config-iso-solid-shadow-y': `${iso.solidShadowY}px`,
    '--config-iso-soft-shadow-y': `${iso.softShadowY}px`,
    '--config-iso-soft-shadow-blur': `${iso.softShadowBlur}px`,
    '--config-iso-soft-shadow-spread': `${iso.softShadowSpread}px`,
    '--config-iso-soft-shadow-color': `rgba(0, 0, 0, ${softAlpha})`,
    '--config-iso-stroke': iso.stroke
  };
}
