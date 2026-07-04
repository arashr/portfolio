# CSS architecture

Styles load in this order (`index.html`):

1. **site.css** — design system shared by landing and reader
2. **reader.css** — case-study reader chrome and layout
3. **portfolio.css** — landing page, lightbox, custom cursor

Each entry file only `@import`s modules under this directory.

## site/

| Module | Concern |
|--------|---------|
| `01-tokens.css` | `:root` custom properties |
| `02-base.css` | Reset, `body`, skip link, focus |
| `03-typography.css` | Labels, base poster title |
| `04-grounds.css` | Ground surfaces + `--on-ground-*` foreground |
| `06-chrome.css` | Site header, brand |
| `07-layout.css` | Content/collection feed shells |
| `08-poster-index.css` | Collection hero intro copy |
| `09-poster-hero.css` | Case-study hero block |
| `10-poster-feed.css` | Poster list containers |
| `11-poster-card.css` | Post card surface, glyph layer |
| `12-poster-titles.css` | Title faces and post header |
| `13-prose.css` | Markdown prose, code, tables, images |
| `15-chrome-misc.css` | Back to top, footer |
| `16-misc-pages.css` | Responsive header tweaks |
| `17-print.css` | Print |
| `18-site-header-reader.css` | Reader header chrome |
| `19-chrome-links.css` | Inline links outside posters |

## reader/

| Module | Concern |
|--------|---------|
| `01-page.css` | Reader page shell |
| `02-page-visibility.css` | Show/hide landing vs reader |
| `03-header.css` | Two-row reader header |
| `04-toc.css` | Contents drawer |
| `05-layout.css` | 12-column grid, TOC rail |
| `06-controls.css` | Buttons, reduced motion |
| `07-theme-dark.css` | Site appearance tokens (fixed dark theme) |
| `10-more-cases.css` | Related case studies below reader |
| `11-poster-full-bleed.css` | Full-bleed reader posters, inner content grid |
| `12-title-bleed.css` | Title bleed rhythm between posters |
| `13-scroll-linked-header.css` | Scroll-linked reader header |

## portfolio/

| Module | Concern |
|--------|---------|
| `02-landing-shell.css` | Landing layout, mini posters, footer |
| `03-landing-hero.css` | Brand home button, landing errors |
| `04-lightbox.css` | Image lightbox |
| `06-landing-mosaic.css` | Homepage mosaic posters |
| `07-custom-cursor.css` | Custom cursor |

## Naming conventions

- **Block__element** — BEM for component parts (`reader-header__meta`, `post-card__glyph-layer`)
- **Page prefix** — `page-reader`, `page-landing` scope layout overrides
- **Ground tokens** — primaries in `01-tokens.css`; semantics in `04-grounds.css`
- **Chrome** — header controls using solid ink stroke/shadow (`--chrome-*` tokens)
