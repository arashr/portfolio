import { normalizeRelativePath } from './local-md-links.js';

/** Directory containing the markdown file (no trailing slash). */
export function contentDirectoryForMarkdown(relativePath) {
  const normalized = normalizeRelativePath(String(relativePath || '').replace(/^\//, ''));
  if (!normalized) return '';
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * Resolve a relative image (or asset) path from markdown against the file location.
 * `src/hero.jpg` in `content/foo.md` → `/content/src/hero.jpg` when served from site root.
 *
 * @param {string} assetPath
 * @param {string} docRelativePath
 */
export function resolveContentAssetUrl(assetPath, docRelativePath) {
  const href = String(assetPath || '').trim();
  if (!href || /^(https?:|data:|blob:|mailto:|tel:)/i.test(href) || href.startsWith('//')) {
    return href;
  }
  if (href.startsWith('/')) return href;

  const base = contentDirectoryForMarkdown(docRelativePath);
  const normalized = normalizeRelativePath(href.replace(/^\.\//, ''));
  if (!normalized) return href;

  const combined = base ? `${base}/${normalized}` : normalized;
  return `/${normalizeRelativePath(combined)}`;
}
