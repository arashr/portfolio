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
 * App root prefix for static hosting (e.g. `/` locally, `/portfolio/` on GitHub Pages).
 *
 * @param {{ pathname?: string }} [location]
 */
export function getAppBasePath(location = globalThis.location) {
  const pathname = location?.pathname;
  if (!pathname || pathname === '/') return '/';

  let path = pathname;
  if (path.endsWith('/index.html')) {
    path = path.slice(0, -'/index.html'.length);
  } else if (/\.[a-z0-9]+$/i.test(path)) {
    const slash = path.lastIndexOf('/');
    path = slash < 0 ? '/' : path.slice(0, slash + 1);
  }
  if (!path.endsWith('/')) path = `${path}/`;
  return path || '/';
}

/**
 * Prefix a site-relative path with the app base (GitHub Pages project subpath).
 *
 * @param {string} basePath
 * @param {string} siteRelativePath
 */
export function joinSiteRoot(basePath, siteRelativePath) {
  const path = normalizeRelativePath(String(siteRelativePath || '').replace(/^\/+/, ''));
  if (!path) return basePath === '/' ? '/' : basePath;
  if (basePath === '/') return `/${path}`;
  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${base}${path}`;
}

/**
 * Resolve a relative image (or asset) path from markdown against the file location.
 * `src/hero.jpg` in `content/foo.md` → `/content/src/hero.jpg` at site root, or
 * `/portfolio/content/src/hero.jpg` when hosted under `/portfolio/`.
 *
 * @param {string} assetPath
 * @param {string} docRelativePath
 * @param {string} [basePath]
 */
export function resolveContentAssetUrl(assetPath, docRelativePath, basePath = getAppBasePath()) {
  const href = String(assetPath || '').trim();
  if (!href || /^(https?:|data:|blob:|mailto:|tel:)/i.test(href) || href.startsWith('//')) {
    return href;
  }

  if (href.startsWith('/')) {
    return joinSiteRoot(basePath, href);
  }

  const docDir = contentDirectoryForMarkdown(docRelativePath);
  const normalized = normalizeRelativePath(href.replace(/^\.\//, ''));
  if (!normalized) return href;

  const combined = docDir ? `${docDir}/${normalized}` : normalized;
  return joinSiteRoot(basePath, combined);
}

/**
 * Repo-relative asset key for dimension lookup (e.g. `content/src/hero.png`).
 *
 * @param {string} assetPath
 * @param {string} docRelativePath
 * @returns {string | null}
 */
export function contentAssetKey(assetPath, docRelativePath) {
  const href = String(assetPath || '').trim();
  if (!href || /^(https?:|data:|blob:|mailto:|tel:)/i.test(href) || href.startsWith('//')) {
    return null;
  }

  if (href.startsWith('/')) {
    return normalizeRelativePath(href.replace(/^\//, ''));
  }

  const docDir = contentDirectoryForMarkdown(docRelativePath);
  const normalized = normalizeRelativePath(href.replace(/^\.\//, ''));
  if (!normalized) return null;

  const combined = docDir ? `${docDir}/${normalized}` : normalized;
  return normalizeRelativePath(combined);
}
