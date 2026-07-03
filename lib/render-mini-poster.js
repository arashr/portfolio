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
 *   stats?: { value: string, label: string }[],
 *   credit?: string,
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
    stats = [],
    credit = '',
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
  const statsHtml =
    stats.length > 0
      ? `<div class="table-wrap mini-poster__stats" role="group" aria-label="Key metrics">
      <table>
        <thead><tr>${stats.map((s) => `<th>${escapeHtml(s.label)}</th>`).join('')}</tr></thead>
        <tbody><tr>${stats.map((s) => `<td>${escapeHtml(s.value)}</td>`).join('')}</tr></tbody>
      </table>
    </div>`
      : '';
  const creditHtml = credit
    ? `<p class="meta-strip mini-poster__credit mono-label"><span class="post-date">${escapeHtml(credit)}</span></p>`
    : '';
  const readMoreHtml = attrs['data-md-path']
    ? '<p class="landing-pick-more mono-label">READ MORE</p>'
    : '';
  const className = [
    'post-card',
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
      <div class="post-title-bounds">
        <h2 class="poster__title post-title mini-poster__title">${titleHtml}</h2>
      </div>
    </header>
    <div class="prose post-body mini-poster__body">
      ${subHtml ? `<p class="card-lede mini-poster__lede">${subHtml}</p>` : ''}
      ${statsHtml}
      ${creditHtml}
      ${readMoreHtml}
    </div>`;

  const allAttrs = {
    class: className,
    'data-slug': slug,
    'data-title-chars': (title || '').length,
    ...attrs
  };

  if (tag === 'button') {
    return `<button type="button"${attrsToString(allAttrs)}>${inner}</button>`;
  }
  return `<a${attrsToString(allAttrs)}>${inner}</a>`;
}

/** @param {{ path: string, title: string, subtext?: string, stats?: { value: string, label: string }[], credit?: string, index: number }[]} items */
export function renderMiniPosterGrid(items) {
  let previousGround = null;
  let previousFaceId = null;
  const parts = [];
  for (const { path, title, subtext, stats, credit, index } of items) {
    const slug = slugify(path.replace(/\.[^.]+$/, '')) || 'file';
    const ground = groundForSlug(slug, previousGround);
    const face = titleFaceForIndex(index, previousFaceId);
    const poster = renderMiniPoster({
      slug,
      title,
      subtext: subtext || path.split('/').pop() || path,
      stats: stats || [],
      credit: credit || '',
      index,
      tag: 'button',
      extraClass: 'landing-pick-card',
      attrs: { 'data-md-path': path },
      previousGround,
      previousFaceId
    });
    parts.push(
      `<div class="post-card-wrap ${ground} landing-pick-wrap">${poster}</div>`
    );
    previousGround = ground;
    previousFaceId = face.id;
  }
  return parts.join('\n');
}
