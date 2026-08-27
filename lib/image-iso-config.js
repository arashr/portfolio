/**
 * `theme.graphics.imageIsometric` — skewed prose image frame (opt-in via markdown title).
 *
 * Fast Isometric–style: 2D rotate/skew on the face, plus an SVG underlay whose
 * path is the convex hull of the face rectangle and the same rect offset by
 * depth (solid slab, no corner gaps). The SVG lives in local frame coords so the
 * parent CSS transform keeps extrusion aligned with the face.
 *
 * Config values are the **right-side** facing (depth toward +X). When the image
 * sits on the left of the poster, CSS mirrors horizontal components automatically.
 */

export const IMAGE_ISO_DEFAULTS = {
  /** 2D clockwise rotation (deg). */
  rotate: 6,
  /** CSS skewX (deg) — tilts vertical edges. */
  skewX: -10,
  /** CSS skewY (deg) — tilts horizontal edges. */
  skewY: 2,
  /** Extrusion offset X (px), local frame space — positive = toward the right. */
  depthX: 10,
  /** Extrusion offset Y (px), local frame space. */
  depthY: 10,
  /**
   * Face border + extrusion fill. Prefer 8-digit hex with alpha
   * (e.g. `#1A27E51A`) so depth stays flat translucent — no gradient.
   */
  color: '#1A27E51A',
  /** Opaque face fill behind the image. */
  face: '#ffffff',
  /** Corner radius (px) in the image’s native pixel space for soft frames. Scales with display size. `0` = sharp. */
  radius: 8,
  /** Face border width (px). Independent of `--chrome-stroke-width`. */
  borderWidth: 1
};

/** @typedef {{ x: number, y: number }} IsoPoint */

/** @param {unknown} value @param {number} fallback */
function num(value, fallback) {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
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

  /* Legacy 3D keys still accepted as weak fallbacks while decks migrate. */
  const rotate = nested.rotate ?? nested.rotateZ ?? graphics.imageIsometricRotate;
  const skewX = nested.skewX ?? graphics.imageIsometricSkewX;
  const skewY = nested.skewY ?? graphics.imageIsometricSkewY;
  const depthX =
    nested.depthX ?? nested.solidShadowX ?? graphics.imageIsometricDepthX ?? graphics.imageIsometricSolidShadowX;
  const depthY =
    nested.depthY ?? nested.solidShadowY ?? graphics.imageIsometricDepthY ?? graphics.imageIsometricSolidShadowY;
  const color =
    nested.color ?? nested.stroke ?? graphics.imageIsometricColor ?? graphics.imageIsometricStroke;
  const face = nested.face ?? nested.border ?? graphics.imageIsometricFace ?? graphics.imageIsometricBorder;
  const radius = nested.radius ?? graphics.imageIsometricRadius;
  const borderWidth = nested.borderWidth ?? graphics.imageIsometricBorderWidth;

  return {
    rotate: num(rotate, IMAGE_ISO_DEFAULTS.rotate),
    skewX: num(skewX, IMAGE_ISO_DEFAULTS.skewX),
    skewY: num(skewY, IMAGE_ISO_DEFAULTS.skewY),
    depthX: num(depthX, IMAGE_ISO_DEFAULTS.depthX),
    depthY: num(depthY, IMAGE_ISO_DEFAULTS.depthY),
    color: str(color, IMAGE_ISO_DEFAULTS.color),
    face: str(face, IMAGE_ISO_DEFAULTS.face),
    radius: Math.max(0, num(radius, IMAGE_ISO_DEFAULTS.radius)),
    borderWidth: Math.max(0, num(borderWidth, IMAGE_ISO_DEFAULTS.borderWidth))
  };
}

/** @param {ReturnType<typeof resolveImageIsometricOptions>} iso */
export function imageIsometricCssVars(iso) {
  const depthInset = Math.abs(iso.depthX);
  return {
    /* Authored (right-facing) bases — left-facing CSS negates the horizontal ones */
    '--config-iso-rotate-base': `${iso.rotate}deg`,
    '--config-iso-skew-x-base': `${iso.skewX}deg`,
    '--config-iso-skew-y-base': `${iso.skewY}deg`,
    '--config-iso-depth-x-base': `${iso.depthX}px`,
    '--config-iso-depth-y-base': `${iso.depthY}px`,
    /* Active values (default = right-facing) */
    '--config-iso-rotate': `${iso.rotate}deg`,
    '--config-iso-skew-x': `${iso.skewX}deg`,
    '--config-iso-skew-y': `${iso.skewY}deg`,
    '--config-iso-depth-x': `${iso.depthX}px`,
    '--config-iso-depth-y': `${iso.depthY}px`,
    '--config-iso-depth-inset': `${depthInset}px`,
    '--config-iso-color': iso.color,
    '--config-iso-face': iso.face,
    '--config-iso-radius': `${iso.radius}px`,
    '--config-iso-border-width': `${iso.borderWidth}px`,
    '--config-iso-solid-shadow-x': `${depthInset}px`,
    '--config-iso-solid-shadow-y': `${iso.depthY}px`,
    '--config-iso-stroke': iso.color,
    '--config-iso-border': iso.color
  };
}

/** Markup for the SVG extrusion underlay (path filled by CSS). */
export const ISO_EXTRUSION_SVG = `<svg class="prose-img-iso__extrusion" aria-hidden="true" focusable="false"><path class="prose-img-iso__extrusion-path" d=""></path></svg>`;

/**
 * Monotone-chain convex hull (CCW). Degenerate inputs return a copy of unique pts.
 * @param {IsoPoint[]} points
 * @returns {IsoPoint[]}
 */
export function convexHull(points) {
  const pts = points
    .map((p) => ({ x: p.x, y: p.y }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 1) return pts;

  /** @param {IsoPoint} o @param {IsoPoint} a @param {IsoPoint} b */
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  /** @type {IsoPoint[]} */
  const lower = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  /** @type {IsoPoint[]} */
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Convex hull of a (optionally rounded) width×height face and the same shape
 * offset by depth. `overlap` expands the face slightly so the fill tucks under
 * the stroke (kills the 1px antialias hairline after skew).
 * @param {number} width
 * @param {number} height
 * @param {number} depthX
 * @param {number} depthY
 * @param {number} [overlap]
 * @param {number} [radius]
 * @returns {IsoPoint[]}
 */
export function isoExtrusionHull(width, height, depthX, depthY, overlap = 0, radius = 0) {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const o = Math.max(0, overlap);
  const face = roundedRectContour(w + 2 * o, h + 2 * o, radius, 6).map((p) => ({
    x: p.x - o,
    y: p.y - o
  }));
  const back = face.map((p) => ({ x: p.x + depthX, y: p.y + depthY }));
  return convexHull(face.concat(back));
}

/**
 * Even-odd slab path: outer extrusion hull with a face hole so black fill does
 * not sit under the CSS border on the free edges (top/left for +depth).
 *
 * `tuck` grows the hull face only toward the depth so the slab overlaps the
 * face by that many px on the extruded sides — closes the hairline gap without
 * thickening the opposite borders.
 * @param {number} width
 * @param {number} height
 * @param {number} depthX
 * @param {number} depthY
 * @param {{ radius?: number, tuck?: number, holeExpand?: number }} [opts]
 */
export function isoExtrusionSlabPath(width, height, depthX, depthY, opts = {}) {
  const radius = Math.max(0, opts.radius ?? 0);
  const tuck = Math.max(0, opts.tuck ?? 0);
  const holeExpand = Math.max(0, opts.holeExpand ?? 0);
  const w = Math.max(0, width);
  const h = Math.max(0, height);

  /* Grow face only in the depth direction(s) so the slab tucks under those edges. */
  let x0 = 0;
  let y0 = 0;
  let fw = w;
  let fh = h;
  if (tuck > 0) {
    if (depthX > 0) fw += tuck;
    else if (depthX < 0) {
      x0 -= tuck;
      fw += tuck;
    }
    if (depthY > 0) fh += tuck;
    else if (depthY < 0) {
      y0 -= tuck;
      fh += tuck;
    }
  }

  const faceGrown = roundedRectContour(fw, fh, radius, 6).map((p) => ({
    x: p.x + x0,
    y: p.y + y0
  }));
  const back = faceGrown.map((p) => ({ x: p.x + depthX, y: p.y + depthY }));
  const hull = convexHull(faceGrown.concat(back));
  if (hull.length < 3) return '';

  const e = holeExpand;
  const hole = roundedRectContour(w + 2 * e, h + 2 * e, radius > 0 ? radius + e : 0, 6).map(
    (p) => ({
      x: p.x - e,
      y: p.y - e
    })
  );
  if (hole.length < 3) return hullToSvgPath(hull);
  return `${hullToSvgPath(hull)} ${hullToSvgPath(hole)}`;
}

/**
 * Sample a rounded-rect outline (CW from top-left).
 * @param {number} w
 * @param {number} h
 * @param {number} radius
 * @param {number} [arcSamples] points per corner arc
 * @returns {IsoPoint[]}
 */
export function roundedRectContour(w, h, radius, arcSamples = 5) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (r < 0.5) {
    return [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h }
    ];
  }
  /** @type {IsoPoint[]} */
  const pts = [];
  const corners = [
    { cx: r, cy: r, a0: Math.PI, a1: (Math.PI * 3) / 2 },
    { cx: w - r, cy: r, a0: (Math.PI * 3) / 2, a1: Math.PI * 2 },
    { cx: w - r, cy: h - r, a0: 0, a1: Math.PI / 2 },
    { cx: r, cy: h - r, a0: Math.PI / 2, a1: Math.PI }
  ];
  const n = Math.max(2, Math.round(arcSamples));
  for (const { cx, cy, a0, a1 } of corners) {
    for (let i = 0; i <= n; i++) {
      const t = a0 + ((a1 - a0) * i) / n;
      pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
    }
  }
  return pts;
}

/**
 * @param {IsoPoint[]} points
 * @returns {string}
 */
export function hullToSvgPath(points) {
  if (points.length < 3) return '';
  const body = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${roundIso(p.x)} ${roundIso(p.y)}`)
    .join(' ');
  return `${body} Z`;
}

/** @param {number} n */
function roundIso(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Active depth for a frame (reads base vars; flips X when face-left).
 * @param {HTMLElement} frame
 * @returns {{ depthX: number, depthY: number }}
 */
export function resolveFrameIsoDepth(frame) {
  const styles = getComputedStyle(frame);
  const depthX = num(styles.getPropertyValue('--config-iso-depth-x-base'), IMAGE_ISO_DEFAULTS.depthX);
  const depthY = num(styles.getPropertyValue('--config-iso-depth-y-base'), IMAGE_ISO_DEFAULTS.depthY);
  const faceLeft = frame.classList.contains('prose-img-iso__frame--face-left');
  return { depthX: faceLeft ? -depthX : depthX, depthY };
}

/**
 * Soft-frame radius is authored in the image’s native pixel space (e.g. SVG `rx`)
 * and must scale with the displayed width so resize stays matched.
 * @param {number} nativeRadius
 * @param {number} naturalWidth
 * @param {number} displayWidth
 */
export function scaleSoftIsoRadius(nativeRadius, naturalWidth, displayWidth) {
  const r = Math.max(0, nativeRadius);
  if (!(r > 0)) return 0;
  if (!(naturalWidth > 0) || !(displayWidth > 0)) return r;
  return r * (displayWidth / naturalWidth);
}

/**
 * Concentric soft radii: the CSS border sits outside the artwork face.
 * Outer (frame + extrusion) = face + border; inner (img) = face.
 * @param {number} faceRadius display px matching the SVG art corner
 * @param {number} borderWidth
 * @returns {{ outer: number, inner: number }}
 */
export function softIsoConcentricRadii(faceRadius, borderWidth = 0) {
  const inner = Math.max(0, faceRadius);
  const border = Math.max(0, borderWidth);
  return { outer: inner + border, inner };
}

/**
 * Read canvas size from an SVG document string.
 * @param {string} svgText
 * @returns {{ w: number, h: number } | null}
 */
function svgCanvasSize(svgText) {
  const vb = svgText.match(/viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
  if (vb) {
    const w = Number.parseFloat(vb[3]);
    const h = Number.parseFloat(vb[4]);
    if (w > 0 && h > 0) return { w, h };
  }
  const open = svgText.match(/<svg\b[^>]*>/i)?.[0] || '';
  const w = Number.parseFloat(open.match(/\bwidth\s*=\s*["']([\d.]+)/i)?.[1] || '');
  const h = Number.parseFloat(open.match(/\bheight\s*=\s*["']([\d.]+)/i)?.[1] || '');
  if (w > 0 && h > 0) return { w, h };
  return null;
}

/**
 * Infer the outer card corner radius (native SVG px) from markup.
 * Prefers full-width path silhouettes when present (artwork), else full-bleed
 * rect / clipPath `rx` (including explicit 0 for sharp cards).
 * @param {string} svgText
 * @returns {number | null} null when nothing reliable was found
 */
export function extractSvgNativeCornerRadius(svgText) {
  const text = String(svgText || '');
  if (!text.includes('<svg')) return null;
  const canvas = svgCanvasSize(text);
  if (!canvas) return null;
  const { w, h } = canvas;
  const near = (a, b) => Math.abs(a - b) <= Math.max(1.5, b * 0.02);

  /** @type {number[]} */
  const pathRadii = [];
  /* Top-left rounded faces: M0 R C0 … R 0H(W−R) … */
  const topPath =
    /M\s*0\s+(\d+(?:\.\d+)?)\s*C\s*0\s+[\d.]+\s+[\d.]+\s+0\s+(\d+(?:\.\d+)?)\s+0\s*H\s*([\d.]+)/gi;
  let m;
  while ((m = topPath.exec(text))) {
    const r1 = Number.parseFloat(m[1]);
    const r2 = Number.parseFloat(m[2]);
    const x = Number.parseFloat(m[3]);
    if (Math.abs(r1 - r2) >= 0.6) continue;
    if (near(x, w) || near(x + r1, w)) pathRadii.push(r1);
  }

  /** @type {number[]} */
  const fullBleedRadii = [];
  const rectRe = /<rect\b([^>]*)>/gi;
  while ((m = rectRe.exec(text))) {
    const attrs = m[1];
    const rw = Number.parseFloat(attrs.match(/\bwidth\s*=\s*["']([\d.]+)/i)?.[1] || '');
    const rh = Number.parseFloat(attrs.match(/\bheight\s*=\s*["']([\d.]+)/i)?.[1] || '');
    if (!(rw > 0 && rh > 0 && near(rw, w) && near(rh, h))) continue;
    const rxAttr = attrs.match(/\brx\s*=\s*["']([\d.]+)/i)?.[1];
    fullBleedRadii.push(rxAttr != null ? Number.parseFloat(rxAttr) : 0);
  }

  if (pathRadii.length) return Math.max(0, Math.max(...pathRadii));
  if (fullBleedRadii.length) return Math.max(0, Math.max(...fullBleedRadii));
  return null;
}

/** @type {Map<string, Promise<number | null>>} */
const softRadiusBySrc = new Map();

/**
 * Decode SVG markup from a same-origin URL or data: URL.
 * @param {string} src
 * @returns {Promise<string | null>}
 */
async function fetchSvgText(src) {
  const raw = String(src || '').trim();
  if (!raw) return null;
  if (raw.startsWith('data:image/svg+xml')) {
    const comma = raw.indexOf(',');
    if (comma < 0) return null;
    const meta = raw.slice(0, comma);
    const body = raw.slice(comma + 1);
    try {
      return /;base64/i.test(meta) ? atob(body) : decodeURIComponent(body);
    } catch {
      return null;
    }
  }
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch(raw, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (ct && !/svg|xml|text\/plain/i.test(ct) && !/\.svg(\?|#|$)/i.test(raw)) {
      return null;
    }
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Resolve native soft radius for a source URL (cached).
 * @param {string} src
 * @returns {Promise<number | null>}
 */
export function resolveSvgSoftRadiusForSrc(src) {
  const key = String(src || '').trim();
  if (!key) return Promise.resolve(null);
  let pending = softRadiusBySrc.get(key);
  if (!pending) {
    pending = fetchSvgText(key).then((text) => (text ? extractSvgNativeCornerRadius(text) : null));
    softRadiusBySrc.set(key, pending);
  }
  return pending;
}

/**
 * Apply per-SVG native radius onto a soft iso frame (skips markdown-locked frames).
 * @param {HTMLElement} frame
 * @returns {Promise<boolean>} true when a radius was written
 */
export async function hydrateSoftIsoRadius(frame) {
  if (!(frame instanceof HTMLElement)) return false;
  if (!frame.classList.contains('prose-img-iso__frame--soft')) return false;
  if (frame.dataset.isoRadiusLocked === '1') return false;
  if (frame.dataset.isoRadiusHydrated === '1') return false;

  const img = frame.querySelector('img');
  if (!(img instanceof HTMLImageElement)) return false;
  const src = img.currentSrc || img.getAttribute('src') || '';
  if (!src) return false;

  const radius = await resolveSvgSoftRadiusForSrc(src);
  if (radius == null || !Number.isFinite(radius)) return false;
  if (frame.dataset.isoRadiusLocked === '1') return false;

  frame.style.setProperty('--config-iso-radius', `${radius}px`);
  frame.dataset.isoRadiusHydrated = '1';
  syncIsoExtrusion(frame);
  return true;
}

/**
 * @param {HTMLElement} frame
 * @param {number} fallbackWidth content-box width hint when the img is not ready
 * @param {number} [borderWidth]
 */
function resolveSoftDisplayRadius(frame, fallbackWidth, borderWidth = 0) {
  const configured = Math.max(
    0,
    num(getComputedStyle(frame).getPropertyValue('--config-iso-radius'), IMAGE_ISO_DEFAULTS.radius)
  );
  const img = frame.querySelector('img');
  const nw = img instanceof HTMLImageElement ? img.naturalWidth : 0;
  const border = Math.max(0, borderWidth);
  const dw =
    img instanceof HTMLImageElement && img.clientWidth > 0
      ? img.clientWidth
      : Math.max(0, fallbackWidth - border * 2);
  return scaleSoftIsoRadius(configured, nw, dw);
}

/**
 * Ensure the frame has an extrusion SVG and update its path for current size/depth.
 * Pins SVG to the border box in device pixels so depth stays absolute while the
 * face animates (avoids the FLIP scale→resync jump).
 * @param {Element} frame
 */
export function syncIsoExtrusion(frame) {
  if (!(frame instanceof HTMLElement)) return;
  if (!frame.classList.contains('prose-img-iso__frame')) {
    return;
  }

  let svg = frame.querySelector(':scope > .prose-img-iso__extrusion');
  if (!svg) {
    frame.insertAdjacentHTML('afterbegin', ISO_EXTRUSION_SVG);
    svg = frame.querySelector(':scope > .prose-img-iso__extrusion');
  }
  const path = svg?.querySelector('.prose-img-iso__extrusion-path');
  if (!(svg instanceof SVGElement) || !(path instanceof SVGPathElement)) return;

  const cs = getComputedStyle(frame);
  const bl = Number.parseFloat(cs.borderLeftWidth) || 0;
  const bt = Number.parseFloat(cs.borderTopWidth) || 0;
  const width = frame.offsetWidth;
  const height = frame.offsetHeight;
  if (width < 1 || height < 1) {
    path.setAttribute('d', '');
    return;
  }

  /* Explicit px box = outer stroke edge (not % of content box). */
  svg.style.left = `${-bl}px`;
  svg.style.top = `${-bt}px`;
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;

  const { depthX, depthY } = resolveFrameIsoDepth(frame);
  const soft = frame.classList.contains('prose-img-iso__frame--soft');
  const borderW = Math.max(bl, bt, 0);
  const faceRadius = soft ? resolveSoftDisplayRadius(frame, width, borderW) : 0;
  const { outer: outerRadius, inner: innerRadius } = soft
    ? softIsoConcentricRadii(faceRadius, borderW)
    : { outer: 0, inner: 0 };
  if (soft) {
    /* Outer = frame/extrusion; inner = img — concentric with the 1px stroke. */
    frame.style.setProperty('--config-iso-radius-display', `${roundIso(outerRadius)}px`);
    frame.style.setProperty('--config-iso-radius-inner', `${roundIso(innerRadius)}px`);
  } else {
    frame.style.removeProperty('--config-iso-radius-display');
    frame.style.removeProperty('--config-iso-radius-inner');
  }
  svg.setAttribute('viewBox', `0 0 ${roundIso(width)} ${roundIso(height)}`);
  /*
   * Hollow face + 1px tuck toward depth: slab meets the face flush on bottom/right
   * without painting under the free (top/left) border — that was the thick edge.
   */
  const tuck = Math.max(borderW, 1);
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute(
    'd',
    isoExtrusionSlabPath(width, height, depthX, depthY, {
      radius: outerRadius,
      tuck,
      holeExpand: 0
    })
  );
}

/** @type {WeakMap<Element, number>} */
const extrusionPulseRafs = new WeakMap();

/**
 * Keep extrusion geometry in sync while width/height change (e.g. resize).
 * @param {Element} frame
 * @param {number} [durationMs]
 */
export function pulseIsoExtrusion(frame, durationMs = 400) {
  if (!(frame instanceof HTMLElement)) return;
  const prev = extrusionPulseRafs.get(frame);
  if (prev) cancelAnimationFrame(prev);
  const end = performance.now() + Math.max(0, durationMs);
  /** @param {number} now */
  const tick = (now) => {
    syncIsoExtrusion(frame);
    if (now < end) {
      extrusionPulseRafs.set(frame, requestAnimationFrame(tick));
    } else {
      extrusionPulseRafs.delete(frame);
      syncIsoExtrusion(frame);
    }
  };
  extrusionPulseRafs.set(frame, requestAnimationFrame(tick));
}

/** @type {WeakMap<Element, ResizeObserver>} */
const extrusionObservers = new WeakMap();

/**
 * Whether a media element sits on the left half of its poster card.
 * @param {Element} media
 * @param {Element} card
 */
export function isMediaOnLeft(media, card) {
  const mediaRect = media.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  if (mediaRect.width < 1 || cardRect.width < 1) return false;
  const mediaMid = mediaRect.left + mediaRect.width / 2;
  const cardMid = cardRect.left + cardRect.width / 2;
  return mediaMid < cardMid;
}

/**
 * Tag iso frames to face left or right based on media position in the poster,
 * then paint SVG extrusions (and observe size changes).
 * @param {ParentNode} root
 */
export function applyIsoFacing(root) {
  root.querySelectorAll('.prose-img-iso__frame').forEach((frame) => {
    if (!(frame instanceof HTMLElement)) return;
    const card = frame.closest('.post-card');
    const media = frame.closest('.prose-img-iso') || frame;
    if (!card || !media) {
      frame.classList.remove('prose-img-iso__frame--face-left');
      frame.classList.add('prose-img-iso__frame--face-right');
    } else {
      const faceLeft = isMediaOnLeft(media, card);
      frame.classList.toggle('prose-img-iso__frame--face-left', faceLeft);
      frame.classList.toggle('prose-img-iso__frame--face-right', !faceLeft);
    }

    syncIsoExtrusion(frame);
    void hydrateSoftIsoRadius(frame);

    if (typeof ResizeObserver !== 'undefined' && !extrusionObservers.has(frame)) {
      const ro = new ResizeObserver(() => syncIsoExtrusion(frame));
      ro.observe(frame);
      extrusionObservers.set(frame, ro);
      const img = frame.querySelector('img');
      if (img instanceof HTMLImageElement) {
        img.addEventListener(
          'load',
          () => {
            syncIsoExtrusion(frame);
            void hydrateSoftIsoRadius(frame);
          },
          { passive: true }
        );
      }
    }
  });
}
