#!/usr/bin/env node
/**
 * Split monolithic CSS into semantic modules. Preserves original cascade order.
 * Run: node scripts/refactor-css.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'assets');

function sliceLines(text, start, end) {
  return text.split('\n').slice(start - 1, end).join('\n').trimEnd();
}

function writeModule(relPath, content, banner) {
  const file = path.join(assets, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = content.trim() ? `${banner}\n\n${content.trim()}\n` : `${banner}\n`;
  fs.writeFileSync(file, body);
}

function readCss(name) {
  return fs.readFileSync(path.join(assets, name), 'utf8');
}

const site = readCss('site.css');
const reader = readCss('reader.css');
const portfolio = readCss('portfolio.css');

// --- site.css modules (line ranges inclusive) ---
const siteModules = [
  ['css/site/01-tokens.css', 1, 47, '/* Design tokens — config-backed custom properties */'],
  ['css/site/02-base.css', 49, 118, '/* Reset, document defaults, accessibility */'],
  ['css/site/03-typography.css', 120, 142, '/* Shared type: labels, crumbs, poster titles */'],
  ['css/site/04-grounds.css', 144, 220, '/* Ground surfaces — poster/card foreground tokens */'],
  ['css/site/05-effects.css', 222, 252, '/* Global motion chrome: shutter intro, scroll progress */'],
  ['css/site/06-chrome.css', 254, 349, '/* Site header, brand, navigation, search */'],
  ['css/site/07-layout.css', 351, 383, '/* Feed shells and search layout */'],
  ['css/site/08-poster-index.css', 385, 498, '/* Index cards, collection grid, latest strip */'],
  ['css/site/09-poster-hero.css', 500, 559, '/* Case-study collection hero */'],
  ['css/site/10-poster-feed.css', 561, 594, '/* Poster gallery feed containers */'],
  ['css/site/11-poster-card.css', 596, 832, '/* Post cards, glyph layer, toolbar */'],
  ['css/site/12-poster-titles.css', 834, 1051, '/* Title faces, bounds, post header/meta */'],
  ['css/site/13-prose.css', 1053, 1393, '/* Prose, halftone, tables, code blocks */'],
  ['css/site/14-utilities.css', 1395, 1431, '/* Reveal animation, card hover */'],
  ['css/site/15-chrome-misc.css', 1433, 1476, '/* Back to top, site footer */'],
  ['css/site/16-misc-pages.css', 1478, 1524, '/* Tag index, responsive header/index */'],
  ['css/site/17-print.css', 1526, 1543, '/* Print styles */'],
];

for (const [rel, start, end, banner] of siteModules) {
  writeModule(rel, sliceLines(site, start, end), banner);
}

// --- reader.css: landing/gallery blocks move to portfolio ---
const readerModules = [
  ['css/reader/01-page.css', 1, 5, '/* Reader zoom and page shell hooks */'],
  ['css/reader/02-page-visibility.css', 163, 173, '/* Landing/reader page visibility */'],
  ['css/reader/03-header.css', 266, 414, '/* Reader header — brand row, meta row, controls */'],
  ['css/reader/04-toc.css', 417, 528, '/* TOC drawer and nav highlight */'],
  ['css/reader/05-layout.css', 530, 674, '/* Reader grid, hero spacing, poster gallery, TOC rail */'],
  ['css/reader/06-controls.css', 676, 735, '/* Reader controls, theme toggle, reduced motion */'],
  ['css/reader/07-theme-dark.css', 737, 960, '/* Dark theme — chrome, TOC, hero, grounded posters */'],
  ['css/reader/08-filters.css', 962, 968, '/* Search filter visibility */'],
  ['css/reader/09-responsive.css', 970, 979, '/* Reader header responsive */'],
];

for (const [rel, start, end, banner] of readerModules) {
  writeModule(rel, sliceLines(reader, start, end), banner);
}

// --- portfolio: merge landing from reader + existing portfolio ---
const portfolioLandingReader = [
  sliceLines(reader, 7, 78),
  sliceLines(reader, 80, 161),
  sliceLines(reader, 175, 264),
].join('\n\n');

const portfolioModules = [
  [
    'css/portfolio/01-effects.css',
    sliceLines(portfolio, 1, 26),
    '/* Edge halftone footer decoration */',
  ],
  [
    'css/portfolio/02-landing-shell.css',
    portfolioLandingReader,
    '/* Landing page shell, gallery grid, footer, mini posters */',
  ],
  [
    'css/portfolio/03-landing-hero.css',
    sliceLines(portfolio, 28, 81),
    '/* Portfolio landing hero and gallery head */',
  ],
  [
    'css/portfolio/04-lightbox.css',
    sliceLines(portfolio, 83, 196),
    '/* Prose image lightbox */',
  ],
];

for (const [rel, content, banner] of portfolioModules) {
  writeModule(rel, content, banner);
}

// --- Entry points ---
const siteImports = siteModules.map(([rel]) => `@import url('${rel}');`).join('\n');
const readerImports = readerModules.map(([rel]) => `@import url('${rel}');`).join('\n');
const portfolioImports = portfolioModules.map(([rel]) => `@import url('${rel}');`).join('\n');

fs.writeFileSync(
  path.join(assets, 'site.css'),
  `/* Site design system — shared tokens, posters, prose */\n${siteImports}\n`
);
fs.writeFileSync(
  path.join(assets, 'reader.css'),
  `/* Reader app — header, TOC, layout, dark theme */\n${readerImports}\n`
);
fs.writeFileSync(
  path.join(assets, 'portfolio.css'),
  `/* Portfolio app — landing, lightbox, edge halftone */\n${portfolioImports}\n`
);

// --- README ---
fs.writeFileSync(
  path.join(assets, 'css', 'README.md'),
  `# CSS architecture

Styles load in this order (\`index.html\`):

1. **site.css** — design system shared by landing and reader
2. **reader.css** — case-study reader chrome and layout
3. **portfolio.css** — landing page, lightbox, edge halftone

Each entry file only \`@import\`s modules under this directory. Edit the module that matches the UI you are changing.

## site/

| Module | Concern |
|--------|---------|
| \`01-tokens.css\` | \`:root\` custom properties |
| \`02-base.css\` | Reset, \`body\`, skip link, focus |
| \`03-typography.css\` | Labels, crumbs, base poster title |
| \`04-grounds.css\` | Ground color surfaces on cards/posters |
| \`05-effects.css\` | Shutter intro, scroll progress |
| \`06-chrome.css\` | Header, nav, search |
| \`07-layout.css\` | Content/collection feed shells |
| \`08-poster-index.css\` | Index cards and collection grid |
| \`09-poster-hero.css\` | Case-study hero block |
| \`10-poster-feed.css\` | Poster list containers |
| \`11-poster-card.css\` | Post card surface, toolbar, export |
| \`12-poster-titles.css\` | Title faces and post header |
| \`13-prose.css\` | Markdown prose, code, tables, images |
| \`14-utilities.css\` | Reveal animation |
| \`15-chrome-misc.css\` | Back to top, footer |
| \`16-misc-pages.css\` | Tag index, responsive tweaks |
| \`17-print.css\` | Print |

## reader/

| Module | Concern |
|--------|---------|
| \`01-page.css\` | Reader zoom |
| \`02-page-visibility.css\` | Show/hide landing vs reader |
| \`03-header.css\` | Two-row reader header |
| \`04-toc.css\` | Contents drawer |
| \`05-layout.css\` | 12-column grid, TOC rail |
| \`06-controls.css\` | Buttons, theme toggle |
| \`07-theme-dark.css\` | Dark mode overrides |
| \`08-filters.css\` | Poster search filter |
| \`09-responsive.css\` | Narrow header |

## portfolio/

| Module | Concern |
|--------|---------|
| \`01-effects.css\` | Edge halftone |
| \`02-landing-shell.css\` | Landing layout, mini posters, footer |
| \`03-landing-hero.css\` | Hero copy, gallery head |
| \`04-lightbox.css\` | Image lightbox |

## Naming conventions

- **Block__element** — BEM for component parts (\`reader-header__meta\`, \`post-card__toolbar\`)
- **Page prefix** — \`page-reader\`, \`page-landing\` scope layout overrides
- **Ground tokens** — \`ground-*\` classes from config; paired rules in \`04-grounds.css\`
- **Chrome** — header controls using solid ink stroke/shadow (\`--chrome-*\` tokens)
`
);

console.log('CSS modules written under assets/css/');
console.log('Entry points updated: site.css, reader.css, portfolio.css');
