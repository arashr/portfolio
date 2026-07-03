/** @typedef {{ id: string, label: string, family: string, stack: string, google?: string | null, note?: string }} FontOption */

/** @type {FontOption[]} */
export const BODY_FONTS = [
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: 'Space Grotesk',
    stack: '"Space Grotesk", system-ui, sans-serif',
    google: 'Space+Grotesk:wght@400;500;700'
  }
];

/** @type {FontOption[]} */
export const DISPLAY_FONTS = [
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: 'Space Grotesk',
    stack: '"Space Grotesk", system-ui, sans-serif',
    google: 'Space+Grotesk:wght@400;500;700'
  },
  {
    id: 'archivo-black',
    label: 'Archivo Black',
    family: 'Archivo Black',
    stack: '"Archivo Black", system-ui, sans-serif',
    google: 'Archivo+Black'
  },
  {
    id: 'bricolage-grotesque',
    label: 'Bricolage Grotesque',
    family: 'Bricolage Grotesque',
    stack: '"Bricolage Grotesque", system-ui, sans-serif',
    google: 'Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800'
  },
  {
    id: 'chakra-petch',
    label: 'Chakra Petch',
    family: 'Chakra Petch',
    stack: '"Chakra Petch", system-ui, sans-serif',
    google: 'Chakra+Petch:ital,wght@0,400;0,500;0,600;0,700;1,400'
  },
  {
    id: 'ultra',
    label: 'Ultra',
    family: 'Ultra',
    stack: '"Ultra", Georgia, serif',
    google: 'Ultra'
  },
  {
    id: 'dm-serif-display',
    label: 'DM Serif Display',
    family: 'DM Serif Display',
    stack: '"DM Serif Display", Georgia, serif',
    google: 'DM+Serif+Display:ital@0;1'
  },
  {
    id: 'unbounded',
    label: 'Unbounded',
    family: 'Unbounded',
    stack: '"Unbounded", system-ui, sans-serif',
    google: 'Unbounded:wght@400;700'
  },
  {
    id: 'oswald',
    label: 'Oswald',
    family: 'Oswald',
    stack: '"Oswald", system-ui, sans-serif',
    google: 'Oswald:wght@400;500;700'
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    family: 'IBM Plex Mono',
    stack: '"IBM Plex Mono", ui-monospace, monospace',
    google: 'IBM+Plex+Mono:wght@400;500;700'
  },
  {
    id: 'anton',
    label: 'Anton',
    family: 'Anton',
    stack: '"Anton", system-ui, sans-serif',
    google: 'Anton'
  }
];

/**
 * @param {FontOption[]} fonts
 * @param {string} id
 */
export function findFont(fonts, id) {
  return fonts.find((f) => f.id === id) ?? fonts[0];
}

/**
 * @param {FontOption} body
 * @param {FontOption} display
 */
export function buildFontsHref(body, display) {
  const families = [...new Set([body.google, display.google].filter(Boolean))];
  if (!families.length) return '';
  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}

/**
 * @param {HTMLElement} root
 * @param {FontOption} body
 * @param {FontOption} display
 */
export function applyPairing(root, body, display) {
  root.style.setProperty('--demo-body-font', body.stack);
  root.style.setProperty('--demo-display-font', display.stack);

  const link = document.getElementById('demo-fonts-link');
  if (link) {
    const href = buildFontsHref(body, display);
    link.href = href;
    link.disabled = !href;
  }
}
