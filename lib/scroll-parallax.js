/**
 * Continuous scroll parallax for portfolio posters (landing + reader).
 * Adapted from md-slideshow slide/seam motion — without snap or seam chrome.
 *
 * - Layers (title / content / glyph) drift at different rates vs viewport.
 * - Title bleeds accelerate upward while crossing from parent → child section.
 */

/** @typedef {'linear' | 'easeIn' | 'easeOut' | 'easeInOut'} ParallaxEasing */

/** @typedef {{
 *   enabled?: boolean,
 *   titleRatio?: number,
 *   contentRatio?: number,
 *   glyphRatio?: number,
 *   bleedRatio?: number,
 *   bleedMaxVh?: number,
 *   easing?: ParallaxEasing,
 *   bleedEasing?: ParallaxEasing
 * }} ScrollParallaxConfig */

export const SCROLL_PARALLAX_DEFAULTS = {
  enabled: true,
  titleRatio: 0.08,
  contentRatio: 0.14,
  glyphRatio: 0.22,
  /** Fraction of the *viewport* (not full section height) for bleed exit travel. */
  bleedRatio: 0.08,
  /** Hard cap on bleed travel as a fraction of viewport height. */
  bleedMaxVh: 0.1,
  easing: /** @type {ParallaxEasing} */ ('easeOut'),
  bleedEasing: /** @type {ParallaxEasing} */ ('easeIn')
};

/**
 * @param {number} t 0–1
 * @param {ParallaxEasing} [mode='linear']
 */
export function applyParallaxEasing(t, mode = 'linear') {
  const x = Math.max(0, Math.min(1, t));
  if (mode === 'linear') return x;
  if (mode === 'easeIn') return x ** 2;
  if (mode === 'easeInOut') return x < 0.5 ? 2 * x ** 2 : 1 - ((-2 * x + 2) ** 2) / 2;
  return 1 - (1 - x) ** 2;
}

/**
 * Scroll progress 0 = parent section top in view, 1 = child section top in view.
 * @param {number} scrollY
 * @param {number} parentTop
 * @param {number} childTop
 */
export function sectionBoundaryProgress(scrollY, parentTop, childTop) {
  const span = childTop - parentTop;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (scrollY - parentTop) / span));
}

/**
 * Parallax input from a section’s visible midpoint (not section top, not layer center).
 * Tall posters stay near 0 while they fill the viewport; drift only on enter/exit.
 * Avoids the old ±1.25 section-top cutoff that snapped transforms off mid-scroll.
 *
 * @param {number} visibleMidY midpoint of the intersection with the viewport
 * @param {number} viewportPx
 * @param {number} ratio
 * @param {ParallaxEasing} easing
 */
export function layerParallaxY(visibleMidY, viewportPx, ratio, easing) {
  const span = Math.max(1, viewportPx);
  const relative = (visibleMidY - span / 2) / span;
  const capped = Math.max(-1, Math.min(1, relative));
  const eased = Math.sign(capped) * applyParallaxEasing(Math.abs(capped), easing);
  return eased * ratio * span;
}

/**
 * Visible midpoint of a rect clipped to the viewport. Null when fully off-screen.
 * @param {{ top: number, bottom: number }} rect
 * @param {number} viewportPx
 * @returns {number | null}
 */
export function visibleMidpoint(rect, viewportPx) {
  const span = Math.max(1, viewportPx);
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, span);
  if (bottom <= top) return null;
  return (top + bottom) / 2;
}

/**
 * Bleed travel must stay small — section spans are tall in continuous scroll.
 * Cap against viewport so the rhythm never digs deep into the previous poster’s copy.
 *
 * @param {number} progress 0–1
 * @param {number} viewportPx
 * @param {number} ratio fraction of viewport
 * @param {ParallaxEasing} easing
 * @param {number} [minimumExit=0]
 * @param {number} [maxVh=0.14]
 */
export function bleedExitDistance(
  progress,
  viewportPx,
  ratio,
  easing,
  minimumExit = 0,
  maxVh = SCROLL_PARALLAX_DEFAULTS.bleedMaxVh
) {
  const eased = applyParallaxEasing(progress, easing);
  const vh = Math.max(1, viewportPx);
  const capped = Math.min(ratio * vh, maxVh * vh);
  const travel = Math.max(capped, minimumExit);
  return eased * travel;
}

/**
 * @param {ScrollParallaxConfig | undefined} patch
 * @returns {Required<ScrollParallaxConfig>}
 */
export function resolveScrollParallaxConfig(patch) {
  const p = patch && typeof patch === 'object' ? patch : {};
  const clamp = (n, fallback, max = 0.6) => {
    const v = Number.parseFloat(String(n));
    if (!Number.isFinite(v)) return fallback;
    return Math.min(max, Math.max(0, v));
  };
  return {
    enabled: p.enabled !== false,
    titleRatio: clamp(p.titleRatio, SCROLL_PARALLAX_DEFAULTS.titleRatio),
    contentRatio: clamp(p.contentRatio, SCROLL_PARALLAX_DEFAULTS.contentRatio),
    glyphRatio: clamp(p.glyphRatio, SCROLL_PARALLAX_DEFAULTS.glyphRatio),
    bleedRatio: clamp(p.bleedRatio, SCROLL_PARALLAX_DEFAULTS.bleedRatio, 0.35),
    bleedMaxVh: clamp(p.bleedMaxVh, SCROLL_PARALLAX_DEFAULTS.bleedMaxVh, 0.35),
    easing: /** @type {ParallaxEasing} */ (p.easing || SCROLL_PARALLAX_DEFAULTS.easing),
    bleedEasing: /** @type {ParallaxEasing} */ (p.bleedEasing || SCROLL_PARALLAX_DEFAULTS.bleedEasing)
  };
}

const SECTION_SELECTOR =
  '#landing-name.post-card-wrap, #landing-posters > .post-card-wrap:not(.reader-more-cases-wrap), #posters > .post-card-wrap:not(.reader-more-cases-wrap)';

/**
 * @param {HTMLElement} wrap
 */
function prepareSectionLayers(wrap) {
  const card = wrap.querySelector(':scope > .post-card, :scope > .landing-pick-card');
  if (!(card instanceof HTMLElement)) return;

  const title = card.querySelector(':scope > .post-header');
  if (title instanceof HTMLElement) title.dataset.scrollParallax = 'title';

  const content = card.querySelector(':scope > .prose, :scope > .post-body');
  if (content instanceof HTMLElement) content.dataset.scrollParallax = 'content';

  // Parallax the canvas inside the layer so the layer’s overflow:hidden box stays put.
  const glyphLayer = card.querySelector(':scope > .post-card__glyph-layer');
  if (glyphLayer instanceof HTMLElement) {
    delete glyphLayer.dataset.scrollParallax;
    const canvas = glyphLayer.querySelector('[data-glyph-canvas], canvas');
    if (canvas instanceof HTMLElement) canvas.dataset.scrollParallax = 'glyph';
  }

  const bleed = wrap.querySelector(':scope > .post-card__title-bleed');
  if (bleed instanceof HTMLElement) bleed.dataset.scrollParallax = 'bleed';
}

/**
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement[]}
 */
export function collectParallaxSections(root = document) {
  return Array.from(root.querySelectorAll(SECTION_SELECTOR)).filter(
    (el) => el instanceof HTMLElement
  );
}

/**
 * @param {{
 *   getConfig?: () => ScrollParallaxConfig | undefined,
 *   prefersReducedMotion?: boolean
 * }} [options]
 */
export function initScrollParallax(options = {}) {
  const getConfig = options.getConfig || (() => undefined);
  const prefersReducedMotion =
    options.prefersReducedMotion ??
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /** @type {HTMLElement[]} */
  let sections = [];
  let raf = 0;
  let listening = false;

  function ratios() {
    const cfg = resolveScrollParallaxConfig(getConfig());
    return {
      cfg,
      map: {
        title: cfg.titleRatio,
        content: cfg.contentRatio,
        glyph: cfg.glyphRatio,
        bleed: cfg.bleedRatio
      }
    };
  }

  function reset() {
    for (const wrap of sections) {
      wrap.classList.remove('is-bleed-parallax-active', 'is-scroll-parallax-active');
      wrap.querySelectorAll('[data-scroll-parallax]').forEach((layer) => {
        if (!(layer instanceof HTMLElement)) return;
        layer.style.removeProperty('--scroll-parallax-y');
      });
    }
  }

  function update() {
    const { cfg, map } = ratios();
    if (!cfg.enabled || prefersReducedMotion || !sections.length) {
      reset();
      return;
    }

    const scrollY = window.scrollY;
    const span = Math.max(1, window.innerHeight);

    for (let i = 0; i < sections.length; i++) {
      const wrap = sections[i];
      const wrapRect = wrap.getBoundingClientRect();
      const mid = visibleMidpoint(wrapRect, span);
      const onScreen = mid != null;
      wrap.classList.toggle('is-scroll-parallax-active', onScreen);

      for (const layer of wrap.querySelectorAll('[data-scroll-parallax]')) {
        if (!(layer instanceof HTMLElement)) continue;
        const kind = layer.dataset.scrollParallax;
        if (kind === 'bleed') continue;

        if (!onScreen) {
          layer.style.removeProperty('--scroll-parallax-y');
          continue;
        }

        const ratio = map[kind] ?? 0;
        if (ratio <= 0) {
          layer.style.removeProperty('--scroll-parallax-y');
          continue;
        }

        const y = layerParallaxY(mid, span, ratio, cfg.easing);
        if (Math.abs(y) < 0.5) {
          layer.style.removeProperty('--scroll-parallax-y');
        } else {
          layer.style.setProperty('--scroll-parallax-y', `${y}px`);
        }
      }
    }

    for (let i = 0; i < sections.length - 1; i++) {
      const parent = sections[i];
      const child = sections[i + 1];
      const bleed = child.querySelector(':scope > .post-card__title-bleed');
      if (!(bleed instanceof HTMLElement)) {
        child.classList.remove('is-bleed-parallax-active');
        continue;
      }

      const parentTop = parent.offsetTop;
      const childTop = child.offsetTop;
      const boundarySpan = childTop - parentTop;
      const progress = sectionBoundaryProgress(scrollY, parentTop, childTop);
      const active = progress > 0 && progress < 1 && boundarySpan > 0;

      child.classList.toggle('is-bleed-parallax-active', active);

      if (!active) {
        bleed.style.removeProperty('--scroll-parallax-y');
        continue;
      }

      // Exit only a short band above the seam — not a fraction of the whole poster height.
      // Floor by the *visible* crop strip, not full title line-box (those are huge).
      const reveal = Number.parseFloat(
        getComputedStyle(bleed).getPropertyValue('--title-bleed-reveal')
      );
      const visibleStrip =
        (bleed.offsetHeight || 0) *
        (Number.isFinite(reveal) ? Math.min(1, Math.max(0.05, reveal)) : 0.23);
      const exit = bleedExitDistance(
        progress,
        span,
        cfg.bleedRatio,
        cfg.bleedEasing,
        visibleStrip,
        cfg.bleedMaxVh
      );
      bleed.style.setProperty('--scroll-parallax-y', `${-exit}px`);
    }
  }

  function schedule() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }

  function refresh() {
    sections = collectParallaxSections();
    for (const wrap of sections) prepareSectionLayers(wrap);
    schedule();
  }

  function onScroll() {
    schedule();
  }

  function start() {
    if (listening) {
      refresh();
      return;
    }
    listening = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    refresh();
  }

  function stop() {
    if (!listening) return;
    listening = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', schedule);
    cancelAnimationFrame(raf);
    reset();
    sections = [];
  }

  return { start, stop, refresh, schedule };
}
