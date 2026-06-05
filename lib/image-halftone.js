/**
 * Colored AM halftone for poster prose images — newspaper dot screen, image pixel colors.
 * Independent of glyph/type patterns. Config: `theme.graphics.imageHalftone` (see `lib/image-halftone-config.js`).
 */

import {
  IMAGE_HALFTONE_DEFAULTS,
  resolveImageHalftoneOptions,
  isPosterImageHalftoneEnabled
} from './image-halftone-config.js';

export { isPosterImageHalftoneEnabled, resolveImageHalftoneOptions, IMAGE_HALFTONE_DEFAULTS };

/**
 * @param {number} lum 0 (dark) … 1 (light)
 * @param {number} cellSize
 * @param {number} [contrast]
 */
export function dotRadiusFromLuminance(lum, cellSize, contrast = IMAGE_HALFTONE_DEFAULTS.contrast) {
  const clamped = Math.min(1, Math.max(0, lum));
  const ink = 1 - clamped;
  const curved = Math.pow(ink, 1 / Math.max(0.5, contrast));
  return (curved * cellSize) / 2 * 0.96;
}

/** @param {number} v */
function clampByte(v) {
  return Math.min(255, Math.max(0, Math.round(v)));
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} saturation
 * @param {number} contrast
 */
export function boostSampleColor(
  r,
  g,
  b,
  saturation = IMAGE_HALFTONE_DEFAULTS.saturation,
  contrast = IMAGE_HALFTONE_DEFAULTS.contrast
) {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let r2 = lum + (r - lum) * saturation;
  let g2 = lum + (g - lum) * saturation;
  let b2 = lum + (b - lum) * saturation;
  r2 = (r2 - 128) * contrast + 128;
  g2 = (g2 - 128) * contrast + 128;
  b2 = (b2 - 128) * contrast + 128;
  return { r: clampByte(r2), g: clampByte(g2), b: clampByte(b2) };
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} w
 * @param {number} h
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 */
function averageSample(data, w, h, cx, cy, radius) {
  const r = Math.max(1, Math.round(radius));
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let lumSum = 0;
  let count = 0;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * w + x) * 4;
      const rPx = data[i];
      const gPx = data[i + 1];
      const bPx = data[i + 2];
      rSum += rPx;
      gSum += gPx;
      bSum += bPx;
      lumSum += (0.2126 * rPx + 0.7152 * gPx + 0.0722 * bPx) / 255;
      count++;
    }
  }
  if (!count) return { r: 255, g: 255, b: 255, lum: 1 };
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
    lum: lumSum / count
  };
}

/**
 * @param {number} w
 * @param {number} h
 * @param {number} cellSize
 * @param {string} pattern
 * @param {number} angleDeg
 */
export function halftoneGridPoints(w, h, cellSize, pattern, angleDeg) {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = w / 2;
  const cy = h / 2;
  const extent = Math.ceil(Math.hypot(w, h)) + cellSize * 2;
  const rowStep = pattern === 'stagger' ? cellSize * 0.8660254 : cellSize;
  const colStep = cellSize;
  const points = [];

  for (let row = 0, gy = -extent; gy <= extent; row++, gy += rowStep) {
    const xShift = pattern === 'stagger' && row % 2 !== 0 ? colStep / 2 : 0;
    for (let gx = -extent + xShift; gx <= extent; gx += colStep) {
      const x = cos * gx - sin * gy + cx;
      const y = sin * gx + cos * gy + cy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * @param {HTMLCanvasElement} source
 * @param {CanvasRenderingContext2D} outCtx
 * @param {{ cellSize?: number, paperColor?: string, contrast?: number, saturation?: number, pattern?: string, angleDeg?: number }} opts
 */
export function drawHalftone(source, outCtx, opts = {}) {
  const cellSize = Math.max(3, opts.cellSize ?? IMAGE_HALFTONE_DEFAULTS.dotPx);
  const contrast = Number.isFinite(opts.contrast) ? opts.contrast : IMAGE_HALFTONE_DEFAULTS.contrast;
  const saturation = Number.isFinite(opts.saturation) ? opts.saturation : IMAGE_HALFTONE_DEFAULTS.saturation;
  const paperColor = opts.paperColor || '#ffffff';
  const pattern = opts.pattern ?? IMAGE_HALFTONE_DEFAULTS.pattern;
  const angleDeg = Number.isFinite(opts.angleDeg) ? opts.angleDeg : IMAGE_HALFTONE_DEFAULTS.angleDeg;
  const w = source.width;
  const h = source.height;
  const srcCtx = source.getContext('2d');
  if (!srcCtx || !outCtx) return false;
  const srcData = srcCtx.getImageData(0, 0, w, h).data;

  outCtx.fillStyle = paperColor;
  outCtx.fillRect(0, 0, w, h);

  const sampleR = cellSize * 0.45;
  let drew = false;
  const points = halftoneGridPoints(w, h, cellSize, pattern, angleDeg);

  for (const { x, y } of points) {
    const sample = averageSample(srcData, w, h, x, y, sampleR);
    const dotR = dotRadiusFromLuminance(sample.lum, cellSize, contrast);
    if (dotR < 0.2) continue;
    const color = boostSampleColor(sample.r, sample.g, sample.b, saturation, contrast);
    outCtx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    outCtx.beginPath();
    outCtx.arc(x, y, dotR, 0, Math.PI * 2);
    outCtx.fill();
    drew = true;
  }
  return drew;
}

/**
 * @param {HTMLElement} card
 * @param {string} paperKey
 */
function resolvePaperColor(card, paperKey) {
  const cardStyle = getComputedStyle(card);
  if (paperKey === 'paper') {
    const rootStyle = getComputedStyle(document.documentElement);
    return (
      rootStyle.getPropertyValue('--config-paper').trim() ||
      rootStyle.getPropertyValue('--paper').trim() ||
      '#eff1f3'
    );
  }
  if (paperKey === 'surface') {
    return cardStyle.getPropertyValue('--surface').trim() || cardStyle.backgroundColor || '#ffffff';
  }
  return paperKey;
}

/** @param {HTMLImageElement} img */
function prepareCrossOrigin(img) {
  if (img.dataset.halftoneCrossOrigin) return;
  try {
    const url = new URL(img.currentSrc || img.src, window.location.href);
    if (url.origin !== window.location.origin && !img.crossOrigin) {
      img.crossOrigin = 'anonymous';
      img.dataset.halftoneCrossOrigin = '1';
    }
  } catch {
    /* ignore bad URLs */
  }
}

/** @param {HTMLImageElement} img */
function whenImageReady(img) {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
      resolve();
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    if (typeof img.decode === 'function') {
      img.decode().then(done).catch(done);
    }
  });
}

function whenLayoutReady() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/**
 * @param {HTMLImageElement} img
 * @param {HTMLElement} wrap
 * @param {HTMLElement} card
 */
function measureDisplaySize(img, wrap, card) {
  const stored = Number(wrap.dataset.halftoneDisplayW);
  if (Number.isFinite(stored) && stored > 0) {
    const ar = img.naturalWidth / img.naturalHeight;
    return { w: stored, h: Math.max(1, Math.round(stored / ar)) };
  }

  const wasActive = wrap.classList.contains('halftone--active');
  if (wasActive) wrap.classList.remove('halftone--active');

  const prose = card.querySelector('.prose');
  const containerW = Math.max(wrap.clientWidth, prose?.clientWidth ?? 0, img.clientWidth, img.offsetWidth);

  if (wasActive) wrap.classList.add('halftone--active');

  const displayW = containerW > 0 ? containerW : img.naturalWidth;
  const displayH = Math.max(1, Math.round((displayW * img.naturalHeight) / img.naturalWidth));
  return { w: Math.max(1, displayW), h: displayH };
}

/** @param {HTMLElement} wrap */
function deactivateHalftone(wrap) {
  wrap.classList.remove('halftone--active');
  const img = wrap.querySelector('img');
  if (img instanceof HTMLImageElement) img.classList.remove('halftone__source');
}

/**
 * @param {HTMLImageElement} img
 * @param {HTMLElement} card
 * @param {import('./gallery-config.js').GalleryConfig | undefined} cfg
 */
async function renderHalftoneForImage(img, card, cfg) {
  const wrap = img.closest('.halftone');
  if (!(wrap instanceof HTMLElement)) return;

  let canvas = wrap.querySelector('.halftone__canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    canvas = document.createElement('canvas');
    canvas.className = 'halftone__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    wrap.insertBefore(canvas, img);
  }

  const runId = String(Number(wrap.dataset.halftoneRun || 0) + 1);
  wrap.dataset.halftoneRun = runId;

  prepareCrossOrigin(img);
  await whenImageReady(img);
  await whenLayoutReady();

  if (wrap.dataset.halftoneRun !== runId) return;
  if (!img.naturalWidth || !img.naturalHeight) {
    deactivateHalftone(wrap);
    return;
  }

  const { w: displayW, h: displayH } = measureDisplaySize(img, wrap, card);
  wrap.dataset.halftoneDisplayW = String(displayW);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(displayW * dpr));
  const h = Math.max(1, Math.round(displayH * dpr));

  const source = document.createElement('canvas');
  source.width = w;
  source.height = h;
  const sctx = source.getContext('2d');
  if (!sctx) {
    deactivateHalftone(wrap);
    return;
  }

  try {
    sctx.drawImage(img, 0, 0, w, h);
    sctx.getImageData(0, 0, 1, 1);
  } catch {
    deactivateHalftone(wrap);
    return;
  }

  if (wrap.dataset.halftoneRun !== runId) return;

  canvas.width = w;
  canvas.height = h;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${w} / ${h}`;

  const outCtx = canvas.getContext('2d');
  if (!outCtx) {
    deactivateHalftone(wrap);
    return;
  }

  const opts = resolveImageHalftoneOptions(cfg);
  const cellSize = Math.max(3, opts.dotPx * dpr);
  const paperColor = resolvePaperColor(card, opts.paper);
  wrap.style.backgroundColor = paperColor;

  const drew = drawHalftone(source, outCtx, {
    cellSize,
    paperColor,
    contrast: opts.contrast,
    saturation: opts.saturation,
    pattern: opts.pattern,
    angleDeg: opts.angleDeg
  });

  if (!drew) {
    deactivateHalftone(wrap);
    return;
  }

  wrap.classList.add('halftone--active');
  img.classList.add('halftone__source');
}

/** @param {HTMLElement} wrap */
function unwrapHalftone(wrap) {
  wrap.style.backgroundColor = '';
  const img = wrap.querySelector('img.halftone__source, img');
  if (img instanceof HTMLImageElement) {
    img.classList.remove('halftone__source');
    wrap.replaceWith(img);
  } else {
    wrap.remove();
  }
}

/** @param {HTMLImageElement} img */
function wrapImage(img) {
  if (img.closest('.halftone')) return img.closest('.halftone');
  const wrap = document.createElement('div');
  wrap.className = 'halftone';
  img.parentNode?.insertBefore(wrap, img);
  wrap.appendChild(img);
  return wrap;
}

/** @param {HTMLImageElement} img */
function ensureImageLazyAttrs(img) {
  if (!img.hasAttribute('loading')) img.loading = 'lazy';
  if (!img.hasAttribute('decoding')) img.decoding = 'async';
}

const HALFTONE_VISIBLE_MARGIN = '240px 0px';

/** @param {HTMLImageElement} img @param {HTMLElement} card @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
function scheduleHalftone(img, card, cfg) {
  const run = () => void renderHalftoneForImage(img, card, cfg);
  if (img.complete && img.naturalWidth > 0) {
    run();
    return;
  }
  img.addEventListener('load', run, { once: true });
  img.addEventListener('error', run, { once: true });
}

/** @param {HTMLImageElement} img @param {HTMLElement} card @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
function scheduleHalftoneWhenVisible(img, card, cfg) {
  ensureImageLazyAttrs(img);
  const start = () => scheduleHalftone(img, card, cfg);

  if (typeof IntersectionObserver !== 'function') {
    start();
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    { root: null, rootMargin: HALFTONE_VISIBLE_MARGIN, threshold: 0.01 }
  );
  io.observe(img);
}

/** @param {ParentNode} root @param {import('./gallery-config.js').GalleryConfig | undefined} cfg */
export function enhancePosterImageHalftone(root, cfg) {
  const enabled = isPosterImageHalftoneEnabled(cfg);
  const cards = root.querySelectorAll('.post-card');

  for (const card of cards) {
    if (!(card instanceof HTMLElement)) continue;

    card.querySelectorAll('.prose img').forEach((node) => {
      if (node instanceof HTMLImageElement) ensureImageLazyAttrs(node);
    });

    if (!enabled) {
      card.querySelectorAll('.halftone').forEach((wrap) => {
        if (wrap instanceof HTMLElement) unwrapHalftone(wrap);
      });
      continue;
    }

    const images = card.querySelectorAll('.prose img');
    for (const img of images) {
      if (!(img instanceof HTMLImageElement)) continue;
      if (img.closest('.halftone')) continue;
      wrapImage(img);
    }

    const wrapped = card.querySelectorAll('.halftone');
    for (const wrap of wrapped) {
      const img = wrap.querySelector('img');
      if (!(img instanceof HTMLImageElement)) continue;
      scheduleHalftoneWhenVisible(img, card, cfg);
    }
  }
}
