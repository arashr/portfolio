/**
 * Scroll-linked reader header — matches active section ground + display font.
 * Demo-only (full-bleed variant).
 */

const GROUND_RE = /^ground-/;
const FACE_RE = /^title-face-/;

/** @param {Element} el @param {RegExp} re */
function classToken(el, re) {
  return [...el.classList].find((c) => re.test(c)) ?? null;
}

/**
 * @param {HTMLElement} section
 * @returns {{ ground: string | null, face: string | null, title: string | null }}
 */
function tokensFromSection(section) {
  const wrap = section.classList.contains('post-card-wrap')
    ? section
    : section.querySelector('.post-card-wrap') ?? section;
  const card = section.querySelector('.post-card') ?? (section.classList.contains('post-card') ? section : null);

  const ground =
    classToken(wrap, GROUND_RE) ?? (card ? classToken(card, GROUND_RE) : null);
  const face = card ? classToken(card, FACE_RE) : null;
  const title =
    card?.querySelector('.post-title')?.textContent?.trim() ??
    section.querySelector('.poster__title')?.textContent?.trim() ??
    null;

  return { ground, face, title };
}

/**
 * @param {HTMLElement} header
 */
function stripHeaderTokens(header) {
  for (const cls of [...header.classList]) {
    if (GROUND_RE.test(cls) || FACE_RE.test(cls) || cls === 'demo-swiss-header--paper') {
      header.classList.remove(cls);
    }
  }
}

/**
 * @param {{
 *   header: HTMLElement,
 *   sections: HTMLElement[],
 *   heroLabel?: string,
 *   heroTitle?: string
 * }} opts
 */
export function initScrollLinkedHeader({ header, sections, heroLabel = 'Case study', heroTitle = '' }) {
  if (!header || !sections.length) return () => {};

  const brand = header.querySelector('.site-header__brand');
  const role = header.querySelector('.reader-header__role');
  let activeId = '';
  let raf = 0;

  const apply = (section) => {
    const id = section.id || section.querySelector('.post-card')?.id || String(sections.indexOf(section));
    if (id === activeId) return;
    activeId = id;

    const { ground, face, title } = tokensFromSection(section);
    const isHero = section.classList.contains('collection-hero');

    stripHeaderTokens(header);
    if (ground) {
      header.classList.add(ground);
    } else {
      header.classList.add('demo-swiss-header--paper');
    }
    if (face) header.classList.add(face);

    const card = section.querySelector('.post-card');
    if (card && ground) {
      const cs = getComputedStyle(card);
      header.style.backgroundColor = cs.backgroundColor;
      for (const name of cs) {
        if (name.startsWith('--on-ground') || name === '--surface') {
          header.style.setProperty(name, cs.getPropertyValue(name));
        }
      }
    } else {
      header.style.backgroundColor = '';
      for (const name of [...header.style]) {
        if (name.startsWith('--on-ground') || name === '--surface') {
          header.style.removeProperty(name);
        }
      }
    }

    if (brand) {
      if (isHero && heroTitle) {
        brand.textContent = heroTitle;
        brand.style.fontFamily = '';
        brand.style.letterSpacing = '';
      } else if (title) {
        brand.textContent = title;
        const postTitle = section.querySelector('.post-title');
        if (postTitle) {
          const cs = getComputedStyle(postTitle);
          brand.style.fontFamily = cs.fontFamily;
          brand.style.letterSpacing = cs.letterSpacing;
        }
      }
    }

    if (role) {
      role.textContent = isHero ? heroLabel : title ?? heroLabel;
    }
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
  };
}

/** @param {HTMLElement} root */
export function collectScrollSections(root) {
  return [
    ...root.querySelectorAll('.collection-hero'),
    ...root.querySelectorAll('#posters > .post-card-wrap:not(.reader-more-cases-wrap)')
  ].filter((n) => n instanceof HTMLElement);
}
