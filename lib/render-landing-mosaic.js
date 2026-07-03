import { renderMiniPoster } from './render-mini-poster.js';
import { slugify } from './parse-document.js';
import { groundForSlug, getGrounds } from './grounds.js';
import { titleFaceForIndex } from './title-faces.js';

/** @typedef {{ path: string, title: string, index: number, subtext?: string, stats?: { value: string, label: string }[], credit?: string }} CaseItem */
/** @typedef {{ title: string, description: string }} AsideSection */

/** Uneven trio column weights — cycle per row (Swiss grid rhythm). */
const TRIO_ROW_WEIGHTS = [
  [42, 33, 25],
  [25, 42, 33],
  [33, 25, 42]
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {CaseItem[]} items
 */
function packCaseRows(items) {
  /** @type {{ cells: { kind: 'case', data: CaseItem }[], rowIndex: number, count: number }[]} */
  const rows = [];
  for (let i = 0; i < items.length; i += 3) {
    const chunk = items.slice(i, i + 3);
    rows.push({
      cells: chunk.map((data) => ({ kind: 'case', data })),
      rowIndex: rows.length,
      count: chunk.length
    });
  }
  return rows;
}

/**
 * @param {{ title?: string, tagline?: string }} site
 */
function renderHero(site) {
  const title = escapeHtml(site?.title || 'Portfolio');
  const tagline = escapeHtml(site?.tagline || '');
  const slug = slugify(site?.title || 'portfolio') || 'home-hero';
  return `<article class="landing-mosaic__hero landing-mosaic__cell post-card ground-indigo" data-slug="${escapeHtml(slug)}" data-title-chars="${(site?.title || '').length}" aria-label="Introduction">
    <div class="post-card__glyph-layer" aria-hidden="true">
      <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
    </div>
    <div class="landing-mosaic__hero-inner">
      <h1 class="landing-mosaic__hero-title title-face-roboto700">${title}</h1>
      ${tagline ? `<p class="landing-mosaic__hero-tagline mono-label">${tagline}</p>` : ''}
    </div>
  </article>`;
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
 */
function renderAsideCell(section, index) {
  const ground = groundForAsideIndex(index);
  const slug = slugify(section.title) || `home-aside-${index}`;
  const paras = section.description
    .split(/\n{2,}/)
    .map((p) => `<p class="landing-mosaic__aside-desc">${escapeHtml(p)}</p>`)
    .join('');
  return `<article class="landing-mosaic__cell landing-mosaic__aside post-card ${ground}" data-slug="${escapeHtml(slug)}" data-title-chars="${(section.title || '').length}">
    <div class="post-card__glyph-layer" aria-hidden="true">
      <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
    </div>
    <div class="landing-mosaic__aside-inner">
      <h2 class="landing-mosaic__aside-title">${escapeHtml(section.title)}</h2>
      ${paras}
    </div>
  </article>`;
}

/**
 * @param {{ kind: 'case', data: CaseItem }} tile
 * @param {{ previousGround: string | null, previousFaceId: string | null }} state
 */
function renderCaseTile(tile, state) {
  const { path, title, index, subtext, stats, credit } = tile.data;
  const slug = slugify(path.replace(/\.[^.]+$/, '')) || 'file';
  const ground = groundForSlug(slug, state.previousGround);
  const face = titleFaceForIndex(index, state.previousFaceId);

  const poster = renderMiniPoster({
    slug,
    title,
    subtext: subtext || path.split('/').pop() || path,
    stats: stats || [],
    credit: credit || '',
    index,
    tag: 'button',
    extraClass: 'landing-pick-card landing-mosaic__pick landing-mosaic__cell',
    attrs: { 'data-md-path': path, role: 'listitem' },
    previousGround: state.previousGround,
    previousFaceId: state.previousFaceId
  });

  state.previousGround = ground;
  state.previousFaceId = face.id;

  return poster;
}

/**
 * @param {{ cells: { kind: 'case', data: CaseItem }[], rowIndex: number, count: number }[]} rows
 * @param {{ previousGround: string | null, previousFaceId: string | null }} state
 */
function renderCaseRows(rows, state) {
  return rows
    .map(({ cells, rowIndex, count }) => {
      let rowClass = 'landing-mosaic__row';
      if (count === 3) {
        rowClass += ` landing-mosaic__row--trio landing-mosaic__row--trio-${rowIndex % TRIO_ROW_WEIGHTS.length}`;
      } else if (count === 2) {
        rowClass += ` landing-mosaic__row--duo landing-mosaic__row--duo-${rowIndex % 2 === 0 ? 'a' : 'b'}`;
      }

      const cellsHtml = cells.map((tile) => renderCaseTile(tile, state)).join('');
      return `<div class="${rowClass}">${cellsHtml}</div>`;
    })
    .join('\n');
}

/**
 * @param {{ site?: { title?: string, tagline?: string }, items: CaseItem[], aside?: { sections?: AsideSection[] } }} opts
 */
export function renderLandingMosaic({ site, items, aside }) {
  const sections = aside?.sections || [];
  const state = { previousGround: null, previousFaceId: null };

  const heroHtml = `<div class="landing-mosaic__hero-band">${renderHero(site)}</div>`;
  const caseRowsHtml = items.length
    ? `<div class="landing-mosaic__cases">${renderCaseRows(packCaseRows(items), state)}</div>`
    : '';

  const notesRowsHtml = sections.length
    ? `<div class="landing-mosaic__notes landing-mosaic__notes--grid" aria-label="Notes">${sections
        .map((section, asideIndex) => renderAsideCell(section, asideIndex))
        .join('')}</div>`
    : '';

  return `<div class="landing-mosaic">${heroHtml}${caseRowsHtml}${notesRowsHtml}</div>`;
}
