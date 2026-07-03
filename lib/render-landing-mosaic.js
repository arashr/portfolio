import { inlineMarkdownToHtml } from './inline-markdown.js';
import { slugify } from './parse-document.js';
import { groundForSlug, getGrounds } from './grounds.js';
import { titleFaceForIndex } from './title-faces.js';
import { getGalleryConfig } from './gallery-config.js';
import {
  pickBleedSymbol,
  resolveTitleBleedSymbolPool,
  titleToBleedRhythm
} from './title-bleed-rhythm.js';

/** @typedef {{ path: string, title: string, index: number, subtext?: string, stats?: { value: string, label: string }[], credit?: string }} CaseItem */
/** @typedef {{ title: string, description: string }} AsideSection */
/** @typedef {{ text: string, ground: string } | null} TitleBleedState */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {TitleBleedState} previousTitleBleed
 */
function renderTitleBleedHtml(previousTitleBleed) {
  if (!previousTitleBleed) return '';
  return `
        <div class="post-card__title-bleed ${previousTitleBleed.ground}" aria-hidden="true">
          <span class="post-card__title-bleed-text poster__title">${previousTitleBleed.text}</span>
        </div>`;
}

/**
 * @param {{ previousTitleBleed: TitleBleedState }} state
 * @param {string} plainTitle
 * @param {string} ground
 * @param {string} symbolPool
 */
function setNextTitleBleed(state, plainTitle, ground, symbolPool) {
  state.previousTitleBleed = {
    text: escapeHtml(titleToBleedRhythm(plainTitle, pickBleedSymbol(symbolPool))),
    ground
  };
}

/**
 * @param {{ title?: string, tagline?: string }} site
 * @param {{ previousGround: string | null, previousFaceId: string | null, previousTitleBleed: TitleBleedState }} state
 * @param {string} symbolPool
 */
function renderNamePoster(site, state, symbolPool) {
  const ground = 'ground-indigo';
  const title = site?.title || 'Portfolio';
  const titleHtml = inlineMarkdownToHtml(title, { forTitle: true });
  const plainTitle = String(title).replace(/\s+/g, ' ').trim();
  const tagline = escapeHtml(site?.tagline || '');

  state.previousGround = ground;
  state.previousFaceId = 'bricolage-grotesque';
  setNextTitleBleed(state, plainTitle, ground, symbolPool);

  return `<div id="landing-name" class="post-card-wrap ${ground} landing-name-wrap" role="presentation">
    <article class="post-card ${ground} title-face-bricolage-grotesque landing-name-card" data-slug="landing-name" data-title-chars="${plainTitle.length}">
      <div class="post-card__glyph-layer" aria-hidden="true">
        <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
      </div>
      <header class="post-header">
        <div class="post-title-bounds">
          <h1 class="poster__title post-title">${titleHtml}</h1>
        </div>
      </header>
      <div class="prose post-body landing-name-body">${tagline ? `<p class="meta-strip mono-label">${tagline}</p>` : '<p aria-hidden="true">&#8203;</p>'}</div>
    </article>
  </div>`;
}

/**
 * @param {{ value: string, label: string }[]} stats
 */
function renderStatsTable(stats) {
  if (!stats.length) return '';
  return `<div class="table-wrap" role="group" aria-label="Key metrics">
    <table>
      <thead><tr>${stats.map((s) => `<th>${escapeHtml(s.label)}</th>`).join('')}</tr></thead>
      <tbody><tr>${stats.map((s) => `<td>${escapeHtml(s.value)}</td>`).join('')}</tr></tbody>
    </table>
  </div>`;
}

/**
 * @param {CaseItem} item
 * @param {{ previousGround: string | null, previousFaceId: string | null, previousTitleBleed: TitleBleedState }} state
 * @param {string} symbolPool
 */
function renderCasePoster(item, state, symbolPool) {
  const { path, title, index, subtext, stats = [], credit = '' } = item;
  const slug = slugify(path.replace(/\.[^.]+$/, '')) || 'file';
  const ground = groundForSlug(slug, state.previousGround);
  const face = titleFaceForIndex(index, state.previousFaceId);
  const titleHtml = inlineMarkdownToHtml(title, { forTitle: true });
  const plainTitle = String(title || '').replace(/\s+/g, ' ').trim();
  const lede = subtext || path.split('/').pop() || path;
  const bleedHtml = renderTitleBleedHtml(state.previousTitleBleed);

  state.previousGround = ground;
  state.previousFaceId = face.id;
  setNextTitleBleed(state, plainTitle, ground, symbolPool);

  return `<div class="post-card-wrap ${ground} landing-pick-wrap" role="listitem">${bleedHtml}
    <button type="button" class="post-card ${ground} title-face-${face.id} landing-pick-card" data-md-path="${escapeHtml(path)}" data-slug="${escapeHtml(slug)}" data-title-chars="${plainTitle.length}">
      <div class="post-card__glyph-layer" aria-hidden="true">
        <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
      </div>
      <header class="post-header">
        <div class="post-title-bounds">
          <h2 class="poster__title post-title">${titleHtml}</h2>
        </div>
      </header>
      <div class="prose post-body">
        ${lede ? `<p>${escapeHtml(lede)}</p>` : ''}
        ${renderStatsTable(stats)}
        ${credit ? `<p class="meta-strip mono-label"><span class="post-date">${escapeHtml(credit)}</span></p>` : ''}
      </div>
    </button>
  </div>`;
}

/**
 * @param {number} index
 */
function groundForAsideIndex(index) {
  const grounds = getGrounds();
  if (!grounds.length) return 'ground-pink';
  return grounds[index % grounds.length];
}

/**
 * @param {AsideSection} section
 * @param {number} index
 * @param {{ previousGround: string | null, previousFaceId: string | null, previousTitleBleed: TitleBleedState }} state
 * @param {string} symbolPool
 */
function renderAsidePoster(section, index, state, symbolPool) {
  const ground = groundForAsideIndex(index);
  const slug = slugify(section.title) || `home-aside-${index}`;
  const face = titleFaceForIndex(index + 100, state.previousFaceId);
  const plainTitle = String(section.title || '').replace(/\s+/g, ' ').trim();
  const bleedHtml = renderTitleBleedHtml(state.previousTitleBleed);
  const paras = section.description
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  state.previousGround = ground;
  state.previousFaceId = face.id;
  setNextTitleBleed(state, plainTitle, ground, symbolPool);

  return `<div class="post-card-wrap ${ground} landing-aside-wrap" role="listitem">${bleedHtml}
    <article class="post-card ${ground} title-face-${face.id}" data-slug="${escapeHtml(slug)}" data-title-chars="${plainTitle.length}">
      <div class="post-card__glyph-layer" aria-hidden="true">
        <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
      </div>
      <header class="post-header">
        <div class="post-title-bounds">
          <h2 class="poster__title post-title">${escapeHtml(section.title)}</h2>
        </div>
      </header>
      <div class="prose post-body">${paras}</div>
    </article>
  </div>`;
}

/**
 * @param {{ site?: { title?: string, tagline?: string }, items: CaseItem[], aside?: { sections?: AsideSection[] } }} opts
 */
export function renderLandingMosaic({ site, items, aside }) {
  const sections = aside?.sections || [];
  const symbolPool = resolveTitleBleedSymbolPool(getGalleryConfig());
  const state = {
    previousGround: null,
    previousFaceId: null,
    previousTitleBleed: null
  };

  const nameHtml = renderNamePoster(site, state, symbolPool);
  const posters = [
    ...items.map((item) => renderCasePoster(item, state, symbolPool)),
    ...sections.map((section, index) => renderAsidePoster(section, index, state, symbolPool))
  ].join('\n');

  return `${nameHtml}
    <div id="landing-posters" class="posts-list poster-gallery landing-posters" role="list" aria-label="Case studies">
      ${posters}
    </div>`;
}
