/**
 * Poster title fitting: binary search on pixel font-size using live DOM layout.
 * Titles wrap at word boundaries only (no broken words). Size is the largest px
 * that fits card width and (per `titleScale.tiers`) a max line count. Height is not clipped.
 */

function blockHeight(el) {
  return Math.max(el.scrollHeight, el.offsetHeight);
}

function cardInnerWidth(card) {
  const s = getComputedStyle(card);
  const padX = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
  return Math.max(0, card.clientWidth - padX);
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
    maxLines: 0,
    maxPxRatio: 1,
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
 * @param {object} titleScale
 */
export function fitMiniPosterTitles(miniPosterEls, titleScale) {
  const GLOBAL_FLOOR = titleScale.floorPx ?? 14;

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

    const innerW = cardInnerWidth(card);
    if (innerW < 48) continue;

    const charLength = titleCharLength(card, target);
    const tier = resolveTitleScaleTier(titleScale, charLength);
    const fallbackPx = parseFloat(getComputedStyle(target).fontSize);
    const maxPx = Number.isFinite(fallbackPx) && fallbackPx > 0
      ? Math.floor(fallbackPx)
      : 44;

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
 * @param {object} titleScale
 */
export function fitPosterTitles(posterEls, titleScale) {
  const SLACK_MIN_PX = titleScale.slackMinPx ?? 56;
  const B_ASPECT = titleScale.bAspect ?? 353 / 250;
  const GLOBAL_FLOOR = titleScale.floorPx ?? 14;

  for (const card of posterEls) {
    card.classList.remove('post-card--roomy');
    card.style.removeProperty('--poster-title-size');
    card.style.removeProperty('--poster-min-height');
  }

  if (!posterEls.length) return;

  void posterEls[0].offsetHeight;

  for (const card of posterEls) {
    if (card.classList.contains('is-filtered-out')) continue;
    if (!card.className.includes('title-face-')) continue;

    const header = card.querySelector('.post-header');
    const bounds = header?.querySelector('.post-title-bounds');
    const titleEl = header?.querySelector('.post-title');
    const link = titleEl?.querySelector('a');
    const body = card.querySelector('.post-body');
    if (!header || !bounds || !titleEl || !link || !body) continue;

    const innerW = cardInnerWidth(card);
    if (innerW < 48) continue;

    const cardStyle = getComputedStyle(card);
    const padY =
      parseFloat(cardStyle.paddingTop) + parseFloat(cardStyle.paddingBottom);
    const cardW = card.clientWidth;
    if (cardW < 48) continue;

    const charLength = titleCharLength(card, link);
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
    const maxPx = Math.max(
      tier.minPx + 1,
      Math.min(tier.maxPx, Math.floor(widthCap * tier.maxPxRatio))
    );

    largestTitleFontSizePx(card, bounds, link, {
      minPx: tier.minPx,
      maxPx,
      maxLines: tier.maxLines,
      floorPx: tier.floorPx ?? GLOBAL_FLOOR
    });
  }
}
