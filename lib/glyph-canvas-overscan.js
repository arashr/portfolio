/**
 * Extra canvas margin so glyphs can draw fully and travel under section clip
 * (parallax moves the canvas; the layer clips to the card).
 */

/**
 * @param {number} viewW design / region width
 * @param {number} viewH design / region height
 * @param {{
 *   sizeRatio?: number,
 *   offsetXRatioMax?: number,
 *   glyphRatio?: number,
 *   viewportPx?: number
 * }} [opts]
 * @returns {{ padX: number, padY: number }}
 */
export function resolveGlyphCanvasOverscan(viewW, viewH, opts = {}) {
  const w = Math.max(1, viewW);
  const h = Math.max(1, viewH);
  const sizeRatio = Number.isFinite(opts.sizeRatio) ? opts.sizeRatio : 1.2;
  const offsetX = Number.isFinite(opts.offsetXRatioMax) ? Math.abs(opts.offsetXRatioMax) : 0.35;
  const glyphRatio = Number.isFinite(opts.glyphRatio) ? Math.max(0, opts.glyphRatio) : 0.2;
  const vh =
    Number.isFinite(opts.viewportPx) && opts.viewportPx > 0
      ? opts.viewportPx
      : typeof window !== 'undefined'
        ? window.innerHeight || h
        : h;

  // Horizontal: sizeRatio overflow + layout offset so ink isn't canvas-cropped.
  const padX = Math.ceil(w * Math.max(0.25, sizeRatio - 1 + offsetX));
  // Vertical: parallax travel (+ ink room) so hard edges stay outside the section window.
  const padY = Math.ceil(Math.max(h * 0.3, vh * Math.max(glyphRatio, 0.12) * 1.5));
  return { padX, padY };
}

/**
 * Grow overscan so a measured ink box (design coords) sits fully on the canvas.
 * @param {number} viewW
 * @param {number} viewH
 * @param {{ padX: number, padY: number }} base
 * @param {{ left: number, right: number, top: number, bottom: number }} ink design-space bounds
 */
export function expandOverscanForInk(viewW, viewH, base, ink) {
  const padX = Math.max(
    base.padX,
    Math.ceil(Math.max(0, -ink.left, ink.right - viewW))
  );
  const padY = Math.max(
    base.padY,
    Math.ceil(Math.max(0, -ink.top, ink.bottom - viewH))
  );
  return { padX, padY };
}
