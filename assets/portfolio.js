import { parseDocument, peekCaseStudyListing } from '../lib/parse-document.js';
import { renderDocument, renderToc, setRenderContentPath } from '../lib/render-document.js';
import { renderLandingGallery } from '../lib/render-landing-gallery.js';
import { renderHomeAside } from '../lib/render-home-aside.js';
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
import { setupImageLightbox } from '../lib/image-lightbox.js';
import { mountEdgeHalftone } from '../lib/edge-halftone.js';
import { ICONS } from './icons.js';

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THEME_KEY = 'md-portfolio-theme';
  const ZOOM_KEY = 'md-portfolio-zoom';

  const landing = document.getElementById('landing');
  const reader = document.getElementById('reader');
  const landingMain = document.getElementById('main');
  const siteBrand = document.getElementById('site-brand');
  const landingSiteTagline = document.getElementById('landing-site-tagline');
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
  const SCROLL_GAP_PX = 8;
  const TOC_RAIL_MIN_PX = 1200;

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
  /** @type {{ path: string, title: string, index: number, subtext?: string, stats?: { value: string, label: string }[], credit?: string }[] | null} */
  let caseStudyItems = null;
  let currentRelativePath = '';
  let openCaseText = '';
  let homeIndexSignature = '';
  let contentWatchTimer = 0;
  /** @type {{ destroy: () => void, refresh: () => void }} */
  let edgeHalftone = { destroy() {}, refresh() {} };

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

  function updateScrollOffset() {
    if (reader.hidden) return;
    const header = document.querySelector('.site-header--reader');
    if (!header) return;
    const height = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--scroll-offset', `${Math.ceil(height) + SCROLL_GAP_PX}px`);
  }

  function resolveScrollTarget(el) {
    if (el.classList.contains('post-card')) {
      return el.querySelector('.post-header') || el;
    }
    return el;
  }

  function scrollToEl(el, { behavior } = {}) {
    const target = resolveScrollTarget(el);
    updateScrollOffset();
    target.scrollIntoView({
      behavior: behavior ?? (prefersReducedMotion ? 'auto' : 'smooth'),
      block: 'start'
    });
    const hashId = el.id;
    if (hashId) history.replaceState(null, '', `#${hashId}`);
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

  function schedulePosterTitleFit() {
    cancelAnimationFrame(titleScaleFrame);
    titleScaleFrame = requestAnimationFrame(() => {
      void mainReader.offsetHeight;
      fitPosterTitles(posterEls, getGalleryConfig().titleScale);
      renderGlyphs();
      updateTocLayout();
      if (location.hash) realignScrollToHash();
    });
  }

  function setupTitleFitObserver() {
    titleFitObserver?.disconnect();
    if (!posterEls.length || typeof ResizeObserver === 'undefined') return;
    let resizeTick = 0;
    titleFitObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeTick);
      resizeTick = requestAnimationFrame(schedulePosterTitleFit);
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
    zoomOut.disabled = readerZoom <= ZOOM_MIN;
    zoomIn.disabled = readerZoom >= ZOOM_MAX;
    updateScrollOffset();
    schedulePosterTitleFit();
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

  function landingMiniPosterEls() {
    return Array.from(document.querySelectorAll('#landing .mini-poster[data-slug]'));
  }

  function scheduleLandingMiniGlyphs() {
    requestAnimationFrame(() => {
      const miniPosters = landingMiniPosterEls();
      fitMiniPosterTitles(miniPosters, getGalleryConfig().titleScale);
      renderPosterGlyphPatterns(miniPosters, getGalleryConfig());
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          const readyMiniPosters = landingMiniPosterEls();
          fitMiniPosterTitles(readyMiniPosters, getGalleryConfig().titleScale);
          renderPosterGlyphPatterns(readyMiniPosters, getGalleryConfig());
        });
      }
    });
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

  function renderHomeGallery(items) {
    caseStudyItems = items;
    landingGalleryGrid.innerHTML = renderLandingGallery(
      items.map(({ path, title, index, subtext, stats, credit }) => ({
        path,
        title,
        index,
        subtext: subtext || path.split('/').pop() || path,
        stats: stats || [],
        credit: credit || ''
      }))
    );
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
    if (site.title) {
      if (siteBrand) siteBrand.textContent = site.title;
      if (readerSiteBrand) readerSiteBrand.textContent = site.title;
      document.title = site.title;
    }
    if (site.tagline) {
      if (landingSiteTagline) landingSiteTagline.textContent = site.tagline;
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
    const html = renderHomeAside(aside);
    landingAside.innerHTML = html;
    landingAside.hidden = !html;
  }

  async function loadHome({ cacheBust = false } = {}) {
    const [index, site, aside] = await Promise.all([
      fetchContentIndex(undefined, undefined, { cacheBust }),
      fetchSiteConfig(undefined, undefined, { cacheBust }),
      fetchHomeAside(undefined, undefined, { cacheBust })
    ]);
    applySiteConfig(site);
    renderLandingAside(aside);
    homeIndexSignature = indexSignature(index);
    if (!index.cases.length) {
      renderEmptyHome();
      return;
    }
    const items = await resolveCaseStudyItems(index, undefined, { cacheBust });
    renderHomeGallery(items);
  }

  function enhanceReaderContent() {
    enhanceCodeBlocks(mainReader, { copyIcon: ICONS.copy });
    injectIcons();
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
    showReader();
    setTocHtml(renderToc(doc.toc));

    posterEls = Array.from(mainReader.querySelectorAll('.post-card'));

    enhanceReaderContent();
    setupTitleFitObserver();
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
      });
    }
    if (updateHistory) {
      history.pushState({ view: 'read', file: relativePath }, '', '#read');
    }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
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
    applyTheme(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
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

  const readerHeader = document.querySelector('.site-header--reader');
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

  zoomOut.addEventListener('click', () => {
    readerZoom = clampZoom(readerZoom - ZOOM_STEP);
    applyZoom();
  });

  zoomIn.addEventListener('click', () => {
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
      enhancePosterImageHalftone(mainReader, getGalleryConfig());
      if (!landing.classList.contains('is-hidden')) scheduleLandingMiniGlyphs();
      if (location.hash) realignScrollToHash();
    }, 120);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tocPanel.classList.contains('is-open')) {
      closeTocPanel();
    }
  });
})();
