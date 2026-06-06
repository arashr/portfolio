/**
 * Pick where a poster glyph pattern is drawn (card-local px).
 * @typedef {object} GlyphRegion
 * @property {'bottom'|'between'|'top'|'side'} slot
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

const DEFAULT_PLACEMENT = {
  emptySpaceMinPx: 56,
  emptySpaceMinRatio: 0.1,
  /** Shrink pattern box away from text (inner padding). Use 0 with alignToCardEdge. */
  regionInsetPx: 12,
  /** When true, pattern bands span the full card (0…width/height), including poster padding margins. */
  alignToCardEdge: false,
  fallbackBandWidth: 88,
  fallbackSide: 'auto',
  /** Side band only: multiply `fallbackBandWidth` (e.g. 2 = twice as wide — less crowded path patterns). */
  sideBandWidthRatio: 1,
  /** Side band only: extra px past the content box toward the card edge (auto if null). */
  edgeOverflowPx: 24,
  /** Bottom band only: multiply padding-band height (2 = extend upward into body by one band). */
  bottomBandHeightRatio: 1,
  regionPreference: ['bottom', 'between', 'top']
};

function clampInt(n, fallback) {
  const v = Number.parseInt(String(n), 10);
  return Number.isFinite(v) ? v : fallback;
}

function clampNum(n, fallback) {
  const v = Number.parseFloat(String(n));
  return Number.isFinite(v) ? v : fallback;
}

function insetRegion(region, inset, bounds) {
  const i = Math.max(0, inset);
  let { x, y, width, height } = region;
  x += i;
  y += i;
  width = Math.max(1, width - i * 2);
  height = Math.max(1, height - i * 2);
  if (bounds) {
    const maxW = bounds.right - bounds.left;
    const maxH = bounds.bottom - bounds.top;
    width = Math.min(width, maxW);
    height = Math.min(height, maxH);
    x = Math.max(bounds.left, Math.min(x, bounds.right - width));
    y = Math.max(bounds.top, Math.min(y, bounds.bottom - height));
  }
  return { ...region, x, y, width, height };
}

/** @param {string} key */
function normalizeRegionPreferenceKey(key) {
  const k = String(key).toLowerCase();
  if (k === 'right') return 'side-right';
  if (k === 'left') return 'side-left';
  if (k === 'side') return 'side-auto';
  return k;
}

/**
 * @param {{
 *   opts: Partial<typeof DEFAULT_PLACEMENT>;
 *   cardWidth: number;
 *   contentLeft: number;
 *   contentRight: number;
 *   bandLeft: number;
 *   bandRight: number;
 *   bandWidth: number;
 *   bandBottom: number;
 *   headerBottom: number;
 *   minGapUse: number;
 *   alignEdge: boolean;
 * }} ctx
 * @param {boolean | null} useLeft null = auto from fallbackSide / rand
 * @param {() => number} rand
 */
function buildSideRegion(ctx, useLeft, rand) {
  const {
    opts,
    cardWidth,
    contentLeft,
    contentRight,
    bandLeft,
    bandRight,
    bandWidth,
    bandBottom,
    headerBottom,
    minGapUse,
    alignEdge
  } = ctx;

  const widthRatio = Math.min(4, Math.max(0.25, clampNum(opts.sideBandWidthRatio, 1)));
  const bandW = Math.min(
    Math.max(24, Math.round(clampInt(opts.fallbackBandWidth, 88) * widthRatio)),
    Math.floor(bandWidth * 0.42)
  );
  const sidePref = String(opts.fallbackSide || 'auto').toLowerCase();
  const pickLeft =
    useLeft === true || (useLeft !== false && (sidePref === 'left' || (sidePref !== 'right' && rand() < 0.5)));

  let edgeOverflow;
  if (opts.edgeOverflowPx != null && Number.isFinite(Number(opts.edgeOverflowPx))) {
    edgeOverflow = Math.max(0, clampInt(opts.edgeOverflowPx, 0));
  } else if (alignEdge) {
    edgeOverflow = 0;
  } else {
    edgeOverflow = Math.max(0, pickLeft ? contentLeft : cardWidth - contentRight);
  }

  let x = pickLeft ? bandLeft : bandRight - bandW;
  let width = bandW;
  if (!alignEdge && edgeOverflow > 0) {
    if (pickLeft) x -= edgeOverflow;
    else width += edgeOverflow;
  }
  if (alignEdge) {
    x = pickLeft ? 0 : cardWidth - bandW;
    width = bandW;
  }

  return {
    slot: 'side',
    x,
    y: headerBottom,
    width,
    height: Math.max(minGapUse, bandBottom - headerBottom)
  };
}

/** @param {string} slug @param {string[]} eligibleKeys @param {string | null} [previousRegionKey] */
export function regionKeyForSlug(slug, eligibleKeys, previousRegionKey = null) {
  if (!eligibleKeys.length) return null;
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  let slot = hash % eligibleKeys.length;
  let key = eligibleKeys[slot];
  if (previousRegionKey != null && key === previousRegionKey && eligibleKeys.length > 1) {
    slot = (slot + 1) % eligibleKeys.length;
    key = eligibleKeys[slot];
  }
  return key;
}

/**
 * @param {object} layout
 * @param {Partial<typeof DEFAULT_PLACEMENT>} cfg
 * @param {{ slug?: string, previousRegionKey?: string | null, rand?: () => number }} [pick]
 * @returns {GlyphRegion & { regionKey: string }}
 */
export function computePosterGlyphRegionFromLayout(layout, cfg, pick = {}) {
  const slug = pick.slug ?? '';
  const previousRegionKey = pick.previousRegionKey ?? null;
  const rand = pick.rand ?? Math.random;
  const opts = { ...DEFAULT_PLACEMENT, ...cfg };
  const {
    cardWidth,
    cardHeight,
    contentLeft,
    contentTop,
    contentWidth,
    contentHeight,
    contentRight,
    contentBottom,
    headerTop,
    headerBottom,
    bodyTop,
    bodyBottom
  } = layout;

  const alignEdge = Boolean(opts.alignToCardEdge);
  const bandLeft = alignEdge ? 0 : contentLeft;
  const bandTop = alignEdge ? 0 : contentTop;
  const bandRight = alignEdge ? cardWidth : contentRight;
  const bandBottom = alignEdge ? cardHeight : contentBottom;
  const bandWidth = Math.max(1, bandRight - bandLeft);

  const minGapPx = clampInt(opts.emptySpaceMinPx, 56);
  const minGapRatio = Math.min(0.9, Math.max(0, clampNum(opts.emptySpaceMinRatio, 0.1)));
  const bandHeight = Math.max(1, bandBottom - bandTop);
  const minGapUse = Math.max(minGapPx, Math.round(bandHeight * minGapRatio));

  const inset = alignEdge ? 0 : clampInt(opts.regionInsetPx, 12);

  const bounds = alignEdge
    ? { left: 0, top: 0, right: cardWidth, bottom: cardHeight }
    : {
        left: contentLeft,
        top: contentTop,
        right: contentRight,
        bottom: contentBottom
      };

  const candidates = {
    bottom: (() => {
      const baseHeight = Math.max(0, bandBottom - bodyBottom);
      const heightRatio = Math.min(4, Math.max(1, clampNum(opts.bottomBandHeightRatio, 1)));
      const height = Math.round(baseHeight * heightRatio);
      return {
        slot: 'bottom',
        x: bandLeft,
        y: bodyBottom - (height - baseHeight),
        width: bandWidth,
        height
      };
    })(),
    between: {
      slot: 'between',
      x: bandLeft,
      y: headerBottom,
      width: bandWidth,
      height: Math.max(0, bodyTop - headerBottom)
    },
    top: {
      slot: 'top',
      x: bandLeft,
      y: bandTop,
      width: bandWidth,
      height: Math.max(0, headerTop - bandTop)
    }
  };

  const pref = (Array.isArray(opts.regionPreference)
    ? opts.regionPreference
    : DEFAULT_PLACEMENT.regionPreference
  ).map(normalizeRegionPreferenceKey);

  const isSideKey = (key) => key === 'side-left' || key === 'side-right' || key === 'side-auto';

  const sidePref = pref.filter((key) => isSideKey(key));

  const sideCtx = {
    opts,
    cardWidth,
    contentLeft,
    contentRight,
    bandLeft,
    bandRight,
    bandWidth,
    bandBottom,
    headerBottom,
    minGapUse,
    alignEdge
  };

  /** @param {string} key @param {{ height: number }} region */
  function minHeightFor(key, region) {
    if (isSideKey(key)) return minGapUse;
    if (key === 'between') return minGapUse;
    if ((key === 'top' || key === 'bottom') && alignEdge) {
      return Math.min(minGapUse, Math.max(24, region.height));
    }
    return minGapUse;
  }

  /** @type {{ key: string, region: GlyphRegion }[]} */
  const eligible = [];

  for (const key of pref) {
    let region;
    if (isSideKey(key)) {
      const useLeft = key === 'side-left' ? true : key === 'side-right' ? false : null;
      region = buildSideRegion(sideCtx, useLeft, rand);
    } else {
      region = candidates[key];
    }
    if (!region || region.width < 24 || region.height < minHeightFor(key, region)) continue;
    eligible.push({ key, region });
  }

  const finish = (key, region) => {
    const insetVal = region.slot === 'side' ? (alignEdge ? 0 : Math.min(inset, 8)) : inset;
    return { ...insetRegion(region, insetVal, bounds), regionKey: key };
  };

  if (eligible.length) {
    const keys = eligible.map((entry) => entry.key);
    const pickedKey = regionKeyForSlug(slug, keys, previousRegionKey);
    const picked = eligible.find((entry) => entry.key === pickedKey) ?? eligible[0];
    return finish(picked.key, picked.region);
  }

  const side = buildSideRegion(sideCtx, null, rand);
  const fallbackKey = sidePref[0] || 'side-auto';
  return finish(fallbackKey, side);
}

/**
 * Measure poster card content box + header/body bands (card-local coordinates).
 *
 * @param {HTMLElement} card `.post-card`
 */
export function measurePosterGlyphLayout(card) {
  const cardH = card.clientHeight;
  const cardW = card.clientWidth;
  if (!cardH || !cardW) {
    return {
      cardWidth: cardW,
      cardHeight: cardH,
      contentLeft: 0,
      contentTop: 0,
      contentRight: cardW,
      contentBottom: cardH,
      contentWidth: Math.max(1, cardW),
      contentHeight: Math.max(1, cardH),
      headerTop: 0,
      headerBottom: 0,
      bodyTop: cardH,
      bodyBottom: cardH
    };
  }

  const s = getComputedStyle(card);
  const padTop = Number.parseFloat(s.paddingTop) || 0;
  const padBottom = Number.parseFloat(s.paddingBottom) || 0;
  const padLeft = Number.parseFloat(s.paddingLeft) || 0;
  const padRight = Number.parseFloat(s.paddingRight) || 0;

  const contentLeft = padLeft;
  const contentTop = padTop;
  const contentRight = cardW - padRight;
  const contentBottom = cardH - padBottom;
  const contentWidth = Math.max(1, contentRight - contentLeft);
  const contentHeight = Math.max(1, contentBottom - contentTop);

  const header = card.querySelector('.post-header');
  const body = card.querySelector('.post-body');

  let headerTop = contentTop;
  let headerBottom = contentTop;
  let bodyTop = contentBottom;
  let bodyBottom = contentBottom;

  if (header instanceof HTMLElement) {
    headerTop = header.offsetTop;
    headerBottom = header.offsetTop + header.offsetHeight;
  }
  if (body instanceof HTMLElement) {
    bodyTop = body.offsetTop;
    bodyBottom = body.offsetTop + body.offsetHeight;
  }

  return {
    cardWidth: cardW,
    cardHeight: cardH,
    contentLeft,
    contentTop,
    contentRight,
    contentBottom,
    contentWidth,
    contentHeight,
    headerTop,
    headerBottom,
    bodyTop,
    bodyBottom
  };
}

/**
 * @param {HTMLElement} card
 * @param {Partial<typeof DEFAULT_PLACEMENT>} cfg
 * @param {{ slug?: string, previousRegionKey?: string | null, rand?: () => number }} [pick]
 */
export function computePosterGlyphRegion(card, cfg, pick = {}) {
  return computePosterGlyphRegionFromLayout(measurePosterGlyphLayout(card), cfg, pick);
}

export { DEFAULT_PLACEMENT as GLYPH_PLACEMENT_DEFAULTS };
