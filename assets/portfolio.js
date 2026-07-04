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
import { applyImageTableLayouts } from '../lib/image-table-layout.js';
import { setupImageLightbox } from '../lib/image-lightbox.js';
import { collectScrollSections, initScrollLinkedHeader } from '../lib/scroll-linked-header.js';
import { mountCustomCursor } from '../lib/custom-cursor.js';
import { ICONS } from './icons.js';

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const landing = document.getElementById('landing');
  const reader = document.getElementById('reader');
  const landingGalleryGrid = document.getElementById('landing-gallery-grid');
  const mainReader = document.getElementById('main-reader');
  const readerHome = document.getElementById('reader-home');
  const readerSiteBrand = document.getElementById('reader-site-brand');
  const readerSiteTagline = document.getElementById('reader-site-tagline');
  const readerLayout = document.querySelector('.reader-layout');
  const tocToggle = document.getElementById('toc-toggle');
  const tocPanel = document.getElementById('toc-panel');
  const tocRoot = document.getElementById('toc-root');
  const tocRail = document.getElementById('reader-toc-rail');
  const tocRailRoot = document.getElementById('toc-rail-root');
  const backToTop = document.getElementById('back-to-top');

  const TOC_RAIL_MIN_PX = 1200;
  let lastReaderHeaderHeight = 0;
  let scrollAnchorGen = 0;
  /** @type {number[]} */
  let scrollAnchorTimers = [];
  let touchStartY = 0;
  let touchScrollCancelled = false;

  function tocRailFits() {
    if (!readerLayout) return false;
    const style = getComputedStyle(readerLayout);
    const padInline =
      (Number.parseFloat(style.paddingLeft) || 0) +
      (Number.parseFloat(style.paddingRight) || 0);
    return readerLayout.clientWidth - padInline >= TOC_RAIL_MIN_PX;
  }

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
  /** @type {(() => void) | null} */
  let scrollLinkedHeaderTeardown = null;

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach((slot) => {
      const key = slot.getAttribute('data-icon');
      if (ICONS[key]) slot.innerHTML = ICONS[key];
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
  }

  function cancelScrollAnchorAdjustments() {
    scrollAnchorGen += 1;
    for (const id of scrollAnchorTimers) clearTimeout(id);
    scrollAnchorTimers = [];
  }

  /** @param {() => void} fn @param {number} ms @param {number} gen */
  function queueScrollAnchorTimer(fn, ms, gen) {
    const id = window.setTimeout(() => {
      if (gen !== scrollAnchorGen) return;
      fn();
    }, ms);
    scrollAnchorTimers.push(id);
  }

  function scrollTopForTarget(target) {
    syncScrollOffsetVar();
    return target.getBoundingClientRect().top + window.scrollY - readAnchorOffsetPx();
  }

  function resolveScrollTarget(el) {
    if (el.classList.contains('post-card')) {
      return el.querySelector('.post-header') || el;
    }
    return el;
  }

  function scrollToEl(el, { behavior = 'smooth' } = {}) {
    cancelScrollAnchorAdjustments();
    const gen = scrollAnchorGen;
    const target = resolveScrollTarget(el);
    const hashId = el.id;
    const useSmooth = !prefersReducedMotion && behavior === 'smooth';
    const top = Math.max(0, scrollTopForTarget(target));

    const commitHash = () => {
      if (gen !== scrollAnchorGen || !hashId) return;
      history.replaceState(history.state, '', `#${hashId}`);
    };

    window.scrollTo({ top, behavior: useSmooth ? 'smooth' : 'auto' });

    if (!useSmooth) {
      commitHash();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished || gen !== scrollAnchorGen) return;
      finished = true;
      window.removeEventListener('scrollend', onScrollEnd);
      commitHash();
    };
    const onScrollEnd = () => finish();

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', onScrollEnd);
    }
    queueScrollAnchorTimer(finish, 900, gen);
  }

  function renderGlyphs() {
    renderPosterGlyphPatterns(posterEls, getGalleryConfig());
  }

  function schedulePosterTitleFit() {
    cancelAnimationFrame(titleScaleFrame);
    titleScaleFrame = requestAnimationFrame(() => {
      void mainReader.offsetHeight;
      fitPosterTitles(posterEls, getGalleryConfig());
      renderGlyphs();
      updateTocLayout();
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

  function setupCustomCursor() {
    const enabled = getGalleryConfig().theme?.customCursor?.enabled !== false;
    mountCustomCursor({ enabled });
  }

  function landingGlyphEls() {
    return Array.from(document.querySelectorAll('#landing .post-card[data-slug]'));
  }

  function scheduleLandingMiniGlyphs() {
    requestAnimationFrame(() => {
      const cards = landingGlyphEls();
      fitPosterTitles(cards, getGalleryConfig());
      renderPosterGlyphPatterns(cards, getGalleryConfig());
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          const readyCards = landingGlyphEls();
          fitPosterTitles(readyCards, getGalleryConfig());
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
  }

  function showLanding() {
    cancelScrollAnchorAdjustments();
    teardownScrollLinkedHeader();
    landing.classList.remove('is-hidden');
    reader.hidden = true;
    reader.classList.remove('is-active');
    document.body.classList.add('page-landing');
    document.body.classList.remove('page-collection');
    closeTocPanel();
    updateTocLayout();
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

  async function loadHome({ cacheBust = false } = {}) {
    const [index, site, aside] = await Promise.all([
      fetchContentIndex(undefined, undefined, { cacheBust }),
      fetchSiteConfig(undefined, undefined, { cacheBust }),
      fetchHomeAside(undefined, undefined, { cacheBust })
    ]);
    applySiteConfig(site);
    setAssetDimensions(index.assetDimensions);
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
    setupImageLightbox(mainReader, {
      icons: { zoomIn: ICONS.zoomIn, zoomOut: ICONS.zoomOut, xmark: ICONS.xmark }
    });
  }

  function openMarkdown(text, relativePath, { updateHistory = true } = {}) {
    const filename = relativePath.split('/').pop() || relativePath;
    currentRelativePath = relativePath;
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
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        schedulePosterTitleFit();
        renderGlyphs();
        fitReaderMoreCases();
      });
    }
    window.setTimeout(quietReaderLayoutObservers, 500);
    if (updateHistory) {
      history.pushState({ view: 'read', file: relativePath }, '', '#read');
    }
    cancelScrollAnchorAdjustments();
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

  async function boot() {
    await reloadGalleryConfig();
    injectIcons();
    setupCustomCursor();
    try {
      await loadHome();
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
    const pick = e.target.closest('.landing-pick-card[data-md-path]');
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

  mainReader.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    touchScrollCancelled = false;
  }, { passive: true });

  mainReader.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
      touchScrollCancelled = true;
      cancelScrollAnchorAdjustments();
    }
  }, { passive: true });

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
      if (e.pointerType === 'touch' && touchScrollCancelled) return;
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

  window.addEventListener('wheel', () => {
    if (!reader.hidden) cancelScrollAnchorAdjustments();
  }, { passive: true });

  window.addEventListener('scroll', () => {
    backToTop?.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  let resizeTimer;
  let configReloadTimer;

  async function reloadConfigAndRefresh() {
    await reloadGalleryConfig();
    setupCustomCursor();
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
      schedulePosterTitleFit();
      renderGlyphs();
      if (!landing.classList.contains('is-hidden')) scheduleLandingMiniGlyphs();
    }, 120);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocPanel.classList.contains('is-open')) {
      closeTocPanel();
    }
  });
})();
