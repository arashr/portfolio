/**
 * Scroll-linked reader chrome — matches active section ground colors (not fonts).
 */

const GROUND_RE = /^ground-/;

/** @param {Element} el @param {RegExp} re */
function classToken(el, re) {
  return [...el.classList].find((c) => re.test(c)) ?? null;
}

/**
 * @param {HTMLElement} section
 * @returns {string | null}
 */
function groundFromSection(section) {
  const wrap = section.classList.contains('post-card-wrap')
    ? section
    : section.querySelector('.post-card-wrap') ?? section;
  const card = section.querySelector('.post-card') ?? (section.classList.contains('post-card') ? section : null);
  return classToken(wrap, GROUND_RE) ?? (card ? classToken(card, GROUND_RE) : null);
}

/** @param {HTMLElement} el */
function stripGroundFromElement(el) {
  for (const cls of [...el.classList]) {
    if (GROUND_RE.test(cls) || cls === 'reader-header--paper') {
      el.classList.remove(cls);
    }
  }
  el.style.backgroundColor = '';
  for (const name of [...el.style]) {
    if (name.startsWith('--on-ground') || name === '--surface') {
      el.style.removeProperty(name);
    }
  }
}

/**
 * @param {HTMLElement} el
 * @param {string | null} ground
 * @param {HTMLElement | null} card
 */
function applyGroundToElement(el, ground, card) {
  stripGroundFromElement(el);
  if (!ground) {
    el.classList.add('reader-header--paper');
    return;
  }

  el.classList.add(ground);
  if (!(card instanceof HTMLElement)) return;

  const cs = getComputedStyle(card);
  el.style.backgroundColor = cs.backgroundColor;
  for (const name of cs) {
    if (!name.startsWith('--on-ground') && name !== '--surface') continue;
    if (name.startsWith('--on-ground-link-hover')) continue;
    const val = cs.getPropertyValue(name).trim();
    if (!val) continue;
    el.style.setProperty(name, val);
  }
}

/** @param {HTMLElement[]} targets @param {string | null} ground @param {HTMLElement | null} card */
function applyGroundToTargets(targets, ground, card) {
  for (const el of targets) {
    applyGroundToElement(el, ground, card);
  }
}

/** @param {HTMLElement | null | undefined} header @param {HTMLElement | null | undefined} root */
function collectGroundTargets(header, root) {
  return [
    header,
    header?.querySelector('.toc-panel'),
    root?.querySelector('.reader-toc-rail__inner')
  ].filter((el) => el instanceof HTMLElement);
}

/**
 * @param {{
 *   header: HTMLElement,
 *   sections: HTMLElement[],
 *   root?: HTMLElement | null,
 * }} opts
 */
export function initScrollLinkedHeader({ header, sections, root = null }) {
  const targets = collectGroundTargets(header, root);
  if (!targets.length || !sections.length) return () => {};

  let activeId = '';
  let raf = 0;

  const apply = (section) => {
    const id = section.id || section.querySelector('.post-card')?.id || String(sections.indexOf(section));
    if (id === activeId) return;
    activeId = id;

    const isHero = section.classList.contains('collection-hero');
    if (isHero) {
      applyGroundToTargets(targets, null, null);
      return;
    }

    const ground = groundFromSection(section);
    const card = section.querySelector('.post-card');
    applyGroundToTargets(targets, ground, card);
  };

  const measure = () => {
    raf = 0;
    const headerH = header.getBoundingClientRect().height;
    const probe = window.scrollY + headerH + 12;
    let active = sections[0];

    for (const section of sections) {
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= probe) active = section;
      else break;
    }

    apply(active);
  };

  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(measure);
  };

  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    cancelAnimationFrame(raf);
    for (const el of targets) stripGroundFromElement(el);
    activeId = '';
  };
}

/** @param {HTMLElement} root */
export function collectScrollSections(root) {
  return [
    ...root.querySelectorAll('.collection-hero'),
    ...root.querySelectorAll('#posters > .post-card-wrap:not(.reader-more-cases-wrap)')
  ].filter((n) => n instanceof HTMLElement);
}
