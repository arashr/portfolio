/** @typedef {{ isometric: boolean, title: string }} ParsedImageTitle */

const ISOMETRIC_TITLE = /^(isometric|iso)$/i;

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
 * @param {string | null | undefined} title
 * @returns {ParsedImageTitle}
 */
export function parseImageTitle(title) {
  const raw = title?.trim() ?? '';
  if (!raw) return { isometric: false, title: '' };

  const tokens = raw.split(/[\s,|]+/).map((t) => t.trim()).filter(Boolean);
  const isometric = tokens.some((t) => ISOMETRIC_TITLE.test(t));
  const titleParts = tokens.filter((t) => !ISOMETRIC_TITLE.test(t));
  return { isometric, title: titleParts.join(' ') };
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
  const { isometric, title: displayTitle } = parseImageTitle(title);
  const caption = displayTitle.trim();
  const dimAttr =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? ` width="${Math.round(width)}" height="${Math.round(height)}"`
      : '';

  const titleAttr = !isometric && caption ? ` title="${escapeHtml(caption)}"` : '';
  const imgTag = `<img src="${src}" alt="${alt}"${dimAttr}${titleAttr} loading="lazy" decoding="async">`;
  const responsive =
    variants?.length &&
    `<picture><source type="image/webp" srcset="${variants
      .map((v) => `${v.url} ${v.w}w`)
      .join(', ')}" sizes="${RESPONSIVE_IMAGE_SIZES}">${imgTag}</picture>`;

  if (!isometric) {
    return responsive || imgTag;
  }

  const img = responsive || imgTag;
  const captionHtml = caption
    ? `<span class="prose-img-iso__caption mono-label">${escapeHtml(caption)}</span>`
    : '';

  return `<figure class="prose-img-iso"><div class="prose-img-iso__frame">${captionHtml}${img}</div></figure>`;
}
