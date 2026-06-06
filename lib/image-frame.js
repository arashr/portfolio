/** @typedef {{ isometric: boolean, title: string }} ParsedImageTitle */

const ISOMETRIC_TITLE = /^(isometric|iso)$/i;

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
 * @param {{ src: string, alt: string, title?: string | null }} opts — src/alt already escaped
 */
export function renderMarkdownImage(opts) {
  const { src, alt, title } = opts;
  const { isometric, title: displayTitle } = parseImageTitle(title);
  const titleAttr = displayTitle ? ` title="${displayTitle}"` : '';
  const img = `<img src="${src}" alt="${alt}"${titleAttr} loading="lazy" decoding="async">`;

  if (!isometric) return img;

  return `<figure class="prose-img-iso"><div class="prose-img-iso__frame">${img}</div></figure>`;
}
