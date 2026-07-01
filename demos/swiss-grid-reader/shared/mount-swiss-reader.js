/**
 * Bootstrap a reader demo with real markdown, grounds, title faces, and glyphs.
 * Does not touch portfolio.js or production routes.
 */

import { reloadGalleryConfig, getGalleryConfig } from '../../../lib/gallery-config.js';
import { fetchBundledMarkdown } from '../../../lib/bundled-md.js';
import { parseDocument, peekCaseStudyListing } from '../../../lib/parse-document.js';
import { renderDocument, setRenderContentPath } from '../../../lib/render-document.js';
import { fitPosterTitles } from '../../../lib/fit-poster-title.js';
import { renderPosterGlyphPatterns } from '../../../lib/poster-glyph-render.js';
import { collectScrollSections, initScrollLinkedHeader } from './scroll-linked-header.js';

/** Repo root — works for local dev and subpath deploys (import.meta.url, not location). */
const SITE_ROOT = new URL('../../../', import.meta.url).href;

/**
 * @param {{
 *   variant: 'modular' | 'asymmetric' | 'full-bleed',
 *   contentPath?: string,
 *   currentPage?: string
 * }} options
 */
export async function mountSwissReaderDemo({
  variant,
  contentPath = 'content/01-figlets-mcp.md',
  currentPage = ''
} = {}) {
  const body = document.body;
  body.classList.add('page-collection', 'demo-swiss-reader', `demo-swiss-${variant}`);

  const reader = document.getElementById('reader');
  if (reader) {
    reader.hidden = false;
    reader.classList.add('is-active');
  }

  const nav = document.querySelector('.demo-swiss__nav');
  if (nav && currentPage) {
    for (const link of nav.querySelectorAll('a[data-demo-page]')) {
      link.setAttribute('aria-current', link.dataset.demoPage === currentPage ? 'page' : 'false');
    }
  }

  const main = document.getElementById('main-reader');
  if (!main) return;

  main.innerHTML = '<p class="mono-label demo-swiss__loading">Loading case study…</p>';

  const configUrl = new URL('config/gallery.config.json', SITE_ROOT).href;
  await reloadGalleryConfig(configUrl);

  const { text, relativePath } = await fetchBundledMarkdown(contentPath, SITE_ROOT);
  setRenderContentPath(relativePath);
  const filename = relativePath.split('/').pop() || relativePath;
  const doc = parseDocument(text, filename);
  const { subtext: description } = peekCaseStudyListing(text, filename);

  if (!doc.posters.length) {
    main.innerHTML =
      '<p class="mono-label">No poster sections found in this file.</p>';
    return;
  }

  main.innerHTML = renderDocument(doc, filename, {
    contentPath: relativePath,
    description
  });

  const posterEls = [...main.querySelectorAll('#posters > .post-card-wrap .post-card')];

  const paint = () => {
    const cfg = getGalleryConfig();
    fitPosterTitles(posterEls, cfg.titleScale);
    renderPosterGlyphPatterns(posterEls, cfg);
  };

  const startScrollHeader = () => {
    if (variant !== 'full-bleed') return;
    const header = document.querySelector('.site-header--reader');
    const sections = collectScrollSections(main);
    if (header && sections.length) {
      initScrollLinkedHeader({
        header,
        sections,
        heroTitle: doc.title,
        heroLabel: description || 'Case study'
      });
    }
  };

  paint();
  window.addEventListener('resize', paint, { passive: true });
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      paint();
      startScrollHeader();
    });
  } else {
    startScrollHeader();
  }
}
