/**
 * Snap reader poster title/body packs onto the modular row field (text-only).
 * Module = --layout-gap; stride = 2 × gap; origin = inner field top after pad-top.
 */

export const ROW_PACK_BEATS = [0, 0.14, 0.26, 0.38, 0.2, 0.32];

/**
 * @param {number} y
 * @param {number} stride
 */
export function snapToRowLine(y, stride) {
  if (!(stride > 0)) return Math.max(0, y);
  return Math.max(0, Math.round(y / stride) * stride);
}

/**
 * @param {number} y
 * @param {number} stride
 */
export function snapToRowLineCeil(y, stride) {
  if (!(stride > 0)) return Math.max(0, y);
  return Math.max(0, Math.ceil(y / stride - 1e-6) * stride);
}

/**
 * @param {number} contentH
 * @param {number} packH
 * @param {number} stride
 * @param {'start' | 'center' | 'vary'} [packAlign]
 * @param {number} [rhythm]
 * @param {number[]} [beats]
 */
export function snapPackStart(
  contentH,
  packH,
  stride,
  packAlign = 'vary',
  rhythm = 1,
  beats = ROW_PACK_BEATS
) {
  const free = Math.max(0, contentH - packH);
  const maxStart = Math.max(0, snapToRowLine(contentH - packH, stride));
  if (maxStart < stride || free < stride) return 0;

  if (packAlign === 'start') return 0;

  if (packAlign === 'center') {
    let start = snapToRowLine(free / 2, stride);
    if (start > maxStart) start = maxStart;
    while (start > 0 && start + packH > contentH + 0.5) {
      start = Math.max(0, start - stride);
    }
    return start;
  }

  const table = Array.isArray(beats) && beats.length ? beats : ROW_PACK_BEATS;
  const beat =
    table[((Math.max(1, rhythm) - 1) % table.length + table.length) % table.length];
  const fraction = Number.isFinite(Number(beat)) ? Math.max(0, Math.min(1, Number(beat))) : 0;
  let start = snapToRowLine(maxStart * fraction, stride);
  if (start > maxStart) start = maxStart;
  while (start > 0 && start + packH > contentH + 0.5) {
    start = Math.max(0, start - stride);
  }
  return start;
}

/**
 * @param {number} titleHeight
 * @param {number} packStart
 * @param {number} minGap
 * @param {number} stride
 */
export function snapStackGap(titleHeight, packStart, minGap, stride) {
  const titleBottom = packStart + titleHeight;
  const minBodyTop = titleBottom + Math.max(0, minGap);
  const bodyTop = snapToRowLineCeil(minBodyTop, stride);
  return Math.max(minGap, bodyTop - titleBottom);
}

function px(value) {
  const parsed = parseFloat(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * @param {HTMLElement} card `.post-card`
 * @returns {number} 1–6 grid rhythm, or 0
 */
export function posterGridRhythm(card) {
  const wrap = card.closest('.post-card-wrap');
  if (!wrap || wrap.classList.contains('reader-more-cases-wrap')) return 0;
  if (wrap.id === 'landing-name') return 1;

  const posters = wrap.parentElement;
  if (!posters) return 0;
  if (posters.id !== 'posters' && posters.id !== 'landing-posters') return 0;
  const wraps = Array.from(
    posters.querySelectorAll(':scope > .post-card-wrap:not(.reader-more-cases-wrap)')
  );
  const idx = wraps.indexOf(wrap);
  return idx >= 0 ? (idx % 6) + 1 : 0;
}

/**
 * @param {HTMLElement} card
 * @param {HTMLElement} el
 * @param {number} fieldTopPad
 */
export function fieldOffsetTop(card, el, fieldTopPad) {
  const cardRect = card.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.top - cardRect.top - fieldTopPad;
}

/**
 * @param {HTMLElement} card
 */
export function clearPosterRowSnap(card) {
  card.classList.remove('is-row-snapped');
  card.style.removeProperty('padding-top');
  card.style.removeProperty('row-gap');
  card.style.removeProperty('--poster-row-pack-start');
  card.style.removeProperty('--poster-row-stack-gap');
}

/**
 * @param {HTMLElement[]} posterEls `.post-card` elements in #posters / #landing-posters
 * @param {{
 *   enabled?: boolean,
 *   packAlign?: 'start' | 'center' | 'vary',
 *   beats?: number[]
 * }} [opts]
 */
export function snapPosterRows(posterEls, opts = {}) {
  if (opts.enabled === false) {
    for (const card of posterEls) clearPosterRowSnap(card);
    return;
  }

  const packAlign =
    opts.packAlign === 'start' || opts.packAlign === 'center' ? opts.packAlign : 'vary';
  const beats = Array.isArray(opts.beats) ? opts.beats : ROW_PACK_BEATS;

  for (const card of posterEls) {
    clearPosterRowSnap(card);

    const header = /** @type {HTMLElement | null} */ (card.querySelector('.post-header'));
    const body = /** @type {HTMLElement | null} */ (card.querySelector('.prose.post-body'));
    if (!header || !body) continue;

    const styles = getComputedStyle(card);
    if (styles.display !== 'grid') continue;

    const gap = px(styles.getPropertyValue('--layout-gap')) || 24;
    const stride = gap * 2;
    const rhythm = posterGridRhythm(card) || 1;

    const basePadTop =
      px(styles.getPropertyValue('--poster-pad-top')) || px(styles.paddingTop);
    const padBottom = px(styles.paddingBottom);
    const contentH = Math.max(0, card.clientHeight - basePadTop - padBottom);
    if (contentH < stride * 2) continue;

    card.classList.add('is-row-snapped');
    card.style.paddingTop = `${basePadTop}px`;
    card.style.rowGap = `${gap}px`;
    void card.offsetHeight;

    const titleH = header.offsetHeight;
    const headerGridRow = getComputedStyle(header).gridRowStart;
    const bodyGridRow = getComputedStyle(body).gridRowStart;
    const stacked = headerGridRow !== bodyGridRow;
    const minGap = gap;

    const bodyH = body.offsetHeight;
    const packH = stacked ? titleH + minGap + bodyH : Math.max(titleH, bodyH);
    if (packH <= 0 || packH > contentH) {
      clearPosterRowSnap(card);
      continue;
    }

    let packStart = snapPackStart(contentH, packH, stride, packAlign, rhythm, beats);
    let stackGap = minGap;
    if (stacked) {
      stackGap = snapStackGap(titleH, packStart, minGap, stride);
      const nextPack = titleH + stackGap + bodyH;
      if (packStart + nextPack > contentH + 0.5) {
        packStart = snapPackStart(contentH, nextPack, stride, packAlign, rhythm, beats);
        stackGap = snapStackGap(titleH, packStart, minGap, stride);
      }
    }

    card.style.paddingTop = `${Math.round(basePadTop + packStart)}px`;
    if (stacked) card.style.rowGap = `${Math.round(stackGap)}px`;
    else card.style.removeProperty('row-gap');
    void card.offsetHeight;

    const lead = stacked ? header : titleH >= bodyH ? header : body;
    const measured = fieldOffsetTop(card, lead, basePadTop);
    const target = snapToRowLine(measured, stride);
    const drift = measured - target;
    if (Math.abs(drift) > 0.75 && Math.abs(drift) < stride) {
      let nextStart = Math.max(0, packStart - drift);
      nextStart = snapToRowLine(nextStart, stride);
      if (stacked) {
        while (nextStart > 0 && nextStart + titleH + stackGap + bodyH > contentH + 0.5) {
          nextStart = Math.max(0, nextStart - stride);
        }
      }
      packStart = nextStart;
      card.style.paddingTop = `${Math.round(basePadTop + packStart)}px`;
      if (stacked) {
        stackGap = snapStackGap(titleH, packStart, minGap, stride);
        card.style.rowGap = `${Math.round(stackGap)}px`;
      }
    }

    packStart = Math.max(0, px(card.style.paddingTop) - basePadTop);
    card.style.setProperty('--poster-row-pack-start', `${packStart}px`);
    card.style.setProperty(
      '--poster-row-stack-gap',
      `${stacked ? px(card.style.rowGap) || stackGap : 0}px`
    );
  }
}
