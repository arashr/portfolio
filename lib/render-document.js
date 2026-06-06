import { marked } from 'marked';
import { groundForSlug } from './grounds.js';
import { titleFaceForIndex } from './title-faces.js';
import { posterStaggerRem } from './stagger.js';
import { sanitizeHtml } from './sanitize.js';
import { inlineMarkdownToHtml, stripInlineCodeMarkup } from './inline-markdown.js';
import { resolveContentAssetUrl } from './content-assets.js';
import { renderMarkdownImage } from './image-frame.js';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const usedHeadingIds = new Set();

function resetHeadingIds() {
  usedHeadingIds.clear();
}

function slugifyHeading(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'heading'
  );
}

function uniqueHeadingId(rawText) {
  let base = slugifyHeading(rawText);
  let id = base;
  let n = 2;
  while (usedHeadingIds.has(id)) {
    id = `${base}-${n}`;
    n++;
  }
  usedHeadingIds.add(id);
  return id;
}

/** @type {string} */
let activeContentPath = '';

export function setRenderContentPath(relativePath) {
  activeContentPath = relativePath || '';
}

function configureMarked() {
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const raw = tokens.map((t) => t.raw).join('');
    let text = this.parser.parseInline(tokens);
    if (depth >= 2 && depth <= 4) {
      text = stripInlineCodeMarkup(text);
    }
    const id = uniqueHeadingId(raw);
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };
  renderer.image = function ({ href, title, text }) {
    const src = activeContentPath
      ? resolveContentAssetUrl(href, activeContentPath)
      : href;
    return renderMarkdownImage({
      src: escapeHtml(src),
      alt: escapeHtml(text || ''),
      title
    });
  };
  marked.setOptions({ gfm: true, breaks: false, renderer });
}

configureMarked();

function wrapTables(html) {
  return html.replace(
    /<table(\s[^>]*)?>/gi,
    '<div class="table-wrap"><table$1>'
  ).replace(/<\/table>/gi, '</table></div>');
}

function mdToHtml(markdown) {
  if (!markdown?.trim()) return '';
  return sanitizeHtml(wrapTables(marked.parse(markdown.trim())));
}

/**
 * @param {import('./parse-document.js').ParsedDocument} doc
 * @param {string} fileLabel
 * @param {{ kicker?: string, contentPath?: string, description?: string }} [opts]
 */
export function renderDocument(doc, fileLabel, opts = {}) {
  resetHeadingIds();
  setRenderContentPath(opts.contentPath || fileLabel);

  let previousStaggerRem = null;
  let previousGround = null;
  let previousFaceId = null;
  const postersHtml = doc.posters
    .map((poster) => {
      const ground = groundForSlug(poster.slug, previousGround);
      const face = titleFaceForIndex(poster.index, previousFaceId);
      previousGround = ground;
      previousFaceId = face.id;
      const staggerRem = posterStaggerRem(poster.slug, poster.index, previousStaggerRem);
      previousStaggerRem = staggerRem;
      // Reserve poster slug before body headings (matches buildToc used-set order).
      usedHeadingIds.add(poster.slug);
      const bodyHtml = mdToHtml(poster.bodyMarkdown);

      return `
    <div class="post-card-wrap ${ground} reveal is-visible" style="--poster-shift: ${staggerRem}rem">
      <article class="post-card ${ground} title-face-${face.id}" id="${escapeHtml(poster.slug)}" data-slug="${escapeHtml(poster.slug)}" data-search="${escapeHtml(poster.searchText)}" data-title-chars="${(poster.plainTitle || '').length}">
        <div class="post-card__glyph-layer" aria-hidden="true">
          <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
        </div>
        <header class="post-header">
          <div class="post-title-bounds">
            <h2 class="poster__title post-title"><a href="#${escapeHtml(poster.slug)}">${inlineMarkdownToHtml(poster.title, { forTitle: true })}</a></h2>
          </div>
        </header>
        <div class="prose post-body">${bodyHtml}</div>
      </article>
    </div>`;
    })
    .join('\n');

  const introHtml = doc.introMarkdown ? mdToHtml(doc.introMarkdown) : '';

  const kicker = opts.kicker || 'Case study';
  const description = opts.description?.trim();

  return `
    <header class="poster collection-hero reveal is-visible">
      <p class="kicker">${escapeHtml(kicker)}</p>
      <h1 class="poster__title">${inlineMarkdownToHtml(doc.title, { forTitle: true })}</h1>
      ${description ? `<p class="doc-meta mono-label">${escapeHtml(description)}</p>` : ''}
      ${introHtml ? `<div class="case-hero__sub prose-brief">${introHtml}</div>` : ''}
    </header>
    <div id="posters" class="posts-list poster-gallery" aria-label="Posters">
      ${postersHtml}
    </div>`;
}

export function renderToc(toc) {
  if (!toc.length) {
    return '<p class="toc-empty mono-label">No headings in this file.</p>';
  }
  return `<ol class="toc-list">
    ${toc
      .map(
        (item) =>
          `<li class="toc-item toc-depth-${item.depth}"><a href="#${escapeHtml(item.id)}" data-toc-link>${inlineMarkdownToHtml(item.text, item.depth === 2 ? { forTitle: true } : {})}</a></li>`
      )
      .join('\n')}
  </ol>`;
}
