/**
 * Site-wide canvas grain + per-target riso fringes (magenta/cyan from SourceAlpha).
 * Targets: poster titles, prose headings, image/table borders, iso ink shadow.
 */

export const RISOGRAPH_TARGET_KEYS = [
  'landingName',
  'posterTitle',
  'heading',
  'imageBorder',
  'imageCaption',
  'tableBorder',
  'isoShadow'
];

export const RISOGRAPH_TARGET_DEFAULTS = {
  landingName: 1,
  posterTitle: 1,
  heading: 0.75,
  imageBorder: 0.85,
  imageCaption: 0.85,
  tableBorder: 0.85,
  isoShadow: 1
};

export const RISOGRAPH_DEFAULTS = {
  enabled: false,
  grainAmount: 0.5,
  misregistration: 2.4,
  strength: 0.46,
  targets: { ...RISOGRAPH_TARGET_DEFAULTS }
};

const DEFS_ID = 'md-riso-defs';
const SITE_GRAIN_ID = 'md-riso-site-grain';
const CARD_CLASS = 'post-card--riso';
const LEGACY_CARD_CLASS = 'post-card--riso-title';
const CARD_SELECTOR =
  '#landing .post-card, #posters .post-card, .reader-more-cases .post-card';

/** @type {ResizeObserver | null} */
let siteGrainRo = null;
/** @type {number} */
let siteGrainPaintTick = 0;
/** @type {number} */
let expandCutoutRaf = 0;

/**
 * @param {unknown} patch
 */
export function resolveRisographConfig(patch = {}) {
  const src = patch && typeof patch === 'object' ? patch : {};
  const targetPatch = src.targets && typeof src.targets === 'object' ? src.targets : {};
  /** @type {Record<string, number>} */
  const targets = {};
  for (const key of RISOGRAPH_TARGET_KEYS) {
    targets[key] = clamp(
      Number(targetPatch[key]),
      0,
      4,
      RISOGRAPH_TARGET_DEFAULTS[key] ?? 1
    );
  }
  return {
    enabled: Boolean(src.enabled),
    grainAmount: clamp01(Number(src.grainAmount), RISOGRAPH_DEFAULTS.grainAmount),
    misregistration: clamp(
      Number(src.misregistration),
      0,
      20,
      RISOGRAPH_DEFAULTS.misregistration
    ),
    strength: clamp01(Number(src.strength), RISOGRAPH_DEFAULTS.strength),
    targets
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
 * @param {number} misregPx
 */
function filterIdFor(misregPx) {
  return `md-riso-fringe-${Math.round(misregPx * 100)}`;
}

/**
 * Magenta/cyan alpha fringes at a given offset.
 * @param {string} id
 * @param {number} misregPx
 */
function buildFringeFilterXml(id, misregPx) {
  const off = clamp(misregPx, 0, 20, 0);
  if (off <= 0.01) return '';
  const dxR = (-off).toFixed(2);
  const dyR = (off * 0.5).toFixed(2);
  const dxB = (off * 0.7).toFixed(2);
  const dyB = (-off * 0.6).toFixed(2);
  const fringeOp = Math.min(0.9, 0.35 + off * 0.08).toFixed(3);
  return `<filter id="${id}" x="-12%" y="-18%" width="124%" height="136%" color-interpolation-filters="sRGB">
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
      </filter>`;
}

/**
 * @param {Document} doc
 * @param {ReturnType<typeof resolveRisographConfig>} opts
 * @returns {Record<string, string>}
 */
export function ensureFringeFilters(doc, opts) {
  /** @type {Map<string, number>} */
  const unique = new Map();
  /** @type {Record<string, string>} */
  const byTarget = {};

  for (const key of RISOGRAPH_TARGET_KEYS) {
    const intensity = opts.targets[key] ?? 0;
    const misregPx = opts.misregistration * opts.strength * intensity;
    if (intensity <= 0 || misregPx <= 0.01) {
      byTarget[key] = 'none';
      continue;
    }
    const id = filterIdFor(misregPx);
    unique.set(id, misregPx);
    byTarget[key] = `url(#${id})`;
  }

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

  const xml = [...unique.entries()]
    .map(([id, px]) => buildFringeFilterXml(id, px))
    .filter(Boolean)
    .join('\n');
  host.innerHTML = `<defs>${xml}</defs>`;
  return byTarget;
}

/**
 * Sparse fleck grain for one polarity.
 * @param {HTMLCanvasElement} canvas
 * @param {number} cssW
 * @param {number} cssH
 * @param {number} amount
 * @param {'light' | 'dark'} [polarity]
 */
export function paintRisographGrain(canvas, cssW, cssH, amount, polarity = 'light') {
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
  // Dual layers: light flecks (screen) on dark grounds; dark flecks (multiply) on pale grounds.
  const density = Math.min(0.18, 0.05 + amount * 0.18);
  const alphaCap = Math.round(36 + amount * 80);
  const light = polarity !== 'dark';
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > density) {
      data[i + 3] = 0;
      continue;
    }
    const v = light
      ? 210 + Math.floor(Math.random() * 46)
      : Math.floor(Math.random() * 48);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = Math.min(255, Math.round(alphaCap * (0.35 + Math.random() * 0.65)));
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Punch site grain out over the expanded photo (borders/caption keep grain).
 */
export function syncRisographGrainExpandCutout() {
  const layer = document.getElementById(SITE_GRAIN_ID);
  if (!(layer instanceof HTMLElement)) return;

  const expanded = document.documentElement.classList.contains(
    'is-portfolio-image-expanded'
  );
  const img = document.querySelector(
    '.portfolio-image-expand.is-open .portfolio-image-expand__img'
  );
  if (!expanded || !(img instanceof HTMLElement)) {
    layer.classList.remove('riso-site-grain--cutout');
    layer.style.removeProperty('--riso-cut-x');
    layer.style.removeProperty('--riso-cut-y');
    layer.style.removeProperty('--riso-cut-w');
    layer.style.removeProperty('--riso-cut-h');
    return;
  }

  const r = img.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) {
    layer.classList.remove('riso-site-grain--cutout');
    return;
  }

  layer.classList.add('riso-site-grain--cutout');
  layer.style.setProperty('--riso-cut-x', `${r.left}px`);
  layer.style.setProperty('--riso-cut-y', `${r.top}px`);
  layer.style.setProperty('--riso-cut-w', `${r.width}px`);
  layer.style.setProperty('--riso-cut-h', `${r.height}px`);
}

/** Keep the cutout aligned while the expand FLIP runs / viewport changes. */
export function startRisographGrainExpandCutout() {
  if (typeof requestAnimationFrame !== 'function') {
    syncRisographGrainExpandCutout();
    return;
  }
  const tick = () => {
    syncRisographGrainExpandCutout();
    if (document.documentElement.classList.contains('is-portfolio-image-expanded')) {
      expandCutoutRaf = requestAnimationFrame(tick);
    } else {
      expandCutoutRaf = 0;
      syncRisographGrainExpandCutout();
    }
  };
  if (!expandCutoutRaf) expandCutoutRaf = requestAnimationFrame(tick);
}

export function stopRisographGrainExpandCutout() {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(expandCutoutRaf);
  }
  expandCutoutRaf = 0;
  syncRisographGrainExpandCutout();
}

function unmountSiteGrain() {
  stopRisographGrainExpandCutout();
  document.getElementById(SITE_GRAIN_ID)?.remove();
  siteGrainRo?.disconnect();
  siteGrainRo = null;
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(siteGrainPaintTick);
  }
  siteGrainPaintTick = 0;
  document.documentElement.classList.remove('has-riso-site-grain');
}

function clearDocumentRisoVars() {
  const root = document.documentElement;
  root.classList.remove('has-riso');
  for (const key of RISOGRAPH_TARGET_KEYS) {
    root.style.removeProperty(`--riso-filter-${key}`);
  }
}

/**
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
    document.body.appendChild(layer);
  }

  /** @type {HTMLCanvasElement | null} */
  let lightCanvas = layer.querySelector('.riso-site-grain__canvas--light');
  /** @type {HTMLCanvasElement | null} */
  let darkCanvas = layer.querySelector('.riso-site-grain__canvas--dark');
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
    lightCanvas.className = 'riso-site-grain__canvas riso-site-grain__canvas--light';
    layer.appendChild(lightCanvas);
  }
  if (!darkCanvas) {
    darkCanvas = document.createElement('canvas');
    darkCanvas.className = 'riso-site-grain__canvas riso-site-grain__canvas--dark';
    layer.appendChild(darkCanvas);
  }
  // Drop legacy single-canvas nodes from earlier builds.
  for (const el of layer.querySelectorAll('canvas')) {
    if (el !== lightCanvas && el !== darkCanvas) el.remove();
  }

  document.documentElement.classList.add('has-riso-site-grain');

  const paint = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    paintRisographGrain(lightCanvas, w, h, grainAmount, 'light');
    paintRisographGrain(darkCanvas, w, h, grainAmount, 'dark');
    syncRisographGrainExpandCutout();
  };
  paint();

  if (document.documentElement.classList.contains('is-portfolio-image-expanded')) {
    startRisographGrainExpandCutout();
  }

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
function unmountCardRiso(card) {
  card.classList.remove(CARD_CLASS, LEGACY_CARD_CLASS);
  for (const key of RISOGRAPH_TARGET_KEYS) {
    card.style.removeProperty(`--riso-filter-${key}`);
  }
  card.style.removeProperty('--riso-title-filter');
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

  for (const el of root.querySelectorAll?.(`.${CARD_CLASS}, .${LEGACY_CARD_CLASS}`) || []) {
    if (el instanceof HTMLElement) unmountCardRiso(el);
  }

  if (!opts.enabled || opts.strength <= 0) {
    unmountSiteGrain();
    clearDocumentRisoVars();
    return;
  }

  const filters = ensureFringeFilters(document, opts);
  mountSiteGrain(opts.grainAmount * opts.strength);

  const html = document.documentElement;
  html.classList.add('has-riso');
  for (const key of RISOGRAPH_TARGET_KEYS) {
    html.style.setProperty(`--riso-filter-${key}`, filters[key] || 'none');
  }

  const anyFringe = RISOGRAPH_TARGET_KEYS.some((k) => filters[k] && filters[k] !== 'none');
  if (!anyFringe) return;

  for (const card of cards) {
    card.classList.add(CARD_CLASS);
    for (const key of RISOGRAPH_TARGET_KEYS) {
      card.style.setProperty(`--riso-filter-${key}`, filters[key] || 'none');
    }
  }
}
