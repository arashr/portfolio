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

/**
 * @param {{ src: string, alt: string, title?: string | null, width?: number, height?: number }} opts — src/alt already escaped
 */
export function renderMarkdownImage(opts) {
  const { src, alt, title, width, height } = opts;
  const { isometric, title: displayTitle } = parseImageTitle(title);
  const caption = displayTitle.trim();
  const dimAttr =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? ` width="${Math.round(width)}" height="${Math.round(height)}"`
      : '';

  if (!isometric) {
    const titleAttr = caption ? ` title="${escapeHtml(caption)}"` : '';
    return `<img src="${src}" alt="${alt}"${dimAttr}${titleAttr} loading="lazy" decoding="async">`;
  }

  const img = `<img src="${src}" alt="${alt}"${dimAttr} loading="lazy" decoding="async">`;
  const captionHtml = caption
    ? `<span class="prose-img-iso__caption mono-label">${escapeHtml(caption)}</span>`
    : '';

  return `<figure class="prose-img-iso"><div class="prose-img-iso__frame">${captionHtml}${img}</div></figure>`;
}
