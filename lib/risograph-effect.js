/**
 * Site-wide canvas grain + titles-only riso fringe (magenta/cyan from SourceAlpha).
 */

export const RISOGRAPH_DEFAULTS = {
  enabled: false,
  grainAmount: 0.5,
  misregistration: 2.4,
  strength: 0.46
};

const DEFS_ID = 'md-riso-defs';
const FILTER_ID = 'md-riso-title';
const SITE_GRAIN_ID = 'md-riso-site-grain';
const CARD_SELECTOR =
  '#landing .post-card, #posters .post-card, .reader-more-cases .post-card';

/** @type {ResizeObserver | null} */
let siteGrainRo = null;
/** @type {number} */
let siteGrainPaintTick = 0;

/**
 * @param {unknown} patch
 */
export function resolveRisographConfig(patch = {}) {
  const src = patch && typeof patch === 'object' ? patch : {};
  return {
    enabled: Boolean(src.enabled),
    grainAmount: clamp01(Number(src.grainAmount), RISOGRAPH_DEFAULTS.grainAmount),
    misregistration: clamp(
      Number(src.misregistration),
      0,
      20,
      RISOGRAPH_DEFAULTS.misregistration
    ),
    strength: clamp01(Number(src.strength), RISOGRAPH_DEFAULTS.strength)
  };
}

/**
 * @param {{ theme?: { risograph?: unknown } }} [cfg]
 */
export function resolveRisographFromGalleryConfig(cfg = {}) {
  return resolveRisographConfig(cfg.theme?.risograph);
}

function clamp01(n, fallback) {
  return clamp(n, 0, 1, fallback);
}

function clamp(n, min, max, fallback) {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Titles-only riso: magenta/cyan fringes from SourceAlpha.
 * @param {Document} doc
 * @param {number} misregPx
 */
function ensureTitleFilter(doc, misregPx) {
  const off = clamp(misregPx, 0, 20, 0);

  let host = doc.getElementById(DEFS_ID);
  if (!host) {
    host = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    host.id = DEFS_ID;
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('width', '0');
    host.setAttribute('height', '0');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    doc.body.prepend(host);
  }

  if (off <= 0.01) {
    host.innerHTML = '';
    return 'none';
  }

  const dxR = (-off).toFixed(2);
  const dyR = (off * 0.5).toFixed(2);
  const dxB = (off * 0.7).toFixed(2);
  const dyB = (-off * 0.6).toFixed(2);
  const fringeOp = Math.min(0.9, 0.35 + off * 0.08).toFixed(3);

  host.innerHTML = `<defs>
      <filter id="${FILTER_ID}" x="-12%" y="-18%" width="124%" height="136%" color-interpolation-filters="sRGB">
        <feOffset in="SourceAlpha" dx="${dxR}" dy="${dyR}" result="aR"/>
        <feFlood flood-color="#e10f6a" flood-opacity="${fringeOp}" result="floodR"/>
        <feComposite in="floodR" in2="aR" operator="in" result="fringeR"/>
        <feOffset in="SourceAlpha" dx="${dxB}" dy="${dyB}" result="aB"/>
        <feFlood flood-color="#1a6bff" flood-opacity="${fringeOp}" result="floodB"/>
        <feComposite in="floodB" in2="aB" operator="in" result="fringeB"/>
        <feMerge>
          <feMergeNode in="fringeR"/>
          <feMergeNode in="fringeB"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;
  return `url(#${FILTER_ID})`;
}

/**
 * Original branch-start canvas grain (sparse ImageData noise).
 * @param {HTMLCanvasElement} canvas
 * @param {number} cssW
 * @param {number} cssH
 * @param {number} amount effective grain 0–1
 */
export function paintRisographGrain(canvas, cssW, cssH, amount) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const amp = Math.round(255 * amount * 0.2);
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() * 2 - 1) * amp;
    const v = 128 + n;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = Math.min(255, Math.abs(n) * 2.4);
  }
  ctx.putImageData(img, 0, 0);
}

function unmountSiteGrain() {
  document.getElementById(SITE_GRAIN_ID)?.remove();
  siteGrainRo?.disconnect();
  siteGrainRo = null;
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(siteGrainPaintTick);
  }
  siteGrainPaintTick = 0;
  document.documentElement.classList.remove('has-riso-site-grain');
}

/**
 * Fixed viewport grain over the whole site (not title boxes).
 * @param {number} grainAmount
 */
function mountSiteGrain(grainAmount) {
  if (grainAmount <= 0.01) {
    unmountSiteGrain();
    return;
  }

  let layer = document.getElementById(SITE_GRAIN_ID);
  if (!layer) {
    layer = document.createElement('div');
    layer.id = SITE_GRAIN_ID;
    layer.className = 'riso-site-grain';
    layer.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.className = 'riso-site-grain__canvas';
    layer.appendChild(canvas);
    document.body.appendChild(layer);
  }

  document.documentElement.classList.add('has-riso-site-grain');
  const canvas = layer.querySelector('canvas');
  if (!canvas || typeof canvas.getContext !== 'function') return;

  const paint = () => {
    paintRisographGrain(canvas, window.innerWidth, window.innerHeight, grainAmount);
  };
  paint();

  siteGrainRo?.disconnect();
  if (typeof ResizeObserver !== 'undefined') {
    siteGrainRo = new ResizeObserver(() => {
      if (typeof requestAnimationFrame === 'function') {
        cancelAnimationFrame(siteGrainPaintTick);
        siteGrainPaintTick = requestAnimationFrame(paint);
      } else {
        paint();
      }
    });
    siteGrainRo.observe(document.documentElement);
  }
}

/**
 * @param {HTMLElement} card
 */
function unmountTitleRiso(card) {
  card.classList.remove('post-card--riso-title');
  card.style.removeProperty('--riso-title-filter');
  // Clear any legacy title-box grain from earlier experiments
  card.querySelectorAll('.post-card__riso-title-grain').forEach((el) => el.remove());
}

/**
 * @param {ParentNode} [root]
 * @param {{ theme?: { risograph?: unknown } }} [cfg]
 */
export function applyRisographEffects(root = document, cfg = {}) {
  const opts = resolveRisographFromGalleryConfig(cfg);
  const cards = Array.from(root.querySelectorAll?.(CARD_SELECTOR) || []).filter(
    (el) => el instanceof HTMLElement
  );

  for (const el of root.querySelectorAll?.('.post-card--riso-title') || []) {
    if (el instanceof HTMLElement) unmountTitleRiso(el);
  }

  if (!opts.enabled || opts.strength <= 0) {
    unmountSiteGrain();
    return;
  }

  const filterValue = ensureTitleFilter(
    document,
    opts.misregistration * opts.strength
  );
  const grainAmount = opts.grainAmount * opts.strength;

  mountSiteGrain(grainAmount);

  if (filterValue === 'none') return;

  for (const card of cards) {
    card.classList.add('post-card--riso-title');
    card.style.setProperty('--riso-title-filter', filterValue);
  }
}
