/** @typedef {{ isometric: boolean, half: boolean, isoGrid: boolean, title: string }} ParsedImageTitle */

const ISO_GRID_TITLE = /^(iso-grid|isogrid)$/i;
const ISOMETRIC_TITLE = /^(isometric|iso)$/i;
const HALF_TITLE = /^(half|half-right|bleed-right)$/i;

/** @param {string} str */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse markdown image title for layout flags (comma/space/pipe separated).
 * Layout flags are mutually exclusive — first match wins (`iso-grid`, `iso`, or `half`).
 * @param {string | null | undefined} title
 * @returns {ParsedImageTitle}
 */
export function parseImageTitle(title) {
  const raw = title?.trim() ?? '';
  if (!raw) {
    return {
      isometric: false,
      half: false,
      isoGrid: false,
      title: ''
    };
  }

  const tokens = raw.split(/[\s,|]+/).map((t) => t.trim()).filter(Boolean);
  let isometric = false;
  let half = false;
  let isoGrid = false;
  /** @type {number} */
  let layoutIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (ISO_GRID_TITLE.test(t)) {
      isometric = true;
      isoGrid = true;
      layoutIndex = i;
      break;
    }
    if (ISOMETRIC_TITLE.test(t)) {
      isometric = true;
      layoutIndex = i;
      break;
    }
    if (HALF_TITLE.test(t)) {
      half = true;
      layoutIndex = i;
      break;
    }
  }

  const titleParts = layoutIndex >= 0 ? tokens.filter((_, i) => i !== layoutIndex) : tokens;
  return { isometric, half, isoGrid, title: titleParts.join(' ') };
}

/** Matches typical prose / poster width — browsers pick a srcset entry automatically. */
export const RESPONSIVE_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 960px';

/**
 * @typedef {{ url: string, w: number }} ResolvedImageVariant
 */

/**
 * @param {{ src: string, alt: string, title?: string | null, width?: number, height?: number, variants?: ResolvedImageVariant[] }} opts — src/alt already escaped
 */
export function renderMarkdownImage(opts) {
  const { src, alt, title, width, height, variants } = opts;
  const { isometric, half, isoGrid, title: displayTitle } = parseImageTitle(title);
  const caption = displayTitle.trim();
  const dimAttr =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? ` width="${Math.round(width)}" height="${Math.round(height)}"`
      : '';

  const titleAttr =
    !isometric && !half && caption ? ` title="${escapeHtml(caption)}"` : '';
  const imgTag = `<img src="${src}" alt="${alt}"${dimAttr}${titleAttr} loading="lazy" decoding="async">`;
  const responsive =
    variants?.length &&
    `<picture><source type="image/webp" srcset="${variants
      .map((v) => `${v.url} ${v.w}w`)
      .join(', ')}" sizes="${RESPONSIVE_IMAGE_SIZES}">${imgTag}</picture>`;

  const img = responsive || imgTag;

  if (half) {
    return `<figure class="prose-img-half">${img}</figure>`;
  }

  if (!isometric) {
    return img;
  }

  const captionHtml = caption
    ? `<span class="prose-img-iso__caption mono-label">${escapeHtml(caption)}</span>`
    : '';
  const figureClass = isoGrid ? 'prose-img-iso prose-img-iso--grid' : 'prose-img-iso';

  return `<figure class="${figureClass}"><div class="prose-img-iso__frame">${captionHtml}${img}</div></figure>`;
}
