/**
 * Expand reader prose images in-place (FLIP into viewport margins, no modal overlay).
 * Ported from md-slideshow/lib/slideshow-image-expand.js — flat iso frames only.
 */

const EXPAND_MS = 320;
const EXPAND_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const COLLAPSE_EASE = 'cubic-bezier(0.42, 0, 0.58, 1)';

/** @type {AbortController | null} */
let activeController = null;

/** @type {HTMLElement | null} */
let rootEl = null;

/** @type {HTMLElement | null} */
let scrimEl = null;

/** @type {HTMLElement | null} */
let frameEl = null;

/** @type {HTMLImageElement | null} */
let imgEl = null;

/** @type {HTMLElement | null} */
let captionEl = null;

/** @type {HTMLButtonElement | null} */
let closeEl = null;

/** @type {HTMLElement | null} */
let sourceEl = null;

/** @type {HTMLElement | null} */
let activeWrapEl = null;

/** @type {number} */
let closeTimer = 0;

/**
 * @param {string} name
 * @param {HTMLElement} [from]
 */
function readCssLength(name, from = document.documentElement) {
  const raw = getComputedStyle(from).getPropertyValue(name).trim();
  if (!raw) return 0;
  if (raw.endsWith('px')) return Number.parseFloat(raw) || 0;
  const probe = document.createElement('div');
  probe.style.cssText = `position:absolute;visibility:hidden;height:${raw}`;
  from.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px || 0;
}

/**
 * Viewport content box for expanded images (reader padding, below header).
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function portfolioExpandBounds() {
  const gapFallback = 24;
  const padFallback = gapFallback * 2;
  if (typeof document === 'undefined') {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: padFallback,
      y: padFallback,
      w: Math.max(1, vw - padFallback * 2),
      h: Math.max(1, vh - padFallback * 2)
    };
  }

  const root =
    document.querySelector('.page-reader .collection-feed') ||
    document.querySelector('.page-reader') ||
    document.documentElement;
  const gap = readCssLength('--layout-gap', root) || gapFallback;
  const pad =
    readCssLength('--pad', root) ||
    readCssLength('--space-page-inline', root) ||
    gap * 2;
  const header = document.querySelector('.site-header--reader');
  const headerH = header?.getBoundingClientRect().height ?? 0;
  const closeReserve = readCssLength('--portfolio-expand-close-reserve', document.documentElement);
  const top = Math.max(pad, headerH + gap * 0.25) + closeReserve;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return {
    x: pad,
    y: top,
    w: Math.max(1, vw - pad * 2),
    h: Math.max(1, vh - top - pad)
  };
}

/**
 * @param {number} nw
 * @param {number} nh
 * @param {{ x: number, y: number, w: number, h: number }} box
 */
export function containRect(nw, nh, box) {
  const aspect = nw > 0 && nh > 0 ? nw / nh : 16 / 10;
  let w = box.w;
  let h = w / aspect;
  if (h > box.h) {
    h = box.h;
    w = h * aspect;
  }
  return {
    x: box.x + (box.w - w) / 2,
    y: box.y + (box.h - h) / 2,
    w,
    h
  };
}

/**
 * @param {HTMLImageElement} img
 * @returns {string}
 */
export function resolveExpandCaption(img) {
  const isoCaption = img
    .closest('.prose-img-iso__frame')
    ?.querySelector('.prose-img-iso__caption');
  const isoText = isoCaption?.textContent?.trim();
  if (isoText) return isoText;

  const title = img.getAttribute('title')?.trim();
  if (title) return title;

  return img.getAttribute('alt')?.trim() || '';
}

/**
 * @param {Element | null} target
 * @returns {HTMLImageElement | null}
 */
function resolveExpandImage(target) {
  if (!(target instanceof Element)) return null;
  const frame = target.closest('.prose-img-iso__frame, .prose-img--expandable-wrap');
  if (frame) {
    const img = frame.querySelector('img');
    return img instanceof HTMLImageElement ? img : null;
  }
  if (target instanceof HTMLImageElement && target.closest('.prose')) {
    return target;
  }
  return null;
}

/** @param {HTMLImageElement} img */
function sourceVisual(img) {
  const frame = img.closest('.prose-img-iso__frame');
  return frame instanceof HTMLElement ? frame : img;
}

/** @param {HTMLImageElement} img */
function isIsoSource(img) {
  return Boolean(img.closest('.prose-img-iso__frame'));
}

function ensureExpandUi() {
  if (rootEl) return;

  const root = document.createElement('div');
  root.className = 'portfolio-image-expand';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="portfolio-image-expand__scrim" data-expand-dismiss></div>
    <div class="portfolio-image-expand__frame" role="dialog" aria-modal="true" aria-label="Expanded image">
      <img class="portfolio-image-expand__img" alt="" decoding="async">
      <button type="button" class="portfolio-image-expand__close mono-label" data-expand-dismiss aria-label="Close expanded image">
        <span aria-hidden="true">×</span>
      </button>
      <span class="prose-img-iso__caption mono-label" hidden></span>
    </div>`;

  document.body.appendChild(root);
  rootEl = root;
  scrimEl = root.querySelector('.portfolio-image-expand__scrim');
  frameEl = root.querySelector('.portfolio-image-expand__frame');
  imgEl = root.querySelector('.portfolio-image-expand__img');
  captionEl = root.querySelector('.prose-img-iso__caption');
  closeEl = root.querySelector('.portfolio-image-expand__close');
}

/** @param {boolean} visible */
function setCloseVisible(visible) {
  if (!closeEl) return;
  closeEl.hidden = !visible;
  closeEl.classList.toggle('is-dismissed', !visible);
  if (visible) closeEl.style.removeProperty('display');
  else closeEl.style.display = 'none';
}

/**
 * @param {HTMLElement} el
 */
export function sourceLayoutBox(el) {
  const br = el.getBoundingClientRect();
  const w = Math.max(1, el.offsetWidth);
  const h = Math.max(1, el.offsetHeight);
  return {
    left: br.left + (br.width - w) / 2,
    top: br.top + (br.height - h) / 2,
    width: w,
    height: h
  };
}

/**
 * @param {DOMRect | { left?: number, top?: number, x?: number, y?: number, width?: number, height?: number, w?: number, h?: number }} rect
 * @param {{ borderBox?: boolean }} [opts]
 */
function applyFrameBox(rect, opts = {}) {
  if (!frameEl) return;
  let left = rect.left ?? rect.x ?? 0;
  let top = rect.top ?? rect.y ?? 0;
  let width = rect.width ?? rect.w ?? 0;
  let height = rect.height ?? rect.h ?? 0;

  if (opts.borderBox && frameEl.classList.contains('portfolio-image-expand__frame--iso')) {
    const cs = getComputedStyle(frameEl);
    const bl = Number.parseFloat(cs.borderLeftWidth) || 0;
    const br = Number.parseFloat(cs.borderRightWidth) || 0;
    const bt = Number.parseFloat(cs.borderTopWidth) || 0;
    const bb = Number.parseFloat(cs.borderBottomWidth) || 0;
    left += bl;
    top += bt;
    width = Math.max(1, width - bl - br);
    height = Math.max(1, height - bt - bb);
  }

  frameEl.style.left = `${left}px`;
  frameEl.style.top = `${top}px`;
  frameEl.style.width = `${width}px`;
  frameEl.style.height = `${height}px`;
}

/** @param {boolean} on @param {{ collapsing?: boolean }} [opts] */
function setAnimating(on, opts = {}) {
  if (!frameEl) return;
  frameEl.classList.toggle('is-animating', on);
  if (!on || !opts.collapsing) frameEl.classList.remove('is-collapsing');
  else frameEl.classList.add('is-collapsing');
}

function clearCloseTimer() {
  if (closeTimer) {
    window.clearTimeout(closeTimer);
    closeTimer = 0;
  }
}

function clearExpandSession() {
  sourceEl?.classList.remove('is-expand-source');
  sourceEl = null;
  activeWrapEl?.classList.remove('is-expand-active');
  activeWrapEl = null;
}

/** @param {HTMLImageElement} source */
async function whenReady(source) {
  if (source.complete && source.naturalWidth > 0) return;
  await new Promise((resolve) => {
    source.addEventListener('load', () => resolve(undefined), { once: true });
    source.addEventListener('error', () => resolve(undefined), { once: true });
  });
}

/**
 * @param {HTMLImageElement} source
 */
function applyExpandedChrome(source) {
  if (!frameEl || !imgEl || !captionEl) return;

  const visual = sourceVisual(source);
  const caption = resolveExpandCaption(source);

  sourceEl?.classList.remove('is-expand-source');
  sourceEl = visual;
  visual.classList.add('is-expand-source');

  activeWrapEl?.classList.remove('is-expand-active');
  activeWrapEl = source.closest('.post-card-wrap');
  activeWrapEl?.classList.add('is-expand-active');

  imgEl.src = source.currentSrc || source.src;
  imgEl.alt = source.getAttribute('alt')?.trim() || '';

  const card = source.closest('.post-card');
  const ground = card?.className.match(/\bground-[\w-]+\b/)?.[0];

  frameEl.className = 'portfolio-image-expand__frame portfolio-image-expand__frame--iso';
  if (ground) frameEl.classList.add(ground);

  if (caption) {
    captionEl.textContent = caption;
    captionEl.hidden = false;
  } else {
    captionEl.textContent = '';
    captionEl.hidden = true;
  }
}

/**
 * @param {HTMLImageElement} source
 */
export async function expandPortfolioImage(source) {
  ensureExpandUi();
  if (!rootEl || !frameEl || !imgEl || !captionEl || !scrimEl) return;

  clearCloseTimer();
  await whenReady(source);

  const visual = sourceVisual(source);
  const fromAabb = visual.getBoundingClientRect();
  if (fromAabb.width < 8 || fromAabb.height < 8) return;

  const nw = source.naturalWidth || fromAabb.width;
  const nh = source.naturalHeight || fromAabb.height;
  const to = containRect(nw, nh, portfolioExpandBounds());
  const sourceIso = isIsoSource(source);

  applyExpandedChrome(source);
  setCloseVisible(true);

  rootEl.hidden = false;
  rootEl.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('is-portfolio-image-expanded');
  document.documentElement.classList.add('is-portfolio-image-expand-dim');
  frameEl.setAttribute('aria-label', 'Expanded image');

  const from = sourceIso ? sourceLayoutBox(visual) : fromAabb;

  setAnimating(false);
  applyFrameBox(from, { borderBox: sourceIso });
  void frameEl.offsetWidth;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    applyFrameBox({ left: to.x, top: to.y, width: to.w, height: to.h });
    rootEl.classList.add('is-open');
    return;
  }

  setAnimating(true);
  rootEl.classList.add('is-open');
  requestAnimationFrame(() => {
    applyFrameBox({ left: to.x, top: to.y, width: to.w, height: to.h });
  });
  window.setTimeout(() => setAnimating(false), EXPAND_MS + 40);
}

/** @param {{ instant?: boolean }} [opts] */
export function collapsePortfolioImage(opts = {}) {
  if (!rootEl || !frameEl || rootEl.hidden) return;
  setCloseVisible(false);
  rootEl.classList.add('is-collapsing');
  clearCloseTimer();

  const reduced =
    opts.instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!opts.instant) {
    document.documentElement.classList.remove('is-portfolio-image-expand-dim');
  }

  const finish = () => {
    rootEl?.classList.remove('is-open', 'is-collapsing');
    if (rootEl) {
      rootEl.hidden = true;
      rootEl.setAttribute('aria-hidden', 'true');
    }
    document.documentElement.classList.remove('is-portfolio-image-expanded');
    document.documentElement.classList.remove('is-portfolio-image-expand-dim');
    clearExpandSession();
    if (imgEl) {
      imgEl.removeAttribute('src');
      imgEl.alt = '';
    }
    if (captionEl) {
      captionEl.textContent = '';
      captionEl.hidden = true;
    }
    setCloseVisible(true);
    setAnimating(false);
  };

  if (reduced || !sourceEl) {
    finish();
    return;
  }

  const sourceIso =
    sourceEl instanceof HTMLElement && sourceEl.classList.contains('prose-img-iso__frame');
  const to = sourceIso ? sourceLayoutBox(sourceEl) : sourceEl.getBoundingClientRect();
  setAnimating(true, { collapsing: true });
  applyFrameBox(to, { borderBox: sourceIso });
  closeTimer = window.setTimeout(() => {
    if (sourceEl && frameEl) {
      setAnimating(false);
      const snap = sourceIso
        ? sourceLayoutBox(sourceEl)
        : sourceEl.getBoundingClientRect();
      applyFrameBox(snap, { borderBox: sourceIso });
      void frameEl.offsetWidth;
    }
    finish();
  }, EXPAND_MS + 40);
}

export function teardownPortfolioImageExpand() {
  collapsePortfolioImage({ instant: true });
  activeController?.abort();
  activeController = null;
  rootEl?.remove();
  rootEl = null;
  scrimEl = null;
  frameEl = null;
  imgEl = null;
  captionEl = null;
  closeEl = null;
  clearExpandSession();
}

/**
 * @param {ParentNode} root
 */
export function setupPortfolioImageExpand(root) {
  teardownPortfolioImageExpand();
  ensureExpandUi();
  const ac = new AbortController();
  activeController = ac;

  const onClick = (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('[data-expand-dismiss]')) {
      e.preventDefault();
      collapsePortfolioImage();
      return;
    }
    if (document.documentElement.classList.contains('is-portfolio-image-expanded')) {
      if (e.target.closest('.portfolio-image-expand__frame')) return;
    }
    const img = resolveExpandImage(e.target);
    if (!img || !root.contains(img)) return;
    e.preventDefault();
    void expandPortfolioImage(img);
  };

  const onKeydown = (e) => {
    if (document.documentElement.classList.contains('is-portfolio-image-expanded')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        collapsePortfolioImage();
      }
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const img = resolveExpandImage(e.target);
    if (!img || !root.contains(img)) return;
    e.preventDefault();
    void expandPortfolioImage(img);
  };

  document.addEventListener('click', onClick, { signal: ac.signal });
  document.addEventListener('keydown', onKeydown, { capture: true, signal: ac.signal });

  root.querySelectorAll('.prose img').forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.getAttribute('src') && !img.currentSrc) return;
    img.classList.add('prose-img--expandable');
    const label = resolveExpandCaption(img);
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute(
      'aria-label',
      label ? `Expand image: ${label}` : 'Expand image'
    );
  });

  root.querySelectorAll('.prose .prose-img-iso__frame').forEach((frame) => {
    frame.classList.add('prose-img--expandable-wrap');
    if (!frame.hasAttribute('tabindex')) {
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('role', 'button');
      const img = frame.querySelector('img');
      const label =
        img instanceof HTMLImageElement ? resolveExpandCaption(img) : '';
      frame.setAttribute(
        'aria-label',
        label ? `Expand image: ${label}` : 'Expand image'
      );
    }
  });
}

export const PORTFOLIO_IMAGE_EXPAND_MS = EXPAND_MS;
export const PORTFOLIO_IMAGE_EXPAND_EASE = EXPAND_EASE;
export const PORTFOLIO_IMAGE_COLLAPSE_EASE = COLLAPSE_EASE;
