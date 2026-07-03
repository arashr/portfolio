import { reloadGalleryConfig, getGalleryConfig, applyGalleryConfigToDocument } from '../../lib/gallery-config.js';
import { getGrounds } from '../../lib/grounds.js';
import { renderPosterGlyphPatterns } from '../../lib/poster-glyph-render.js';
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  findFont,
  applyPairing,
  buildFontsHref
} from './fonts.js';
import { DEMO_SECTIONS } from './sections.js';
import { DEFAULT_TITLE_LINES, renderTwoLineTitleHtml } from './title-layout.js';
import {
  DEFAULT_TYPOGRAPHY,
  typographyForDisplayId,
  applyTitleTypography,
  configSnippet,
  typographyFromUrl
} from './typography.js';

const CONFIG_URL = '../../config/gallery.config.json';

/** @param {string} str */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {number} count */
function shuffledGrounds(count) {
  const grounds = getGrounds();
  if (!grounds.length) return Array.from({ length: count }, () => 'ground-pink');

  /** @type {string[]} */
  const picks = [];
  let prev = null;
  for (let i = 0; i < count; i++) {
    const pool = grounds.length > 1 ? grounds.filter((g) => g !== prev) : grounds;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    picks.push(pick);
    prev = pick;
  }
  return picks;
}

/** @template T @param {T[]} items */
function shuffle(items) {
  const copy = [...items];
  for (let i = 0; i < copy.length - 1; i++) {
    const j = i + 1 + Math.floor(Math.random() * (copy.length - i - 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * @param {[string, string]} titleLines
 */
function renderTitleHtml(titleLines) {
  return renderTwoLineTitleHtml(titleLines, escapeHtml);
}

/**
 * @param {{ slug: string, title: string, bodyHtml: string }} section
 * @param {string} ground
 * @param {[string, string]} titleLines
 */
function renderSection(section, ground, titleLines) {
  const titleInner = renderTitleHtml(titleLines);
  const slug = section.slug;
  return `
    <div class="post-card-wrap ${ground}">
      <article class="post-card ${ground}" id="${escapeHtml(slug)}" data-slug="${escapeHtml(slug)}" data-title-chars="${titleLines.join('').length}">
        <div class="post-card__glyph-layer" aria-hidden="true">
          <canvas class="post-card__glyph-canvas" data-glyph-canvas></canvas>
        </div>
        <header class="post-header">
          <div class="post-title-bounds">
            <h2 class="poster__title post-title"><a href="#${escapeHtml(section.slug)}">${titleInner}</a></h2>
          </div>
        </header>
        <div class="prose post-body">${section.bodyHtml}</div>
      </article>
    </div>`;
}

/**
 * @param {{
 *   bodyId: string,
 *   displayId: string,
 *   sections: typeof DEMO_SECTIONS,
 *   grounds: string[],
 *   typography: import('./typography.js').TitleTypography,
 *   titleLines: [string, string]
 * }} state
 */
function renderPage(state) {
  const body = findFont(BODY_FONTS, state.bodyId);
  const display = findFont(DISPLAY_FONTS, state.displayId);
  const root = document.querySelector('.font-pairing-demo');
  if (root) {
    applyPairing(root, body, display);
    applyTitleTypography(root, state.typography);
  }

  const pairingLabel = document.getElementById('pairing-label');
  if (pairingLabel) pairingLabel.textContent = `${body.label} × ${display.label}`;

  const note = document.getElementById('pairing-note');
  if (note) {
    const notes = [body.note, display.note].filter(Boolean);
    note.textContent = notes.join(' · ');
    note.hidden = !notes.length;
  }

  const snippet = document.getElementById('config-snippet');
  if (snippet) snippet.textContent = configSnippet(state.displayId, state.typography);

  syncTypographyInputs(state.typography);
  syncTitleLineInputs(state.titleLines);

  const hero = document.getElementById('demo-hero');
  if (hero) {
    hero.innerHTML = `
      <h1 class="poster__title">${renderTitleHtml(state.titleLines)}</h1>
      <p class="doc-meta mono-label">Two plain lines — adjust line height until the rows feel right for this display face.</p>`;
  }

  const posters = document.getElementById('posters');
  if (!posters) return;

  posters.innerHTML = state.sections
    .map((section, index) =>
      renderSection(section, state.grounds[index] ?? 'ground-pink', state.titleLines)
    )
    .join('');

  requestAnimationFrame(() => {
    const cards = Array.from(document.querySelectorAll('#posters .post-card'));
    renderPosterGlyphPatterns(cards, getGalleryConfig());
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        renderPosterGlyphPatterns(cards, getGalleryConfig());
      });
    }
  });

  const params = new URLSearchParams({
    body: state.bodyId,
    display: state.displayId,
    size: String(state.typography.titleSizePx),
    lh: state.typography.lineHeight,
    ls: state.typography.letterSpacing,
    line1: state.titleLines[0],
    line2: state.titleLines[1]
  });
  history.replaceState(null, '', `?${params}`);
}

/** @param {import('./typography.js').TitleTypography} typography */
function syncTypographyInputs(typography) {
  const size = document.getElementById('title-size');
  const lh = document.getElementById('title-line-height');
  const ls = document.getElementById('title-letter-spacing');
  if (size && document.activeElement !== size) size.value = String(typography.titleSizePx);
  if (lh && document.activeElement !== lh) lh.value = typography.lineHeight;
  if (ls && document.activeElement !== ls) ls.value = typography.letterSpacing;
}

/** @param {[string, string]} titleLines */
function syncTitleLineInputs(titleLines) {
  const line1 = document.getElementById('title-line-1');
  const line2 = document.getElementById('title-line-2');
  if (line1 && document.activeElement !== line1) line1.value = titleLines[0];
  if (line2 && document.activeElement !== line2) line2.value = titleLines[1];
}

function readTitleLinesFromInputs() {
  const line1 = document.getElementById('title-line-1')?.value?.trim() || DEFAULT_TITLE_LINES[0];
  const line2 = document.getElementById('title-line-2')?.value?.trim() || DEFAULT_TITLE_LINES[1];
  return [line1, line2];
}

function readStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const displayId = params.get('display') || DISPLAY_FONTS[0].id;
  const typography = {
    ...typographyForDisplayId(displayId),
    ...typographyFromUrl(params)
  };
  const titleLines = [
    params.get('line1') || DEFAULT_TITLE_LINES[0],
    params.get('line2') || DEFAULT_TITLE_LINES[1]
  ];
  return {
    bodyId: params.get('body') || BODY_FONTS[0].id,
    displayId,
    typography,
    titleLines
  };
}

function randomPairingIds() {
  return {
    bodyId: BODY_FONTS[Math.floor(Math.random() * BODY_FONTS.length)].id,
    displayId: DISPLAY_FONTS[Math.floor(Math.random() * DISPLAY_FONTS.length)].id
  };
}

function buildLayoutState(bodyId, displayId, typography, titleLines) {
  const sections = shuffle(DEMO_SECTIONS);
  return {
    bodyId,
    displayId,
    sections,
    grounds: shuffledGrounds(sections.length),
    typography: typography ?? typographyForDisplayId(displayId),
    titleLines: titleLines ?? [...DEFAULT_TITLE_LINES]
  };
}

function populateSelect(id, fonts, selectedId) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = fonts
    .map(
      (font) =>
        `<option value="${escapeHtml(font.id)}"${font.id === selectedId ? ' selected' : ''}>${escapeHtml(font.label)}</option>`
    )
    .join('');
}

function readTypographyFromInputs() {
  const size = Number(document.getElementById('title-size')?.value);
  return {
    titleSizePx: Number.isFinite(size) && size > 0 ? size : DEFAULT_TYPOGRAPHY.titleSizePx,
    lineHeight: document.getElementById('title-line-height')?.value || DEFAULT_TYPOGRAPHY.lineHeight,
    letterSpacing:
      document.getElementById('title-letter-spacing')?.value || DEFAULT_TYPOGRAPHY.letterSpacing
  };
}

function wireControls(initialState) {
  /** @type {import('./typography.js').TitleTypography & { bodyId: string, displayId: string, sections: typeof DEMO_SECTIONS, grounds: string[] }} */
  let state = initialState;

  populateSelect('body-font', BODY_FONTS, state.bodyId);
  populateSelect('display-font', DISPLAY_FONTS, state.displayId);

  const bodySelect = document.getElementById('body-font');
  const displaySelect = document.getElementById('display-font');

  const applyTypography = () => {
    state = { ...state, typography: readTypographyFromInputs() };
    renderPage(state);
  };

  const applyTitleLines = () => {
    state = { ...state, titleLines: readTitleLinesFromInputs() };
    renderPage(state);
  };

  bodySelect?.addEventListener('change', () => {
    state = { ...state, bodyId: bodySelect.value };
    renderPage(state);
  });

  displaySelect?.addEventListener('change', () => {
    state = {
      ...state,
      displayId: displaySelect.value,
      typography: typographyForDisplayId(displaySelect.value)
    };
    renderPage(state);
  });

  for (const id of ['title-size', 'title-line-height', 'title-letter-spacing']) {
    document.getElementById(id)?.addEventListener('input', applyTypography);
  }

  for (const id of ['title-line-1', 'title-line-2']) {
    document.getElementById(id)?.addEventListener('input', applyTitleLines);
  }

  document.getElementById('reset-typography')?.addEventListener('click', () => {
    state = { ...state, typography: typographyForDisplayId(state.displayId) };
    renderPage(state);
  });

  document.getElementById('copy-config')?.addEventListener('click', async () => {
    const text = configSnippet(state.displayId, state.typography);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  });

  document.getElementById('shuffle-layout')?.addEventListener('click', () => {
    state = { ...buildLayoutState(state.bodyId, state.displayId, state.typography, state.titleLines) };
    renderPage(state);
  });

  document.getElementById('random-pairing')?.addEventListener('click', () => {
    const ids = randomPairingIds();
    state = buildLayoutState(ids.bodyId, ids.displayId);
    populateSelect('body-font', BODY_FONTS, state.bodyId);
    populateSelect('display-font', DISPLAY_FONTS, state.displayId);
    renderPage(state);
  });
}

async function init() {
  await reloadGalleryConfig(CONFIG_URL);
  applyGalleryConfigToDocument(getGalleryConfig());

  const fromUrl = readStateFromUrl();
  const state = buildLayoutState(
    fromUrl.bodyId,
    fromUrl.displayId,
    fromUrl.typography,
    fromUrl.titleLines
  );
  wireControls(state);
  renderPage(state);

  const link = document.getElementById('demo-fonts-link');
  if (link && !link.href) {
    const href = buildFontsHref(findFont(BODY_FONTS, state.bodyId), findFont(DISPLAY_FONTS, state.displayId));
    if (href) link.href = href;
  }
}

init().catch((err) => {
  console.error(err);
  const main = document.getElementById('main-reader');
  if (main) {
    main.innerHTML = `<p class="prose">Failed to load demo: ${escapeHtml(String(err))}</p>`;
  }
});
