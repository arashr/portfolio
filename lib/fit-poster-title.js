/**
 * Poster title fitting: binary search on pixel font-size using live DOM layout.
 * Titles wrap at word boundaries only (no broken words). Size is the largest px
 * that fits card width and (per `titleScale.tiers`) a max line count. Height is not clipped.
 */

import { resolveTitlePlay, resolveTitleScaleForFace, resolveLandingNameTitleScale } from './gallery-config.js';
import { titleFaceIdFromElement } from './title-faces.js';

function isLandingNameCard(card) {
  return card.classList.contains('landing-name-card') || card.dataset.slug === 'landing-name';
}

function resolveTitleScaleForCard(card, cfg) {
  if (isLandingNameCard(card)) return resolveLandingNameTitleScale(cfg);
  return resolveTitleScaleForFace(titleFaceIdFromElement(card), cfg);
}

function blockHeight(el) {
  return Math.max(el.scrollHeight, el.offsetHeight);
}

function cardInnerWidth(card) {
  const s = getComputedStyle(card);
  const padX = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
  return Math.max(0, card.clientWidth - padX);
}

/**
 * Title column width when the header sits in a grid span; falls back to card inner width.
 * @param {HTMLElement} card
 * @param {HTMLElement | null | undefined} header
 */
export function titleFitInnerWidth(card, header) {
  const headerW = header?.clientWidth ?? 0;
  if (headerW >= 48) return headerW;
  return cardInnerWidth(card);
}

/**
 * @param {HTMLElement} card
 * @param {HTMLElement | null | undefined} header
 */
export function titleColumnRatio(card, header) {
  const cardW = card.clientWidth;
  const headerW = header?.clientWidth ?? 0;
  if (cardW < 48 || headerW < 48) return 1;
  return Math.min(1, headerW / cardW);
}

/**
 * Cap how far a title may grow for “play” while staying column-aware.
 * @param {number} basePx
 * @param {{
 *   enabled?: boolean,
 *   maxScale?: number,
 *   shortTitleChars?: number,
 *   shortTitleBoost?: number,
 *   titleChars?: number,
 *   columnRatio?: number
 * }} play
 */
export function resolveTitlePlayMaxPx(basePx, play = {}) {
  const base = Math.max(1, Math.floor(basePx));
  if (play.enabled === false) return base;

  const maxScale = Number.isFinite(Number(play.maxScale))
    ? Math.max(1, Math.min(2, Number(play.maxScale)))
    : 1.35;
  const shortChars = Number.isFinite(Number(play.shortTitleChars))
    ? Number(play.shortTitleChars)
    : 22;
  const shortBoost = Number.isFinite(Number(play.shortTitleBoost))
    ? Math.max(1, Math.min(1.6, Number(play.shortTitleBoost)))
    : 1.15;
  const titleChars = Number.isFinite(Number(play.titleChars)) ? Number(play.titleChars) : 40;
  const columnRatio = Number.isFinite(Number(play.columnRatio))
    ? Math.max(0.15, Math.min(1, Number(play.columnRatio)))
    : 0.5;

  const spanBoost = 0.92 + columnRatio * 0.3;
  const shortFactor =
    titleChars <= shortChars ? shortBoost : titleChars <= shortChars * 1.6 ? 1.08 : 1;
  const scale = Math.min(maxScale, spanBoost * shortFactor);
  return Math.max(base, Math.floor(base * scale));
}

function px(value) {
  const parsed = parseFloat(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Grow a title into leftover inner height on roomy cards (reader posters only).
 * @param {HTMLElement} card
 * @param {HTMLElement} bounds
 * @param {HTMLElement} link
 * @param {HTMLElement} body
 * @param {number} minPx
 * @param {number} maxPx
 * @param {number} [maxLines]
 */
export function fitTitleToVerticalSlack(card, bounds, link, body, minPx, maxPx, maxLines = 0) {
  const cardStyle = getComputedStyle(card);
  const innerHeight =
    card.clientHeight - px(cardStyle.paddingTop) - px(cardStyle.paddingBottom);
  const rowGap = px(cardStyle.rowGap);
  const supportingHeight = body.offsetHeight;
  const maxHeaderHeight = Math.max(48, innerHeight - supportingHeight - rowGap);

  const apply = (size) => {
    card.style.setProperty('--poster-title-size', `${size}px`);
    void bounds.offsetHeight;
  };
  const fits = (size) => {
    apply(size);
    if (titleHasHorizontalOverflow(link)) return false;
    if (bounds.scrollWidth > bounds.clientWidth + 1) return false;
    if (maxLines > 0 && titleLineCount(link) > maxLines) return false;
    return bounds.scrollHeight <= maxHeaderHeight + 1;
  };

  const floor = Math.max(14, Math.floor(minPx));
  const ceiling = Math.max(floor, Math.floor(maxPx));
  if (fits(ceiling)) return ceiling;

  let low = floor;
  let high = ceiling;
  let best = floor;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(mid)) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  apply(best);
  return best;
}

/**
 * @param {HTMLElement} link
 */
export function titleHasHorizontalOverflow(link) {
  return link.scrollWidth > link.clientWidth + 1;
}

/**
 * @param {HTMLElement} bounds
 * @param {number} maxHeight
 */
export function titleHasVerticalOverflow(bounds, maxHeight) {
  return blockHeight(bounds) > maxHeight + 1;
}

/**
 * Wrapped line count from layout height ÷ computed line-height.
 * (getClientRects on block titles is unreliable — often one rect for the whole box.)
 * @param {HTMLElement} el
 */
export function titleLineCount(el) {
  const style = getComputedStyle(el);
  let lineHeight = parseFloat(style.lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    const fontSize = parseFloat(style.fontSize);
    lineHeight = Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.12 : 16;
  }
  const height = el.getBoundingClientRect().height;
  if (!Number.isFinite(height) || height <= 0) return 1;
  return Math.max(1, Math.round(height / lineHeight));
}

/**
 * @param {object} titleScale
 * @param {number} charLength — plain title length (no markdown)
 * @returns {{ minPx: number, maxPx: number, maxWidthRatio: number, maxLines: number, maxPxRatio: number, floorPx?: number }}
 */
export function resolveTitleScaleTier(titleScale, charLength) {
  const base = {
    minPx: titleScale.minPx ?? 14,
    maxPx: titleScale.maxPx ?? 280,
    maxWidthRatio: titleScale.maxWidthRatio ?? 0.45,
    maxLines: titleScale.maxLines ?? 0,
    maxPxRatio: titleScale.maxPxRatio ?? 1,
    floorPx: titleScale.floorPx ?? 14
  };
  const tiers = titleScale.tiers;
  if (!Array.isArray(tiers) || !tiers.length) return base;

  const sorted = [...tiers].sort((a, b) => {
    const ma = a.maxChars == null ? Number.POSITIVE_INFINITY : a.maxChars;
    const mb = b.maxChars == null ? Number.POSITIVE_INFINITY : b.maxChars;
    return ma - mb;
  });

  for (const tier of sorted) {
    const cap = tier.maxChars == null ? Number.POSITIVE_INFINITY : tier.maxChars;
    if (charLength <= cap) {
      return {
        minPx: tier.minPx ?? base.minPx,
        maxPx: tier.maxPx ?? base.maxPx,
        maxWidthRatio: tier.maxWidthRatio ?? base.maxWidthRatio,
        maxLines: tier.maxLines ?? base.maxLines ?? 0,
        maxPxRatio: tier.maxPxRatio ?? base.maxPxRatio ?? 1,
        floorPx: tier.floorPx ?? base.floorPx
      };
    }
  }

  return base;
}

/**
 * Plain title length for tier pick (dataset from render, else link text).
 * @param {HTMLElement} card
 * @param {HTMLElement} link
 */
export function titleCharLength(card, link) {
  const fromAttr = parseInt(card.dataset.titleChars ?? '', 10);
  if (Number.isFinite(fromAttr) && fromAttr >= 0) return fromAttr;
  return (link.textContent || '').trim().length;
}

/**
 * @param {HTMLElement} card
 * @param {HTMLElement} bounds
 * @param {HTMLElement} link
 * @param {{ minPx: number, maxPx: number, maxLines?: number, floorPx?: number }} limits
 */
export function largestTitleFontSizePx(card, bounds, link, limits) {
  const { minPx, maxPx, maxLines = 0 } = limits;
  const floorPx = Math.min(minPx, Math.max(10, limits.floorPx ?? 14));

  const apply = (px) => {
    card.style.setProperty('--poster-title-size', `${px}px`);
    void bounds.offsetHeight;
  };

  const fits = (px) => {
    apply(px);
    if (titleHasHorizontalOverflow(link)) return false;
    if (bounds.scrollWidth > bounds.clientWidth + 1) return false;
    if (maxLines > 0 && titleLineCount(link) > maxLines) return false;
    return true;
  };

  if (maxPx <= floorPx) {
    apply(floorPx);
    return floorPx;
  }

  let lo = floorPx;
  let hi = maxPx;
  let best = floorPx;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  apply(best);
  return best;
}

/**
 * Landing grid posters use the same display faces in a much smaller card.
 * Fit against the rendered fallback size so long case-study names stay visible.
 *
 * @param {HTMLElement[]} miniPosterEls
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 */
export function fitMiniPosterTitles(miniPosterEls, cfg) {
  for (const card of miniPosterEls) {
    card.style.removeProperty('--poster-title-size');
  }

  if (!miniPosterEls.length) return;

  void miniPosterEls[0].offsetHeight;

  for (const card of miniPosterEls) {
    if (!card.className.includes('title-face-')) continue;

    const header = card.querySelector('.post-header');
    const bounds = header?.querySelector('.post-title-bounds');
    const titleEl = header?.querySelector('.post-title');
    const target = titleEl?.querySelector('a') || titleEl;
    if (!header || !bounds || !titleEl || !target) continue;

    void header.offsetWidth;
    const innerW = titleFitInnerWidth(card, header);
    if (innerW < 48) continue;

    const titleScale = resolveTitleScaleForCard(card, cfg);
    const GLOBAL_FLOOR = titleScale.floorPx ?? 14;
    const charLength = titleCharLength(card, target);
    const tier = resolveTitleScaleTier(titleScale, charLength);
    const isLandingPick =
      card.classList.contains('landing-pick-card') && card.classList.contains('mini-poster');

    if (isLandingPick) {
      const fallbackPx = parseFloat(getComputedStyle(target).fontSize);
      const maxPx = Number.isFinite(fallbackPx) && fallbackPx > 0
        ? Math.floor(fallbackPx)
        : 44;

      largestTitleFontSizePx(card, bounds, target, {
        minPx: tier.floorPx ?? GLOBAL_FLOOR,
        maxPx,
        maxLines: 2,
        floorPx: tier.floorPx ?? GLOBAL_FLOOR
      });
      continue;
    }

    const widthCap = Math.floor(innerW * tier.maxWidthRatio);
    const maxPx = Math.max(
      tier.minPx + 1,
      Math.min(Math.floor(tier.maxPx * 0.42), Math.floor(widthCap * tier.maxPxRatio))
    );

    largestTitleFontSizePx(card, bounds, target, {
      minPx: tier.floorPx ?? GLOBAL_FLOOR,
      maxPx,
      maxLines: tier.maxLines,
      floorPx: tier.floorPx ?? GLOBAL_FLOOR
    });
  }
}

/**
 * @param {HTMLElement[]} posterEls
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 */
export function fitPosterTitles(posterEls, cfg) {
  for (const card of posterEls) {
    card.classList.remove('post-card--roomy');
    card.style.removeProperty('--poster-title-size');
    card.style.removeProperty('--poster-min-height');
  }

  if (!posterEls.length) return;

  void posterEls[0].offsetHeight;

  for (const card of posterEls) {
    if (!card.className.includes('title-face-')) continue;

    const header = card.querySelector('.post-header');
    const bounds = header?.querySelector('.post-title-bounds');
    const titleEl = header?.querySelector('.post-title');
    const target = titleEl?.querySelector('a') || titleEl;
    const body = card.querySelector('.post-body');
    if (!header || !bounds || !titleEl || !target || !body) continue;

    void header.offsetWidth;
    const columnW = titleFitInnerWidth(card, header);
    const colRatio = titleColumnRatio(card, header);
    const innerW = cardInnerWidth(card);
    if (columnW < 48 || innerW < 48) continue;

    const cardStyle = getComputedStyle(card);
    const padY =
      parseFloat(cardStyle.paddingTop) + parseFloat(cardStyle.paddingBottom);
    const cardW = card.clientWidth;
    if (cardW < 48) continue;

    const titleScale = resolveTitleScaleForCard(card, cfg);
    const SLACK_MIN_PX = titleScale.slackMinPx ?? 56;
    const B_ASPECT = titleScale.bAspect ?? 353 / 250;
    const GLOBAL_FLOOR = titleScale.floorPx ?? 14;
    const charLength = titleCharLength(card, target);
    const tier = resolveTitleScaleTier(titleScale, charLength);

    card.style.setProperty('--poster-title-size', `${tier.minPx}px`);
    void bounds.offsetHeight;

    const headerH = blockHeight(bounds);
    const bodyH = blockHeight(body);
    const bMinInnerH = cardW * B_ASPECT - padY;
    const naturalInnerH = headerH + bodyH;
    const slack = bMinInnerH - naturalInnerH;

    if (slack >= SLACK_MIN_PX) {
      card.classList.add('post-card--roomy');
      card.style.setProperty(
        '--poster-min-height',
        `${Math.round(bMinInnerH + padY)}px`
      );
    }

    const widthCap = Math.floor(innerW * tier.maxWidthRatio);
    const tierMaxPx = Math.max(
      tier.minPx + 1,
      Math.min(tier.maxPx, Math.floor(widthCap * tier.maxPxRatio))
    );

    let fittedPx = largestTitleFontSizePx(card, bounds, target, {
      minPx: tier.minPx,
      maxPx: tierMaxPx,
      maxLines: tier.maxLines,
      floorPx: tier.floorPx ?? GLOBAL_FLOOR
    });

    const titlePlay = resolveTitlePlay(cfg);
    if (titlePlay.enabled && !isLandingNameCard(card)) {
      const playMax = Math.min(
        tierMaxPx,
        resolveTitlePlayMaxPx(fittedPx, {
          ...titlePlay,
          titleChars: charLength,
          columnRatio: colRatio
        })
      );
      if (playMax > fittedPx) {
        fittedPx = largestTitleFontSizePx(card, bounds, target, {
          minPx: tier.minPx,
          maxPx: playMax,
          maxLines: tier.maxLines,
          floorPx: tier.floorPx ?? GLOBAL_FLOOR
        });
      }
    }
  }
}

/**
 * Second pass after row snap: grow titles into vertical slack on roomy reader cards.
 * @param {HTMLElement[]} posterEls
 * @param {import('./gallery-config.js').GalleryConfig} cfg
 */
export function applyPosterTitlePlay(posterEls, cfg) {
  const titlePlay = resolveTitlePlay(cfg);
  if (!titlePlay.enabled || !titlePlay.fillSafeZone) return;

  for (const card of posterEls) {
    if (!card.classList.contains('post-card--roomy')) continue;
    if (isLandingNameCard(card)) continue;
    if (!card.className.includes('title-face-')) continue;

    const header = card.querySelector('.post-header');
    const bounds = header?.querySelector('.post-title-bounds');
    const body = card.querySelector('.prose.post-body');
    const titleEl = header?.querySelector('.post-title');
    const target = titleEl?.querySelector('a') || titleEl;
    if (!header || !bounds || !body || !target) continue;

    const current = parseFloat(getComputedStyle(card).getPropertyValue('--poster-title-size'));
    if (!Number.isFinite(current)) continue;

    const charLength = titleCharLength(card, target);
    const colRatio = titleColumnRatio(card, header);
    const titleScale = resolveTitleScaleForCard(card, cfg);
    const tier = resolveTitleScaleTier(titleScale, charLength);
    const playMax = Math.min(
      Math.max(
        tier.minPx + 1,
        Math.min(
          tier.maxPx,
          Math.floor(cardInnerWidth(card) * tier.maxWidthRatio * tier.maxPxRatio)
        )
      ),
      resolveTitlePlayMaxPx(current, {
        ...titlePlay,
        titleChars: charLength,
        columnRatio: colRatio
      })
    );

    fitTitleToVerticalSlack(
      card,
      bounds,
      target,
      body,
      Math.max(tier.floorPx ?? 14, tier.minPx),
      Math.max(current, playMax),
      tier.maxLines
    );
  }
}
