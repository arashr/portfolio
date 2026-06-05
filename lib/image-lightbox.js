/** @typedef {{ zoomIn?: string, zoomOut?: string, xmark?: string }} LightboxIcons */

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

/** @type {AbortController | null} */
let activeController = null;

/** @type {HTMLDialogElement | null} */
let dialogEl = null;

/** @type {HTMLImageElement | null} */
let lightboxImg = null;

/** @type {HTMLElement | null} */
let stageEl = null;

/** @type {HTMLElement | null} */
let captionEl = null;

/** @type {HTMLButtonElement | null} */
let zoomOutBtn = null;

/** @type {HTMLButtonElement | null} */
let zoomInBtn = null;

let scale = 1;
let fitWidth = 0;
let fitHeight = 0;

/**
 * @param {LightboxIcons} icons
 */
function ensureDialog(icons) {
  if (dialogEl) return dialogEl;

  const el = document.createElement('dialog');
  el.className = 'image-lightbox';
  el.id = 'image-lightbox';
  el.setAttribute('aria-label', 'Image preview');
  el.innerHTML = `
    <div class="image-lightbox__shell">
      <header class="image-lightbox__chrome">
        <p class="image-lightbox__caption mono-label"></p>
        <div class="image-lightbox__tools" role="group" aria-label="Image zoom">
          <button type="button" class="btn-icon btn-ghost image-lightbox__zoom-out" aria-label="Zoom out">
            <span data-icon-slot="zoomOut" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn-icon btn-ghost image-lightbox__zoom-in" aria-label="Zoom in">
            <span data-icon-slot="zoomIn" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn-icon btn-ghost image-lightbox__close" aria-label="Close preview">
            <span data-icon-slot="xmark" aria-hidden="true"></span>
          </button>
        </div>
      </header>
      <div class="image-lightbox__stage" tabindex="-1">
        <div class="image-lightbox__scroll">
          <img class="image-lightbox__img" alt="" decoding="async">
        </div>
      </div>
    </div>`;

  document.body.appendChild(el);

  for (const [key, slot] of [
    ['zoomOut', 'zoomOut'],
    ['zoomIn', 'zoomIn'],
    ['xmark', 'xmark']
  ]) {
    const node = el.querySelector(`[data-icon-slot="${slot}"]`);
    if (node && icons[key]) node.innerHTML = icons[key];
  }

  dialogEl = el;
  lightboxImg = el.querySelector('.image-lightbox__img');
  stageEl = el.querySelector('.image-lightbox__stage');
  captionEl = el.querySelector('.image-lightbox__caption');
  zoomOutBtn = el.querySelector('.image-lightbox__zoom-out');
  zoomInBtn = el.querySelector('.image-lightbox__zoom-in');

  el.querySelector('.image-lightbox__close')?.addEventListener('click', () => closeLightbox());
  zoomOutBtn?.addEventListener('click', () => setZoom(scale - ZOOM_STEP));
  zoomInBtn?.addEventListener('click', () => setZoom(scale + ZOOM_STEP));

  el.addEventListener('click', (e) => {
    if (e.target === el) closeLightbox();
  });

  el.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeLightbox();
  });

  return el;
}

function syncZoomButtons() {
  if (zoomOutBtn) zoomOutBtn.disabled = scale <= ZOOM_MIN;
  if (zoomInBtn) zoomInBtn.disabled = scale >= ZOOM_MAX;
}

function computeFitSize() {
  if (!lightboxImg || !stageEl) return;
  const nw = lightboxImg.naturalWidth;
  const nh = lightboxImg.naturalHeight;
  if (!nw || !nh) return;

  const styles = getComputedStyle(stageEl);
  const padX =
    parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const padY =
    parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const maxW = Math.max(stageEl.clientWidth - padX, 1);
  const maxH = Math.max(stageEl.clientHeight - padY, 1);
  const ratio = Math.min(maxW / nw, maxH / nh, 1);

  fitWidth = nw * ratio;
  fitHeight = nh * ratio;
}

function applyZoomLayout() {
  if (!lightboxImg || !fitWidth) return;
  lightboxImg.style.width = `${fitWidth * scale}px`;
  lightboxImg.style.height = `${fitHeight * scale}px`;
  lightboxImg.style.maxWidth = 'none';
  lightboxImg.style.maxHeight = 'none';
}

function setZoom(next) {
  scale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 100) / 100));
  applyZoomLayout();
  syncZoomButtons();
}

/** @param {HTMLImageElement} img */
function whenImageReady(img) {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

/**
 * @param {Element | null} target
 */
function resolveProseImage(target) {
  if (!(target instanceof Element) || !target.closest('.prose')) return null;
  if (target instanceof HTMLImageElement) return target;
  const wrap = target.closest('.halftone');
  if (wrap) {
    const img = wrap.querySelector('img');
    if (img instanceof HTMLImageElement) return img;
  }
  return null;
}

/**
 * @param {HTMLImageElement} source
 */
async function openLightbox(source) {
  if (!dialogEl || !lightboxImg || !captionEl) return;

  const src = source.currentSrc || source.getAttribute('src') || '';
  if (!src) return;

  const alt = source.getAttribute('alt')?.trim() || '';
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  captionEl.textContent = alt || 'Image';
  captionEl.hidden = !alt;

  if (!dialogEl.open) {
    dialogEl.showModal();
  }

  await whenImageReady(lightboxImg);
  computeFitSize();
  setZoom(1);
  stageEl?.scrollTo(0, 0);
}

export function closeLightbox() {
  if (dialogEl?.open) dialogEl.close();
  if (lightboxImg) {
    lightboxImg.removeAttribute('src');
    lightboxImg.alt = '';
  }
}

export function teardownImageLightbox() {
  activeController?.abort();
  activeController = null;
  closeLightbox();
}

/**
 * @param {ParentNode} root
 * @param {{ icons?: LightboxIcons }} [opts]
 */
export function setupImageLightbox(root, opts = {}) {
  teardownImageLightbox();
  const dialog = ensureDialog(opts.icons || {});
  const ac = new AbortController();
  activeController = ac;

  const onClick = (e) => {
    const img = resolveProseImage(e.target);
    if (!img) return;
    e.preventDefault();
    openLightbox(img);
  };

  const onKeydown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const img = resolveProseImage(e.target);
    if (!img) return;
    e.preventDefault();
    openLightbox(img);
  };

  root.addEventListener('click', onClick, { signal: ac.signal });
  root.addEventListener('keydown', onKeydown, { signal: ac.signal });

  root.querySelectorAll('.prose img').forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.getAttribute('src') && !img.currentSrc) return;
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    img.classList.add('prose-img--zoomable');
    const label = img.alt?.trim();
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute(
      'aria-label',
      label ? `View larger: ${label}` : 'View larger image'
    );
  });

  root.querySelectorAll('.prose .halftone').forEach((wrap) => {
    wrap.classList.add('prose-img--zoomable-wrap');
    if (!wrap.hasAttribute('tabindex')) {
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'button');
      const img = wrap.querySelector('img');
      const label = img?.getAttribute('alt')?.trim();
      wrap.setAttribute(
        'aria-label',
        label ? `View larger: ${label}` : 'View larger image'
      );
    }
  });
}
