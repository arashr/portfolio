import { normalizeRelativePath } from './local-md-links.js';

/** @param {string} relativePath @param {string} baseHref */
export function resolveBundledMarkdownUrl(relativePath, baseHref) {
  const normalized = normalizeRelativePath(relativePath.replace(/^\//, ''));
  if (!normalized) return null;
  try {
    return new URL(normalized, baseHref);
  } catch {
    return null;
  }
}

/**
 * Read a markdown file bundled with the app from the same origin only.
 *
 * @param {string} relativePath
 * @param {string} [baseHref]
 * @param {{ cacheBust?: boolean }} [options]
 */
export async function fetchBundledMarkdown(
  relativePath,
  baseHref = globalThis.location?.href,
  options = {}
) {
  const normalized = normalizeRelativePath(relativePath.replace(/^\//, ''));
  if (!normalized) throw new Error('Invalid path');

  const url = resolveBundledMarkdownUrl(normalized, baseHref);
  if (!url) throw new Error('Invalid path');
  if (globalThis.location?.origin && url.origin !== globalThis.location.origin) {
    throw new Error('Off origin');
  }
  if (options.cacheBust) url.searchParams.set('_', String(Date.now()));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Not found: ${res.status}`);
  return { text: await res.text(), relativePath: normalized };
}
