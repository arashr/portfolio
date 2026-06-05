import { inlineMarkdownToHtml } from './inline-markdown.js';
import { groundForSlug } from './grounds.js';
import { titleFaceForIndex } from './title-faces.js';
import { slugify } from './parse-document.js';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attrsToString(attrs) {
  if (!attrs || typeof attrs !== 'object') return '';
  return Object.entries(attrs)
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => ` ${k}="${escapeHtml(String(v))}"`)
    .join('');
}

/**
 * Horizontal mini poster (landing featured + folder file grid).
 * Uses the same ground / title-face / glyph stack as reader posters.
 *
 * @param {{
 *   slug?: string,
 *   title: string,
 *   subtext?: string,
 *   index?: number,
 *   tag?: 'button' | 'a',
 *   attrs?: Record<string, string | number | boolean>,
 *   extraClass?: string,
 * }} opts
 */
export function renderMiniPoster(opts) {
  const {
    slug: slugIn,
    title,
    subtext = '',
    index = 0,
    tag = 'button',
    attrs = {},
    extraClass = '',
    previousGround = null,
    previousFaceId = null
  } = opts;
  const slug = slugIn || slugify(title) || 'poster';
  const ground = groundForSlug(slug, previousGround);
  const face = titleFaceForIndex(index, previousFaceId);
  const titleHtml = inlineMarkdownToHtml(title, { forTitle: true });
  const subHtml = subtext ? escapeHtml(subtext) : '';
  const className = [
    'mini-poster',
    ground,
    `title-face-${face.id}`,
    extraClass
  ]
    .filter(Boolean)
    .join(' ');

  const inner = `
    <div class="post-card__glyph-layer" aria-hidden="true">
      <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
    </div>
    <header class="post-header mini-poster__head">
      <h2 class="poster__title post-title mini-poster__title">${titleHtml}</h2>
    </header>
    <div class="mini-poster__body post-body">
      ${subHtml ? `<p class="card-lede mini-poster__lede">${subHtml}</p>` : ''}
    </div>`;

  const allAttrs = {
    class: className,
    'data-slug': slug,
    ...attrs
  };

  if (tag === 'button') {
    return `<button type="button"${attrsToString(allAttrs)}>${inner}</button>`;
  }
  return `<a${attrsToString(allAttrs)}>${inner}</a>`;
}

/** @param {{ path: string, title: string, subtext?: string, index: number }[]} items */
export function renderMiniPosterGrid(items) {
  let previousGround = null;
  let previousFaceId = null;
  const parts = [];
  for (const { path, title, subtext, index } of items) {
    const slug = slugify(path.replace(/\.[^.]+$/, '')) || 'file';
    parts.push(
      renderMiniPoster({
        slug,
        title,
        subtext: subtext || path.split('/').pop() || path,
        index,
        tag: 'button',
        extraClass: 'landing-pick-card reveal is-visible',
        attrs: { 'data-md-path': path },
        previousGround,
        previousFaceId
      })
    );
    const ground = groundForSlug(slug, previousGround);
    const face = titleFaceForIndex(index, previousFaceId);
    previousGround = ground;
    previousFaceId = face.id;
  }
  return parts.join('\n');
}
