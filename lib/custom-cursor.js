/** @typedef {'default' | 'link' | 'cta' | 'plus' | 'close'} CursorState */

const STATES = /** @type {const} */ (['default', 'link', 'cta', 'plus', 'close']);
const LABELS = { cta: 'Read', plus: '+', close: 'x' };
const GLYPHS = { cta: '>', plus: '+', close: 'x' };
const GLYPH_COUNT = 4;
const STAGGER_MS = 72;
const ENTER_MS = 340;

const CASE_STUDY_SELECTOR =
  'button.landing-pick-card[data-md-path], .reader-more-cases .mini-poster[data-md-path]';

/** @type {HTMLElement | null} */
let rootEl = null;
/** @type {HTMLElement | null} */
let labelEl = null;
/** @type {HTMLElement | null} */
let trackEl = null;
/** @type {CursorState} */
let currentState = 'default';
/** @type {number} */
let glyphAnimToken = 0;
/** @type {number} */
let moveFrame = 0;
/** @type {number} */
let x = 0;
/** @type {number} */
let y = 0;
/** @type {AbortController | null} */
let ac = null;

/**
 * @param {Element | null} target
 * @returns {CursorState}
 */
export function resolveCursorState(target) {
  if (!target || typeof target.closest !== 'function') return 'default';
  if (target.closest('#custom-cursor')) return currentState;

  const doc = target.ownerDocument;
  const lightbox = doc?.getElementById('image-lightbox');
  if (lightbox?.localName === 'dialog' && lightbox.hasAttribute('open')) {
    if (target.closest('.image-lightbox__shell')) return 'default';
    return 'close';
  }

  if (
    target.closest(
      '.prose-img--zoomable, .prose-img--zoomable-wrap, .prose .halftone, .prose img'
    )
  ) {
    return 'plus';
  }

  if (isCtaTarget(target)) {
    return 'cta';
  }

  if (isLinkTarget(target)) {
    return 'link';
  }

  return 'default';
}

/**
 * @param {Element} target
 * @returns {boolean}
 */
function isCaseStudyTarget(target) {
  return Boolean(target.closest(CASE_STUDY_SELECTOR));
}

/**
 * In-page fragment links — prose anchors, TOC jumps, poster titles.
 * @param {HTMLAnchorElement} link
 * @returns {boolean}
 */
function isAnchorLink(link) {
  const href = link.getAttribute('href')?.trim() ?? '';
  return !href || href === '#' || href.startsWith('#');
}

/**
 * Buttons and non-anchor links — excludes case study picks and hash anchors.
 * @param {Element} target
 * @returns {boolean}
 */
function isLinkTarget(target) {
  if (isCaseStudyTarget(target)) return false;

  const button = target.closest('button:not(:disabled)');
  if (button) return true;

  const link = target.closest('a[href]');
  if (!link || isAnchorLink(link)) return false;

  return true;
}

/**
 * @param {Element} target
 * @returns {boolean}
 */
function isCtaTarget(target) {
  return isCaseStudyTarget(target);
}

/** @param {CursorState} next */
function applyState(next) {
  if (!rootEl || next === currentState) return;
  currentState = next;
  rootEl.classList.remove(...STATES.map((s) => `custom-cursor--${s}`));
  rootEl.classList.add(`custom-cursor--${next}`);

  if (next === 'default' || next === 'link') {
    rootEl.classList.remove('custom-cursor--glyphs-entering', 'custom-cursor--glyphs-visible');
    return;
  }

  const label = LABELS[next];
  const glyph = GLYPHS[next];
  if (labelEl) labelEl.textContent = label;
  if (trackEl) {
    trackEl.querySelectorAll('.custom-cursor__glyph').forEach((node) => {
      node.textContent = glyph;
    });
  }

  playGlyphEnter();
}

function playGlyphEnter() {
  if (!rootEl || currentState === 'default') return;
  const token = ++glyphAnimToken;
  rootEl.classList.remove('custom-cursor--glyphs-visible', 'custom-cursor--glyphs-entering');
  trackEl?.querySelectorAll('.custom-cursor__glyph').forEach((node) => {
    node.style.animation = 'none';
    void node.offsetWidth;
    node.style.animation = '';
  });
  void rootEl.offsetWidth;
  rootEl.classList.add('custom-cursor--glyphs-entering');

  const totalMs = ENTER_MS + STAGGER_MS * (GLYPH_COUNT - 1);
  window.setTimeout(() => {
    if (token !== glyphAnimToken || !rootEl || currentState === 'default') return;
    rootEl.classList.remove('custom-cursor--glyphs-entering');
    rootEl.classList.add('custom-cursor--glyphs-visible');
  }, totalMs);
}

function onPointerMove(e) {
  x = e.clientX;
  y = e.clientY;
  if (!rootEl) return;
  rootEl.hidden = false;
  if (moveFrame) return;
  moveFrame = requestAnimationFrame(() => {
    moveFrame = 0;
    if (!rootEl) return;
    rootEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const target = document.elementFromPoint(x, y);
    applyState(resolveCursorState(target));
  });
}

function onPointerLeave() {
  if (rootEl) rootEl.hidden = true;
}

function syncCursorHost() {
  if (!rootEl) return;
  const lightbox = document.getElementById('image-lightbox');
  if (lightbox?.localName === 'dialog' && lightbox.open) {
    lightbox.appendChild(rootEl);
  } else {
    document.body.appendChild(rootEl);
  }
}

/** @param {Event} e */
function onDialogToggle(e) {
  if (!(e.target instanceof HTMLDialogElement) || e.target.id !== 'image-lightbox') return;
  syncCursorHost();
}

function buildDom() {
  const root = document.createElement('div');
  root.id = 'custom-cursor';
  root.className = 'custom-cursor custom-cursor--default';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="custom-cursor__pill">
      <span class="custom-cursor__dot" aria-hidden="true"></span>
      <svg class="custom-cursor__ring" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle cx="20" cy="20" r="16" pathLength="100"></circle>
      </svg>
      <div class="custom-cursor__main">
        <span class="custom-cursor__label"></span>
      </div>
      <div class="custom-cursor__tracks" aria-hidden="true">
        ${Array.from({ length: GLYPH_COUNT }, () => '<span class="custom-cursor__glyph"></span>').join('')}
      </div>
    </div>`;
  document.body.appendChild(root);
  return root;
}

/**
 * @param {{ enabled?: boolean }} [opts]
 */
export function mountCustomCursor(opts = {}) {
  teardownCustomCursor();
  if (opts.enabled === false) return;

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) return;

  rootEl = buildDom();
  labelEl = rootEl.querySelector('.custom-cursor__label');
  trackEl = rootEl.querySelector('.custom-cursor__tracks');
  document.body.classList.add('custom-cursor-active');

  ac = new AbortController();
  const { signal } = ac;
  document.addEventListener('pointermove', onPointerMove, { signal, passive: true });
  document.addEventListener('pointerleave', onPointerLeave, { signal });
  document.addEventListener('toggle', onDialogToggle, { signal, capture: true });
  window.addEventListener('blur', onPointerLeave, { signal });
  syncCursorHost();
}

export function teardownCustomCursor() {
  ac?.abort();
  ac = null;
  if (moveFrame) cancelAnimationFrame(moveFrame);
  moveFrame = 0;
  if (rootEl) document.body.appendChild(rootEl);
  rootEl?.remove();
  rootEl = null;
  labelEl = null;
  trackEl = null;
  currentState = 'default';
  document.body.classList.remove('custom-cursor-active');
}
