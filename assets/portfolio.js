import { parseDocument, peekCaseStudyListing } from '../lib/parse-document.js';
import { renderDocument, renderToc, setAssetDimensions, setRenderContentPath } from '../lib/render-document.js';
import { renderLandingMosaic } from '../lib/render-landing-mosaic.js';
import { renderReaderMoreCases } from '../lib/render-reader-more-cases.js';
import { posterStaggerCol } from '../lib/stagger.js';
import { reloadGalleryConfig, getGalleryConfig } from '../lib/gallery-config.js';
import { fitMiniPosterTitles, fitPosterTitles } from '../lib/fit-poster-title.js';
import {
  isExternalHref,
  isLocalMarkdownHref,
  resolveRelativeMarkdownPath
} from '../lib/local-md-links.js';
import { fetchBundledMarkdown } from '../lib/bundled-md.js';
import {
  fetchContentIndex,
  fetchHomeAside,
  fetchSiteConfig,
  resolveCaseStudyItems
} from '../lib/portfolio-content.js';
import { copyCodeFromButton, enhanceCodeBlocks } from '../lib/code-blocks.js';
import { renderPosterGlyphPatterns } from '../lib/poster-glyph-render.js';
import { enhancePosterImageHalftone } from '../lib/image-halftone.js';
import { applyImageTableLayouts } from '../lib/image-table-layout.js';
import { setupImageLightbox } from '../lib/image-lightbox.js';
import { mountEdgeHalftone } from '../lib/edge-halftone.js';
import { collectScrollSections, initScrollLinkedHeader } from '../lib/scroll-linked-header.js';
import { ICONS } from './icons.js';

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THEME_KEY = 'md-portfolio-theme';
  const ZOOM_KEY = 'md-portfolio-zoom';

  const landing = document.getElementById('landing');
  const reader = document.getElementById('reader');
  const landingMain = document.getElementById('main');
  const landingGalleryGrid = document.getElementById('landing-gallery-grid');
  const landingAside = document.getElementById('landing-aside');
  const mainReader = document.getElementById('main-reader');
  const readerHome = document.getElementById('reader-home');
  const readerSiteBrand = document.getElementById('reader-site-brand');
  const readerSiteTagline = document.getElementById('reader-site-tagline');
  const readerLayout = document.querySelector('.reader-layout');
  const zoomOut = document.getElementById('zoom-out');
  const zoomIn = document.getElementById('zoom-in');
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const tocToggle = document.getElementById('toc-toggle');
  const tocPanel = document.getElementById('toc-panel');
  const tocRoot = document.getElementById('toc-root');
  const tocRail = document.getElementById('reader-toc-rail');
  const tocRailRoot = document.getElementById('toc-rail-root');
  const backToTop = document.getElementById('back-to-top');

  const ZOOM_MIN = 0.85;
  const ZOOM_MAX = 1.5;
  const ZOOM_STEP = 0.1;
  const TOC_RAIL_MIN_PX = 1200;
  let lastReaderHeaderHeight = 0;

  function tocRailFits() {
    if (!readerLayout) return false;
    const style = getComputedStyle(readerLayout);
    const padInline =
      (Number.parseFloat(style.paddingLeft) || 0) +
      (Number.parseFloat(style.paddingRight) || 0);
    return readerLayout.clientWidth - padInline >= TOC_RAIL_MIN_PX;
  }

  let readerZoom = clampZoom(parseFloat(localStorage.getItem(ZOOM_KEY) || '1', 10));
  let posterEls = [];
  let titleScaleFrame = 0;
  let titleFitObserver = null;
  let titleFitDebounce = 0;
  let moreCasesResizeObserver = null;
  /** @type {{ title?: string, tagline?: string }} */
  let siteConfig = {};
  /** @type {{ path: string, title: string, index: number, subtext?: string, stats?: { value: string, label: string }[], credit?: string }[] | null} */
  let caseStudyItems = null;
  let currentRelativePath = '';
  let openCaseText = '';
  let homeIndexSignature = '';
  let contentWatchTimer = 0;
  /** @type {{ destroy: () => void, refresh: () => void }} */
  let edgeHalftone = { destroy() {}, refresh() {} };
  /** @type {(() => void) | null} */
  let scrollLinkedHeaderTeardown = null;

  const CONTENT_POLL_MS = 3000;
  const isLocalDev =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach((slot) => {
      const key = slot.getAttribute('data-icon');
      if (ICONS[key]) slot.innerHTML = ICONS[key];
    });
    document.querySelectorAll('.theme-toggle__icons').forEach((wrap) => {
      wrap.innerHTML = ICONS.moon + ICONS.sun;
    });
  }

  function closeTocPanel() {
    tocPanel.classList.remove('is-open');
    tocToggle.setAttribute('aria-expanded', 'false');
  }

  function updateTocRailOffset() {
    if (!tocRail || reader.hidden) return;
    const hero = mainReader.querySelector('.collection-hero');
    const gallery = mainReader.querySelector('.poster-gallery');
    if (!hero) {
      tocRail.style.setProperty('--toc-rail-offset', '0px');
      return;
    }
    const galleryPadTop = gallery
      ? Number.parseFloat(getComputedStyle(gallery).paddingTop) || 0
      : 0;
    const offset = hero.offsetHeight + galleryPadTop;
    tocRail.style.setProperty('--toc-rail-offset', `${Math.max(0, Math.round(offset))}px`);
  }

  function updateTocLayout() {
    if (reader.hidden) {
      reader.classList.remove('has-toc');
      reader.classList.remove('has-toc-rail');
      tocRail?.setAttribute('aria-hidden', 'true');
      return;
    }

    const hasToc = Boolean(tocRoot.querySelector('.toc-list'));
    reader.classList.toggle('has-toc', hasToc);
    const useRail = hasToc && tocRailFits();
    reader.classList.toggle('has-toc-rail', useRail);
    tocRail?.setAttribute('aria-hidden', useRail ? 'false' : 'true');
    if (useRail) {
      updateTocRailOffset();
      closeTocPanel();
    }
  }

  function setTocHtml(html) {
    tocRoot.innerHTML = html;
    if (tocRailRoot) tocRailRoot.innerHTML = html;
    updateTocLayout();
  }

  function handleTocLinkClick(e) {
    const a = e.target.closest('[data-toc-link]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href')?.slice(1);
    const el = id && document.getElementById(id);
    if (el) scrollToEl(el);
    closeTocPanel();
  }

  function readCssLengthPx(token, fallback = 0) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (!raw) return fallback;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return fallback;
    if (raw.endsWith('rem')) {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return n * (Number.isFinite(root) ? root : 16);
    }
    return n;
  }

  function readerHeaderEl() {
    return document.querySelector('#reader .site-header--reader');
  }

  function setupScrollLinkedHeader() {
    scrollLinkedHeaderTeardown?.();
    scrollLinkedHeaderTeardown = null;
    const header = readerHeaderEl();
    if (!header || reader.hidden) return;
    const sections = collectScrollSections(mainReader);
    scrollLinkedHeaderTeardown = initScrollLinkedHeader({ header, sections, root: mainReader });
  }

  function teardownScrollLinkedHeader() {
    scrollLinkedHeaderTeardown?.();
    scrollLinkedHeaderTeardown = null;
  }

  function readAnchorOffsetPx() {
    const header = readerHeaderEl();
    const headerBottom = header ? Math.ceil(header.getBoundingClientRect().bottom) : 0;
    const gap = readCssLengthPx('--space-scroll-anchor-gap', 6);
    const adjust = readCssLengthPx('--space-scroll-anchor-adjust', 0);
    return headerBottom + gap + adjust;
  }

  function syncScrollOffsetVar() {
    const header = readerHeaderEl();
    if (header) lastReaderHeaderHeight = header.getBoundingClientRect().height;
    const offset = readAnchorOffsetPx();
    document.documentElement.style.setProperty('--scroll-offset', `${offset}px`);
    return offset;
  }

  function updateScrollOffset() {
    if (reader.hidden) return;
    const header = readerHeaderEl();
    if (!header) return;
    const height = header.getBoundingClientRect().height;
    if (Math.abs(height - lastReaderHeaderHeight) < 1) return;
    syncScrollOffsetVar();
    if (location.hash) realignScrollToHash();
  }

  function resolveScrollTarget(el) {
    if (el.classList.contains('post-card')) {
      return el.querySelector('.post-header') || el;
    }
    return el;
  }

  function scrollToEl(el, { behavior = 'auto' } = {}) {
    const target = resolveScrollTarget(el);
    const root = document.documentElement;

    function fineTune() {
      syncScrollOffsetVar();
      const err = target.getBoundingClientRect().top - readAnchorOffsetPx();
      if (Math.abs(err) > 1.5) window.scrollBy({ top: err, behavior: 'auto' });
    }

    root.style.overflowAnchor = 'none';
    syncScrollOffsetVar();
    target.scrollIntoView({ behavior, block: 'start' });
    fineTune();
    requestAnimationFrame(() => requestAnimationFrame(fineTune));
    for (const ms of [300, 700, 1200]) {
      window.setTimeout(() => {
        fineTune();
        if (ms === 1200) root.style.overflowAnchor = '';
      }, ms);
    }

    const hashId = el.id;
    if (hashId) history.replaceState(history.state, '', `#${hashId}`);
  }

  function realignScrollToHash() {
    const id = location.hash.slice(1);
    if (!id || reader.hidden) return;
    const el = document.getElementById(id);
    if (!el) return;
    scrollToEl(el, { behavior: 'auto' });
  }

  function renderGlyphs() {
    renderPosterGlyphPatterns(posterEls, getGalleryConfig());
  }

  function schedulePosterTitleFit({ realignHash = false } = {}) {
    cancelAnimationFrame(titleScaleFrame);
    titleScaleFrame = requestAnimationFrame(() => {
      void mainReader.offsetHeight;
      fitPosterTitles(posterEls, getGalleryConfig());
      renderGlyphs();
      updateTocLayout();
      if (realignHash && location.hash) realignScrollToHash();
    });
  }

  function setupTitleFitObserver() {
    titleFitObserver?.disconnect();
    clearTimeout(titleFitDebounce);
    if (!posterEls.length || typeof ResizeObserver === 'undefined') return;
    let resizeTick = 0;
    titleFitObserver = new ResizeObserver(() => {
      clearTimeout(titleFitDebounce);
      titleFitDebounce = window.setTimeout(() => {
        cancelAnimationFrame(resizeTick);
        resizeTick = requestAnimationFrame(schedulePosterTitleFit);
      }, 150);
    });
    posterEls.forEach((card) => titleFitObserver.observe(card));
  }

  function clampZoom(value) {
    if (Number.isNaN(value)) return 1;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
  }

  function applyZoom() {
    readerZoom = clampZoom(readerZoom);
    document.documentElement.style.setProperty('--reader-zoom', String(readerZoom));
    localStorage.setItem(ZOOM_KEY, String(readerZoom));
    if (zoomOut) zoomOut.disabled = readerZoom <= ZOOM_MIN;
    if (zoomIn) zoomIn.disabled = readerZoom >= ZOOM_MAX;
    updateScrollOffset();
    schedulePosterTitleFit({ realignHash: true });
    updateTocLayout();
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    themeToggles.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Light mode' : 'Dark mode');
    });
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    edgeHalftone.refresh();
  }

  function setupEdgeHalftone() {
    edgeHalftone.destroy();
    edgeHalftone = mountEdgeHalftone(getGalleryConfig());
  }

  function landingGlyphEls() {
    return Array.from(document.querySelectorAll('#landing .post-card[data-slug]'));
  }

  function scheduleLandingMiniGlyphs() {
    requestAnimationFrame(() => {
      const cards = landingGlyphEls();
      fitMiniPosterTitles(cards, getGalleryConfig());
      renderPosterGlyphPatterns(cards, getGalleryConfig());
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          const readyCards = landingGlyphEls();
          fitMiniPosterTitles(readyCards, getGalleryConfig());
          renderPosterGlyphPatterns(readyCards, getGalleryConfig());
        });
      }
    });
  }

  function readerMoreMiniPosterEls() {
    return Array.from(mainReader.querySelectorAll('.reader-more-cases .mini-poster[data-md-path]'));
  }

  function fitReaderMoreCases() {
    const miniPosters = readerMoreMiniPosterEls();
    if (!miniPosters.length) return;
    fitMiniPosterTitles(miniPosters, getGalleryConfig());
    renderPosterGlyphPatterns(miniPosters, getGalleryConfig());
  }

  function quietReaderLayoutObservers() {
    titleFitObserver?.disconnect();
    titleFitObserver = null;
    clearTimeout(titleFitDebounce);
    moreCasesResizeObserver?.disconnect();
    moreCasesResizeObserver = null;
  }

  function setupReaderMoreCasesObserver() {
    moreCasesResizeObserver?.disconnect();
    const grid = mainReader.querySelector('.reader-more-cases__grid');
    if (!grid || typeof ResizeObserver === 'undefined') return;
    let tick = 0;
    let passes = 0;
    moreCasesResizeObserver = new ResizeObserver(() => {
      if (passes >= 3) return;
      cancelAnimationFrame(tick);
      tick = requestAnimationFrame(() => {
        passes += 1;
        fitReaderMoreCases();
        if (passes >= 3) moreCasesResizeObserver?.disconnect();
      });
    });
    moreCasesResizeObserver.observe(grid);
  }

  function scheduleReaderMoreCasesEnhance() {
    if (!readerMoreMiniPosterEls().length) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitReaderMoreCases();
        setupReaderMoreCasesObserver();
      });
    });
    if (document.fonts?.ready) {
      document.fonts.ready.then(fitReaderMoreCases);
    }
  }

  function lastPosterColStart(doc) {
    let previousStaggerCol = null;
    for (const poster of doc.posters) {
      previousStaggerCol = posterStaggerCol(poster.slug, poster.index, previousStaggerCol);
    }
    return previousStaggerCol ?? 1;
  }

  function pickMoreCaseStudies(relativePath, limit = 2) {
    if (!caseStudyItems?.length) return [];
    const currentIdx = caseStudyItems.findIndex((item) => item.path === relativePath);
    if (currentIdx < 0) {
      return caseStudyItems.filter((item) => item.path !== relativePath).slice(0, limit);
    }
    const picks = [];
    for (let step = 1; picks.length < limit && step < caseStudyItems.length; step++) {
      const item = caseStudyItems[(currentIdx + step) % caseStudyItems.length];
      if (item.path !== relativePath) picks.push(item);
    }
    return picks;
  }

  function appendReaderMoreCases(relativePath, doc) {
    const picks = pickMoreCaseStudies(relativePath, 2);
    if (!picks.length) return;
    const postersEl = mainReader.querySelector('#posters');
    if (!postersEl) return;
    postersEl.insertAdjacentHTML(
      'beforeend',
      renderReaderMoreCases(picks, { colStart: lastPosterColStart(doc) })
    );
  }

  function showReader() {
    landing.classList.add('is-hidden');
    reader.hidden = false;
    reader.classList.add('is-active');
    document.body.classList.remove('page-landing');
    document.body.classList.add('page-collection');
    edgeHalftone.refresh();
  }

  function showLanding() {
    teardownScrollLinkedHeader();
    landing.classList.remove('is-hidden');
    reader.hidden = true;
    reader.classList.remove('is-active');
    document.body.classList.add('page-landing');
    document.body.classList.remove('page-collection');
    closeTocPanel();
    updateTocLayout();
    edgeHalftone.refresh();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function renderHomeGallery(items, aside) {
    caseStudyItems = items;
    landingGalleryGrid.innerHTML = renderLandingMosaic({
      site: siteConfig,
      items: items.map(({ path, title, index, subtext, stats, credit }) => ({
        path,
        title,
        index,
        subtext: subtext || path.split('/').pop() || path,
        stats: stats || [],
        credit: credit || ''
      })),
      aside
    });
    scheduleLandingMiniGlyphs();
  }

  function indexSignature(index) {
    if (index.revision) return index.revision;
    return index.cases.join('\n');
  }

  function goHome() {
    showLanding();
    history.pushState({ view: 'home' }, '', '#');
  }

  function applySiteConfig(site) {
    siteConfig = site || {};
    if (site.title) {
      if (readerSiteBrand) readerSiteBrand.textContent = site.title;
      document.title = site.title;
    }
    if (site.tagline) {
      if (readerSiteTagline) readerSiteTagline.textContent = site.tagline;
    }
  }

  function renderEmptyHome() {
    caseStudyItems = [];
    landingGalleryGrid.innerHTML =
      '<p class="landing-error mono-label">Add a <code>.md</code> file under <code>content/</code> (not dot-prefixed).</p>';
  }

  function renderLandingAside(aside) {
    if (!landingAside) return;
    landingAside.innerHTML = '';
    landingAside.hidden = true;
  }

  async function loadHome({ cacheBust = false } = {}) {
    const [index, site, aside] = await Promise.all([
      fetchContentIndex(undefined, undefined, { cacheBust }),
      fetchSiteConfig(undefined, undefined, { cacheBust }),
      fetchHomeAside(undefined, undefined, { cacheBust })
    ]);
    applySiteConfig(site);
    setAssetDimensions(index.assetDimensions);
    renderLandingAside(aside);
    homeIndexSignature = indexSignature(index);
    if (!index.cases.length) {
      renderEmptyHome();
      return;
    }
    const items = await resolveCaseStudyItems(index, undefined, { cacheBust });
    renderHomeGallery(items, aside);
  }

  function enhanceReaderContent() {
    enhanceCodeBlocks(mainReader, { copyIcon: ICONS.copy });
    injectIcons();
    applyImageTableLayouts(mainReader);
    enhancePosterImageHalftone(mainReader, getGalleryConfig());
    setupImageLightbox(mainReader, {
      icons: { zoomIn: ICONS.zoomIn, zoomOut: ICONS.zoomOut, xmark: ICONS.xmark }
    });
  }

  function openMarkdown(text, relativePath, { updateHistory = true } = {}) {
    const filename = relativePath.split('/').pop() || relativePath;
    currentRelativePath = relativePath;
    openCaseText = text;
    setRenderContentPath(relativePath);
    const doc = parseDocument(text, filename);
    const { subtext: description } = peekCaseStudyListing(text, filename);
    mainReader.innerHTML = renderDocument(doc, filename, {
      contentPath: relativePath,
      description
    });
    appendReaderMoreCases(relativePath, doc);
    showReader();
    setTocHtml(renderToc(doc.toc));

    posterEls = Array.from(
      mainReader.querySelectorAll('#posters > .post-card-wrap:not(.reader-more-cases-wrap) .post-card')
    );

    enhanceReaderContent();
    scheduleReaderMoreCasesEnhance();
    quietReaderLayoutObservers();
    setupTitleFitObserver();
    lastReaderHeaderHeight = 0;
    updateScrollOffset();
    schedulePosterTitleFit();
    requestAnimationFrame(() => {
      updateTocLayout();
      requestAnimationFrame(updateTocLayout);
    });
    requestAnimationFrame(renderGlyphs);
    requestAnimationFrame(() => enhancePosterImageHalftone(mainReader, getGalleryConfig()));
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        schedulePosterTitleFit();
        renderGlyphs();
        enhancePosterImageHalftone(mainReader, getGalleryConfig());
        fitReaderMoreCases();
      });
    }
    window.setTimeout(quietReaderLayoutObservers, 500);
    if (updateHistory) {
      history.pushState({ view: 'read', file: relativePath }, '', '#read');
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    setupScrollLinkedHeader();
  }

  async function openCaseStudy(relativePath, { updateHistory = true } = {}) {
    const { text, relativePath: path } = await fetchBundledMarkdown(relativePath);
    openMarkdown(text, path, { updateHistory });
  }

  async function followLocalMarkdownLink(href) {
    const targetPath = resolveRelativeMarkdownPath(currentRelativePath, href);
    if (!targetPath) return;
    try {
      await openCaseStudy(targetPath);
    } catch (err) {
      console.error(err);
      alert(`Could not open "${targetPath}".`);
    }
  }

  async function refreshContentIfChanged() {
    if (!isLocalDev) return;

    if (!reader.hidden && currentRelativePath) {
      const { text } = await fetchBundledMarkdown(currentRelativePath, location.href, {
        cacheBust: true
      });
      if (text !== openCaseText) {
        openMarkdown(text, currentRelativePath, { updateHistory: false });
      }
      return;
    }

    if (reader.hidden) {
      const index = await fetchContentIndex(undefined, undefined, { cacheBust: true });
      const sig = indexSignature(index);
      if (sig === homeIndexSignature) return;
      await loadHome({ cacheBust: true });
    }
  }

  function startContentWatch() {
    if (!isLocalDev) return;
    if (contentWatchTimer) return;
    contentWatchTimer = window.setInterval(() => {
      if (document.hidden) return;
      void refreshContentIfChanged().catch(() => {});
    }, CONTENT_POLL_MS);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void refreshContentIfChanged().catch(() => {});
    });
  }

  async function boot() {
    await reloadGalleryConfig();
    injectIcons();
    applyZoom();
    setupEdgeHalftone();
    applyTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark');
    try {
      await loadHome();
      startContentWatch();
    } catch (err) {
      console.error(err);
      landingGalleryGrid.innerHTML =
        '<p class="landing-error mono-label">Add <code>.md</code> case studies under <code>content/</code> and use <code>npm start</code>.</p>';
    }
  }

  boot();
  history.replaceState({ view: 'home' }, '', '#');

  const readerHeader = document.querySelector('#reader .site-header--reader');
  if (readerHeader && typeof ResizeObserver !== 'undefined') {
    const headerResize = new ResizeObserver(() => updateScrollOffset());
    headerResize.observe(readerHeader);
  }

  if (readerLayout && typeof ResizeObserver !== 'undefined') {
    const readerLayoutResize = new ResizeObserver(() => updateTocLayout());
    readerLayoutResize.observe(readerLayout);
  }

  if (mainReader && typeof ResizeObserver !== 'undefined') {
    const readerContentResize = new ResizeObserver(() => updateTocLayout());
    readerContentResize.observe(mainReader);
  }

  landingGalleryGrid?.addEventListener('click', (e) => {
    const pick = e.target.closest('.mini-poster[data-md-path]');
    if (!pick) return;
    const path = pick.getAttribute('data-md-path');
    if (!path) return;
    void openCaseStudy(path).catch((err) => {
      console.error(err);
      alert('Could not open this case study.');
    });
  });

  window.addEventListener('popstate', (e) => {
    const state = e.state || {};
    const view = state.view || (location.hash === '#read' ? 'read' : 'home');
    if (view === 'read' && state.file) {
      void openCaseStudy(state.file, { updateHistory: false }).catch(() => showLanding());
      return;
    }
    showLanding();
  });

  mainReader.addEventListener('click', (e) => {
    const morePick = e.target.closest('.reader-more-cases .mini-poster[data-md-path]');
    if (morePick) {
      const path = morePick.getAttribute('data-md-path');
      if (path) {
        void openCaseStudy(path).catch((err) => {
          console.error(err);
          alert('Could not open this case study.');
        });
      }
      return;
    }

    const copyBtn = e.target.closest('.code-block__copy');
    if (copyBtn) {
      e.preventDefault();
      void copyCodeFromButton(copyBtn).then((ok) => {
        if (!ok) return;
        copyBtn.classList.add('is-copied');
        copyBtn.setAttribute('aria-label', 'Copied');
        window.setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          copyBtn.setAttribute('aria-label', 'Copy code');
        }, 2000);
      });
      return;
    }

    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#')) {
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      scrollToEl(el);
      closeTocPanel();
      return;
    }

    if (isLocalMarkdownHref(href)) {
      e.preventDefault();
      void followLocalMarkdownLink(href);
      return;
    }

    if (isExternalHref(href)) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  });

  tocRoot.addEventListener('click', handleTocLinkClick);
  tocRailRoot?.addEventListener('click', handleTocLinkClick);

  readerHome?.addEventListener('click', () => goHome());

  zoomOut?.addEventListener('click', () => {
    readerZoom = clampZoom(readerZoom - ZOOM_STEP);
    applyZoom();
  });

  zoomIn?.addEventListener('click', () => {
    readerZoom = clampZoom(readerZoom + ZOOM_STEP);
    applyZoom();
  });

  themeToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
      applyTheme(dark ? 'dark' : 'light');
    });
  });

  tocToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !tocPanel.classList.contains('is-open');
    tocPanel.classList.toggle('is-open', open);
    tocToggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    const wrap = tocToggle.closest('.nav-toc-wrap');
    if (tocPanel.contains(e.target) || wrap?.contains(e.target)) return;
    closeTocPanel();
  });

  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  let resizeTimer;
  let configReloadTimer;

  async function reloadConfigAndRefresh() {
    await reloadGalleryConfig();
    setupEdgeHalftone();
    enhancePosterImageHalftone(mainReader, getGalleryConfig());
    schedulePosterTitleFit();
    if (!landing.classList.contains('is-hidden')) scheduleLandingMiniGlyphs();
    else scheduleReaderMoreCasesEnhance();
  }

  function scheduleConfigReload() {
    clearTimeout(configReloadTimer);
    configReloadTimer = setTimeout(() => void reloadConfigAndRefresh(), 250);
  }

  window.addEventListener('focus', scheduleConfigReload);
  window.addEventListener('pageshow', scheduleConfigReload);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    scheduleConfigReload();
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateScrollOffset();
      updateTocLayout();
      schedulePosterTitleFit({ realignHash: true });
      renderGlyphs();
      enhancePosterImageHalftone(mainReader, getGalleryConfig());
      if (!landing.classList.contains('is-hidden')) scheduleLandingMiniGlyphs();
    }, 120);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocPanel.classList.contains('is-open')) {
      closeTocPanel();
    }
  });
})();
