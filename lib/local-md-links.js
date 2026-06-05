const MARKDOWN_EXT = /\.(md|markdown|txt)$/i;

/** @param {string} href */
export function isFragmentHref(href) {
  return typeof href === 'string' && href.startsWith('#');
}

/** @param {string} href */
export function isExternalHref(href) {
  if (!href || isFragmentHref(href)) return false;
  return /^(https?:|mailto:|tel:|javascript:)/i.test(href.trim());
}

/** @param {string} href */
export function isLocalMarkdownHref(href) {
  if (!href || isFragmentHref(href) || isExternalHref(href)) return false;
  const path = href.split(/[?#]/, 1)[0];
  if (!path || path.startsWith('//')) return false;
  return MARKDOWN_EXT.test(path);
}

/**
 * Resolve a markdown href against the open file path within a granted folder.
 * Returns a normalized relative path or null when unsafe / unsupported.
 *
 * @param {string} baseRelativePath - e.g. "docs/guide.md" or "guide.md"
 * @param {string} href
 */
export function resolveRelativeMarkdownPath(baseRelativePath, href) {
  if (!isLocalMarkdownHref(href)) return null;

  const target = href.split(/[?#]/, 1)[0];
  const baseParts = baseRelativePath.includes('/')
    ? baseRelativePath.split('/').slice(0, -1)
    : [];
  const targetParts = target.split(/[\\/]/);
  const stack = [...baseParts];

  for (const part of targetParts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!stack.length) return null;
      stack.pop();
      continue;
    }
    stack.push(part);
  }

  const normalized = stack.join('/');
  if (!normalized || !MARKDOWN_EXT.test(normalized)) return null;
  return normalized;
}

/** @param {string} path */
export function normalizeRelativePath(path) {
  const parts = path.split('/').filter((part) => part && part !== '.');
  const stack = [];
  for (const part of parts) {
    if (part === '..') {
      if (!stack.length) return null;
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join('/');
}

/**
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} relativePath
 */
export async function readMarkdownFromDirectory(dirHandle, relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized) throw new Error('Invalid path');

  const parts = normalized.split('/');
  let dir = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i]);
  }
  const fileHandle = await dir.getFileHandle(parts[parts.length - 1]);
  const file = await fileHandle.getFile();
  return { file, fileHandle, relativePath: normalized };
}
