/** @param {string} value */
export function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {{ title?: string, tagline?: string, description?: string, url?: string }} site
 */
export function buildSocialMetaTags(site = {}) {
  const title = site.title?.trim() || 'Arash Ranjbaran';
  const description =
    site.description?.trim() || 'Case studies in product design, design systems, and growth.';
  const baseUrl = (site.url || 'https://arashr.github.io/portfolio/').replace(/\/?$/, '/');
  const imageUrl = `${baseUrl}og-image.png`;
  const imageWidth = site.ogImageWidth || 1200;
  const imageHeight = site.ogImageHeight || 630;

  return [
    `<meta name="description" content="${escapeHtmlAttr(description)}">`,
    `<link rel="canonical" href="${baseUrl}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${baseUrl}">`,
    `<meta property="og:title" content="${escapeHtmlAttr(title)}">`,
    `<meta property="og:description" content="${escapeHtmlAttr(description)}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:width" content="${imageWidth}">`,
    `<meta property="og:image:height" content="${imageHeight}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(title)}">`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(description)}">`,
    `<meta name="twitter:image" content="${imageUrl}">`
  ].join('\n  ');
}
