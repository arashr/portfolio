import { fetchBundledMarkdown } from './bundled-md.js';
import { peekCaseStudyListing } from './parse-document.js';
import { CONTENT_INDEX_PATH, normalizeContentIndex, SITE_CONFIG_PATH } from './content-catalog.js';

/**
 * @param {string} [indexPath]
 * @param {string} [baseHref]
 * @param {{ cacheBust?: boolean }} [options]
 */
export async function fetchContentIndex(
  indexPath = CONTENT_INDEX_PATH,
  baseHref = globalThis.location?.href,
  options = {}
) {
  const { text } = await fetchBundledMarkdown(indexPath, baseHref, {
    cacheBust: options.cacheBust
  });
  return normalizeContentIndex(JSON.parse(text), { allowEmpty: true });
}

/**
 * Optional homepage hero copy (`content/site.json`).
 *
 * @param {string} [sitePath]
 * @param {string} [baseHref]
 */
export async function fetchSiteConfig(
  sitePath = SITE_CONFIG_PATH,
  baseHref = globalThis.location?.href,
  options = {}
) {
  try {
    const { text } = await fetchBundledMarkdown(sitePath, baseHref, {
      cacheBust: options.cacheBust
    });
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object') return {};
    const title = raw.title != null ? String(raw.title) : undefined;
    const tagline = raw.tagline != null ? String(raw.tagline) : undefined;
    return { title, tagline };
  } catch {
    return {};
  }
}

/**
 * @param {{ cases: string[] }} index
 * @param {string} [baseHref]
 */
export async function resolveCaseStudyItems(
  index,
  baseHref = globalThis.location?.href,
  options = {}
) {
  const items = await Promise.all(
    index.cases.map(async (path, index) => {
      const { text } = await fetchBundledMarkdown(path, baseHref, {
        cacheBust: options.cacheBust
      });
      const filename = path.split('/').pop() || path;
      const { title, subtext } = peekCaseStudyListing(text, filename);
      const slug = path.replace(/\.[^.]+$/, '').split('/').pop() || 'case';
      return { path, slug, title, subtext, index };
    })
  );
  return items;
}
