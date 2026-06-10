# CSS architecture

Styles load in this order (`index.html`):

1. **site.css** — design system shared by landing and reader
2. **reader.css** — case-study reader chrome and layout
3. **portfolio.css** — landing page, lightbox, edge halftone

Each entry file only `@import`s modules under this directory. Edit the module that matches the UI you are changing.

## site/

| Module | Concern |
|--------|---------|
| `01-tokens.css` | `:root` custom properties |
| `02-base.css` | Reset, `body`, skip link, focus |
| `03-typography.css` | Labels, crumbs, base poster title |
| `04-grounds.css` | Ground surfaces + `--on-ground-*` foreground (maps `.ground-*` to tokens) |
| `05-effects.css` | Shutter intro, scroll progress |
| `06-chrome.css` | Header, nav, search |
| `07-layout.css` | Content/collection feed shells |
| `08-poster-index.css` | Index cards and collection grid |
| `09-poster-hero.css` | Case-study hero block |
| `10-poster-feed.css` | Poster list containers |
| `11-poster-card.css` | Post card surface, toolbar, export |
| `12-poster-titles.css` | Title faces and post header |
| `13-prose.css` | Markdown prose, code, tables, images |
| `14-utilities.css` | Reveal animation |
| `15-chrome-misc.css` | Back to top, footer |
| `16-misc-pages.css` | Tag index, responsive tweaks |
| `17-print.css` | Print |

## reader/

| Module | Concern |
|--------|---------|
| `01-page.css` | Reader zoom |
| `02-page-visibility.css` | Show/hide landing vs reader |
| `03-header.css` | Two-row reader header |
| `04-toc.css` | Contents drawer |
| `05-layout.css` | 12-column grid, TOC rail |
| `06-controls.css` | Buttons, theme toggle |
| `07-theme-dark.css` | Dark mode overrides |
| `08-filters.css` | Poster search filter |
| `09-responsive.css` | Narrow header |

## portfolio/

| Module | Concern |
|--------|---------|
| `01-effects.css` | Edge halftone |
| `02-landing-shell.css` | Landing layout, mini posters, footer |
| `03-landing-hero.css` | Hero copy, gallery head |
| `04-lightbox.css` | Image lightbox |

## Naming conventions

- **Block__element** — BEM for component parts (`reader-header__meta`, `post-card__toolbar`)
- **Page prefix** — `page-reader`, `page-landing` scope layout overrides
- **Ground tokens** — primaries in `01-tokens.css` (`--color-ground-*`); semantics in `04-grounds.css`; config lists grounds + glyph overrides only
- **Chrome** — header controls using solid ink stroke/shadow (`--chrome-*` tokens)
