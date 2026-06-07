/**
 * Viewport-bottom halftone fade — paper-colored dots over page content.
 * Sparse “holey” rows are drawn below the viewport and clipped away.
 */

import { resolveColor } from './gallery-config.js';
import { dotRadiusFromLuminance, halftoneGridPoints } from './image-halftone.js';

export const EDGE_HALFTONE_DEFAULTS = {
  enabled: false,
  heightPx: 96,
  dotPx: 6,
  angleDeg: 15,
  pattern: 'stagger',
  contrast: 1.15,
  fadePower: 1.45,
  /** Extra canvas height above the visible band (sparse rows clipped away). */
  pushPx: 0,
  /** Dot radius as a multiple of dotPx at the visible bottom edge. */
  mergeDotScale: 0.72,
  showOnHome: false,
  color: 'paper'
};

/** @param {ReturnType<typeof resolveEdgeHalftoneConfig>} opts */
export function resolveEdgeHalftoneLayout(opts) {
  const visibleH = opts.heightPx;
  const pushPx =
    opts.pushPx > 0 ? opts.pushPx : Math.max(opts.dotPx * 6, Math.round(visibleH * 0.4));
  return { visibleH, pushPx, totalH: visibleH + pushPx };
}

/** @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveEdgeHalftoneConfig(cfg) {
  const raw = cfg?.theme?.edgeHalftone ?? cfg?.theme?.dissolveEdge;
  if (!raw || typeof raw !== 'object') return { ...EDGE_HALFTONE_DEFAULTS };
  return {
    ...EDGE_HALFTONE_DEFAULTS,
    ...raw,
    heightPx: clampInt(raw.heightPx, EDGE_HALFTONE_DEFAULTS.heightPx, 32, 320),
    dotPx: clampInt(raw.dotPx ?? raw.blockSizePx, EDGE_HALFTONE_DEFAULTS.dotPx, 3, 24),
    pushPx: clampInt(raw.pushPx, 0, 0, 240),
    angleDeg: clampNum(raw.angleDeg, EDGE_HALFTONE_DEFAULTS.angleDeg, -45, 45),
    contrast: clampNum(raw.contrast, EDGE_HALFTONE_DEFAULTS.contrast, 0.5, 3),
    fadePower: clampNum(raw.fadePower, EDGE_HALFTONE_DEFAULTS.fadePower, 0.6, 4),
    mergeDotScale: clampNum(raw.mergeDotScale, EDGE_HALFTONE_DEFAULTS.mergeDotScale, 0.5, 1.2),
    showOnHome: raw.showOnHome === true,
    pattern: normalizePattern(raw.pattern)
  };
}

function clampInt(n, fallback, min, max) {
  const v = Number.parseInt(String(n), 10);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function clampNum(n, fallback, min, max) {
  const v = Number.parseFloat(String(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function normalizePattern(value) {
  const pattern = String(value || EDGE_HALFTONE_DEFAULTS.pattern);
  return pattern === 'grid' || pattern === 'line' || pattern === 'stagger' ? pattern : EDGE_HALFTONE_DEFAULTS.pattern;
}

/** @param {number} y @param {number} height @param {number} [fadePower] */
export function edgeHalftoneLuminanceAtY(y, height, fadePower = EDGE_HALFTONE_DEFAULTS.fadePower) {
  const band = Math.max(1, height);
  const fromBottom = Math.min(1, Math.max(0, (band - y) / band));
  return Math.pow(fromBottom, fadePower);
}

/**
 * @param {number} y canvas y (0 = top, totalH = viewport bottom)
 * @param {number} totalH full canvas height (visibleH + pushPx)
 * @param {ReturnType<typeof resolveEdgeHalftoneConfig>} opts
 */
export function edgeHalftoneDotRadius(y, totalH, opts) {
  const mergeBand = opts.dotPx * 2;
  const mergeR = opts.dotPx * opts.mergeDotScale;
  if (y >= totalH - mergeBand) return mergeR;
  const lum = edgeHalftoneLuminanceAtY(y, totalH, opts.fadePower);
  return dotRadiusFromLuminance(lum, opts.dotPx, opts.contrast);
}

function readPageBackgroundColor() {
  if (typeof document === 'undefined') return '#eff1f3';
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  if (bodyBg && bodyBg !== 'transparent' && bodyBg !== 'rgba(0, 0, 0, 0)') return bodyBg;
  return '#eff1f3';
}

/** @param {string} colorKey @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function resolveEdgeHalftoneFillColor(colorKey, cfg) {
  const key = String(colorKey || 'paper').trim();
  if (key === 'paper') return readPageBackgroundColor();
  const token = resolveColor(key, cfg);
  if (token && (token.startsWith('#') || token.startsWith('rgb'))) return token;
  return readPageBackgroundColor();
}

/** @param {Document | { getElementById?: (id: string) => unknown }} [root] */
export function landingFooterOffset(root) {
  const doc = root ?? (typeof document !== 'undefined' ? document : null);
  if (!doc) return 0;
  const landing = doc.getElementById?.('landing') ?? doc.querySelector?.('#landing');
  if (!landing || landing.classList?.contains('is-hidden')) return 0;
  const foot = landing.querySelector?.('.landing-foot');
  return foot && Number.isFinite(foot.offsetHeight) ? foot.offsetHeight : 0;
}

/** @param {Document | { getElementById?: (id: string) => unknown }} [root] */
export function isHomeView(root) {
  const doc = root ?? (typeof document !== 'undefined' ? document : null);
  if (!doc) return false;
  const landing = doc.getElementById?.('landing') ?? doc.querySelector?.('#landing');
  return Boolean(landing && !landing.classList?.contains('is-hidden'));
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} cssW
 * @param {number} visibleH visible band height (viewport clip)
 * @param {number} pushPx height pushed below viewport
 * @param {string} fillColor
 * @param {ReturnType<typeof resolveEdgeHalftoneConfig>} opts
 */
export function renderEdgeHalftoneCanvas(canvas, cssW, visibleH, pushPx, fillColor, opts) {
  const width = Math.max(1, Math.round(cssW));
  const totalH = Math.max(1, Math.round(visibleH + pushPx));
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(totalH * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${totalH}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, totalH);

  const points = halftoneGridPoints(width, totalH, opts.dotPx, opts.pattern, opts.angleDeg);
  for (const { x, y } of points) {
    const dotR = edgeHalftoneDotRadius(y, totalH, opts);
    if (dotR < 0.15) continue;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * @param {import('./gallery-config.js').GalleryConfig | undefined} cfg
 * @param {HTMLElement} [root]
 */
export function mountEdgeHalftone(cfg, root = document.body) {
  const opts = resolveEdgeHalftoneConfig(cfg);
  if (!opts.enabled) return { destroy() {}, refresh() {} };

  let wrap = root.querySelector('.edge-halftone');
  if (!(wrap instanceof HTMLElement)) {
    wrap = document.createElement('div');
    wrap.className = 'edge-halftone';
    wrap.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.className = 'edge-halftone__canvas';
    const cap = document.createElement('div');
    cap.className = 'edge-halftone__cap';
    wrap.appendChild(canvas);
    wrap.appendChild(cap);
    root.appendChild(wrap);
  }

  let cap = wrap.querySelector('.edge-halftone__cap');
  if (!(cap instanceof HTMLElement)) {
    cap = document.createElement('div');
    cap.className = 'edge-halftone__cap';
    wrap.appendChild(cap);
  }

  const canvas = wrap.querySelector('.edge-halftone__canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    return { destroy() {}, refresh() {} };
  }

  let resizeTimer = 0;

  function updateOffset() {
    wrap.style.bottom = `${landingFooterOffset(document)}px`;
  }

  function paint() {
    if (!opts.showOnHome && isHomeView(document)) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    updateOffset();

    const { visibleH, pushPx } = resolveEdgeHalftoneLayout(opts);
    wrap.style.height = `${visibleH}px`;
    wrap.style.setProperty('--edge-halftone-cap', `${opts.dotPx / 2}px`);

    const fillColor = resolveEdgeHalftoneFillColor(opts.color, cfg);
    cap.style.backgroundColor = fillColor;

    renderEdgeHalftoneCanvas(
      canvas,
      window.innerWidth,
      visibleH,
      pushPx,
      fillColor,
      opts
    );
  }

  function refresh() {
    paint();
  }

  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refresh, 120);
  }

  paint();
  window.addEventListener('resize', onResize);

  return {
    refresh,
    destroy() {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      wrap?.remove();
    }
  };
}
